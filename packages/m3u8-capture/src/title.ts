import { cleanText, isInIframeMode } from './utils';

/**
 * 标题解析模块
 *
 * 优先级（由高到低）：
 * 1. `《作品名》`：中文站点常用书名号包裹影视剧/动漫名，命中时直接作为标题基准
 * 2. 页面结构化标题：`og:title` / `twitter:title` / `h1` / `h2` / `.title` 等，按可信度打分
 * 3. `document.title`：按常见分隔符切掉站点名后缀
 * 4. 剧集信息补齐：把「第03集」「第一季」等信息补回标题，避免《作品名》场景丢失集数
 */

/** 站点名后缀分隔符，如「标题 - 站点」「标题_站点」「标题 | 站点」 */
const TITLE_SEPARATOR_RE = /\s+[-–—_|·・－]\s+/;

/** 剧集信息，如「第一季」「第03集」「第12话」 */
const EPISODE_RE = /第\s*[0-9０-９一二三四五六七八九十百零]+\s*[季集話话期]/g;

/** 《作品名》 */
const BRACKET_RE = /《([^《》]{1,80})》/;

/** 没有信息量的通用标题，出现时应直接忽略 */
const GENERIC_TITLES = new Set([
  '',
  '播放',
  '视频',
  '正片',
  '完整版',
  '高清',
  '高清在线',
  '在线观看',
  '在线播放',
  '免费观看',
  '观看',
  '下载',
  '视频播放',
  '剧集',
  '电影',
  '动漫',
  '首页',
  '视频首页',
  '加载中',
  '正在播放',
  'play',
  'video',
]);

/** 结构化标题候选：选择器 + 基础分值（分值越高越可信） */
const TITLE_SELECTORS: Array<{ selector: string; score: number }> = [
  { selector: 'h1', score: 100 },
  { selector: 'h2', score: 85 },
  { selector: 'h3', score: 60 },
  { selector: '.title, .sub-title, [class*="title"], [id*="title"]', score: 70 },
];

/** meta 标签候选：选择器 + 基础分值 */
const META_SELECTORS: Array<{ selector: string; score: number }> = [
  { selector: 'meta[property="og:title"]', score: 95 },
  { selector: 'meta[name="twitter:title"]', score: 90 },
  { selector: 'meta[itemprop="name"]', score: 80 },
];

interface TitleCandidate {
  text: string;
  score: number;
  /** meta 标签里的标题通常带站点后缀，需要按分隔符切分 */
  splittable: boolean;
}

/** 标题解析结果缓存：同一页面标题/地址下不重复扫描 DOM */
const titleCache = new WeakMap<Document, { key: string; value: string }>();

/** 是否为「没有信息量」的标题 */
export function isWeakTitle(text: string | null | undefined): boolean {
  const t = cleanText(text).toLowerCase();
  if (!t) return true;
  if (GENERIC_TITLES.has(t)) return true;
  // 纯剧集编号，如「第03集」
  if (/^第\s*[0-9０-９一二三四五六七八九十百零]+\s*[季集話话期]$/.test(t)) return true;
  // 只有标点/符号，没有任何文字或数字
  if (!/[\p{L}\p{N}]/u.test(t)) return true;
  return false;
}

/** 提取《作品名》 */
export function extractBracketTitle(text: string | null | undefined): string {
  const matched = BRACKET_RE.exec(cleanText(text));
  return matched ? cleanText(matched[1]) : '';
}

/** 提取剧集信息，如「第一季」「第03集」 */
export function extractEpisodeInfo(text: string | null | undefined): string[] {
  const t = cleanText(text);
  if (!t) return [];

  const result: string[] = [];
  for (const matched of t.matchAll(EPISODE_RE)) {
    const item = cleanText(matched[0]);
    if (item && !result.includes(item)) result.push(item);
  }
  return result;
}

/** 按分隔符切掉站点名后缀，取第一段 */
export function splitPageTitle(title: string | null | undefined): string {
  const t = cleanText(title);
  if (!t) return '';

  const parts = t
    .split(TITLE_SEPARATOR_RE)
    .map(part => cleanText(part))
    .filter(Boolean);

  return parts.length > 1 ? parts[0] : t;
}

/** 元素是否可见（不可见的标题多为 SEO 占位或移动端隐藏副本） */
function visibilityPenalty(el: Element): number {
  if (typeof HTMLElement === 'undefined' || !(el instanceof HTMLElement)) return 0;
  if (el.hidden) return -40;

  const style = window.getComputedStyle(el);
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return -40;

  // 元素完全没有布局信息（被隐藏或已移除）时降权
  if (el.isConnected && el.getClientRects().length === 0) return -40;

  return 0;
}

/** 元素是否位于导航/侧栏等区域（这类位置的标题可信度低） */
function contextPenalty(el: Element): number {
  try {
    if (typeof el.closest === 'function' && el.closest('nav, header, aside, footer, [role="navigation"]')) return -40;
  } catch (_e) {
    // ignore
  }
  return 0;
}

/** 标题长度是否合理 */
function lengthBonus(text: string): number {
  const len = text.length;
  if (len >= 4 && len <= 60) return 15;
  return 0;
}

/** 收集页面上的标题候选 */
function collectCandidates(doc: Document): TitleCandidate[] {
  const candidates: TitleCandidate[] = [];

  // 1) meta 标签
  for (const { selector, score } of META_SELECTORS) {
    const el = doc.querySelector(selector);
    const text = cleanText(el?.getAttribute('content'));
    if (text && text.length <= 120) candidates.push({ text, score, splittable: true });
  }

  // 2) 页面结构化标题
  for (const { selector, score } of TITLE_SELECTORS) {
    let elements: Element[] = [];
    try {
      elements = Array.from(doc.querySelectorAll(selector));
    } catch (_e) {
      continue;
    }

    for (const el of elements.slice(0, 8)) {
      const text = cleanText(el.textContent);
      if (!text || text.length > 120) continue;

      candidates.push({
        text,
        score: score + visibilityPenalty(el) + contextPenalty(el) + lengthBonus(text),
        splittable: false,
      });
    }
  }

  return candidates;
}

/** 计算页面标题（不含用户配置的替换规则） */
function computeMediaTitle(doc: Document): string {
  const docTitle = cleanText(doc.title);
  const candidates = collectCandidates(doc).sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // 1) 《作品名》优先作为标题基准
  let bracket = '';
  let bracketSource = '';
  for (const candidate of candidates) {
    const found = extractBracketTitle(candidate.text);
    if (found) {
      bracket = found;
      bracketSource = candidate.text;
      break;
    }
  }
  if (!bracket) {
    bracket = extractBracketTitle(docTitle);
    bracketSource = docTitle;
  }

  // 2) 标题基准
  let base = '';
  if (bracket) {
    base = bracket;
  } else if (best && !isWeakTitle(best.text)) {
    base = best.splittable ? splitPageTitle(best.text) : best.text;
  } else {
    base = splitPageTitle(docTitle);
  }
  if (!base) base = best ? best.text : docTitle;

  // 3) 补齐剧集信息，避免《作品名》场景丢失集数
  const episodes = [...extractEpisodeInfo(docTitle), ...extractEpisodeInfo(bracketSource)];
  for (const episode of episodes) {
    if (episode && !base.includes(episode)) base = `${base} ${episode}`;
  }

  return cleanText(base);
}

/** iframe 模式下优先使用顶层文档的标题 */
function resolveSourceDocument(doc: Document): Document {
  if (!isInIframeMode) return doc;

  try {
    const topDoc = window.top?.document;
    if (topDoc) return topDoc;
  } catch (_e) {
    // 跨域 iframe 无法访问顶层文档，退回当前文档
  }

  return doc;
}

/**
 * 解析页面媒体标题（不含用户配置的替换规则）
 *
 * 结果按「页面标题 + 页面地址」缓存，SPA 切换后会自动失效重新计算。
 */
export function resolveMediaTitle(doc: Document = document): string {
  const source = resolveSourceDocument(doc);
  const cacheKey = `${source.title}|${source.location?.href ?? ''}`;

  const cached = titleCache.get(source);
  if (cached && cached.key === cacheKey) return cached.value;

  const value = computeMediaTitle(source);
  titleCache.set(source, { key: cacheKey, value });

  return value;
}

/**
 * 从多个来源中挑选最终标题
 *
 * 页面标题已经过规范化（书名号、剧集信息、站点后缀），因此以它为基准；
 * 显式标题（video[title]、链接文本）只在页面标题不可用时顶上，或用于补齐剧集信息。
 */
export function composeMediaTitle(explicit: string, page: string, stored: string): string {
  const explicitTitle = cleanText(explicit);
  const pageTitle = cleanText(page);
  const storedTitle = cleanText(stored);

  // 1) 页面标题可用时以它为基准；若显式标题明显更完整，则改用显式标题
  if (pageTitle && !isWeakTitle(pageTitle)) {
    let result = pageTitle;
    const explicitIsRicher =
      !!explicitTitle &&
      !isWeakTitle(explicitTitle) &&
      explicitTitle !== pageTitle &&
      !pageTitle.includes(explicitTitle) &&
      explicitTitle.length > pageTitle.length + 4;
    if (explicitIsRicher) result = explicitTitle;

    // 补齐显式标题中的剧集信息
    for (const episode of extractEpisodeInfo(explicitTitle)) {
      if (!result.includes(episode)) result = `${result} ${episode}`;
    }
    return cleanText(result);
  }

  // 2) 页面标题不可用：退到显式标题 / 历史标题
  for (const candidate of [explicitTitle, storedTitle]) {
    if (candidate && !isWeakTitle(candidate)) return candidate;
  }

  // 3) 全是弱标题：保留剧集编号，并尝试与页面标题组合
  const episode = [explicitTitle, pageTitle, storedTitle].map(candidate => extractEpisodeInfo(candidate)[0]).find(Boolean) ?? '';
  if (episode) {
    const base = pageTitle || storedTitle;
    if (base && !base.includes(episode)) return cleanText(`${base} ${episode}`);
    return episode;
  }

  // 4) 兜底
  return pageTitle || explicitTitle || storedTitle || '';
}
