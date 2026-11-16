/**
 * 请求头相关工具
 *
 * 请求头在前端统一使用 `Key: Value` 每行一条的文本格式，
 * 与后端 `formatHeaders` 的解析规则保持一致。
 */

export interface HeaderTemplate {
  /** 模板名称（国际化后的文本） */
  name: string;
  /** 模板内容，`Key: Value` 每行一条 */
  value: string;
}

/** 单条请求头。key 保留原始大小写用于展示，比较时统一转小写 */
export interface HeaderEntry {
  key: string;
  value: string;
}

/**
 * 获取快捷请求头模板
 * @param t 国际化翻译函数
 */
export function getHeaderTemplates(t: (key: string) => string): HeaderTemplate[] {
  return [
    { name: t('newDownload.headerWeibo'), value: 'Referer: https://weibo.com/\nCookie: ' },
    {
      name: t('newDownload.headerDouyin'),
      value: 'Referer: https://www.douyin.com/\nUser-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    },
    {
      name: t('newDownload.headerBili'),
      value: 'Referer: https://www.bilibili.com/\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  ];
}

/**
 * 解析请求头文本
 * @param text `Key: Value` 每行一条的文本
 * @returns 保留原始键名大小写的条目数组；同名（不区分大小写）后者覆盖前者
 */
export function parseHeaderText(text?: string): HeaderEntry[] {
  const entries: HeaderEntry[] = [];
  const index = new Map<string, number>();

  (text || '').split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx <= 0) return;
    const key = line.slice(0, idx).trim();
    if (!key) return;
    const value = line.slice(idx + 1).trim();
    const lower = key.toLowerCase();

    if (index.has(lower)) {
      entries[index.get(lower) as number].value = value;
    } else {
      index.set(lower, entries.length);
      entries.push({ key, value });
    }
  });

  return entries;
}

/**
 * 合并两段请求头文本
 *
 * 后者覆盖前者中同名的请求头（HTTP 请求头不区分大小写），
 * 用于把「全局默认请求头」与「单个任务的请求头」合并到一起。
 *
 * @param base 基础请求头（如全局默认请求头）
 * @param override 覆盖请求头（如单个任务的请求头）
 */
export function mergeHeaderText(base?: string, override?: string): string {
  const entries = parseHeaderText(base);
  const overrideEntries = parseHeaderText(override);
  const index = new Map<string, number>();
  entries.forEach((entry, i) => index.set(entry.key.toLowerCase(), i));

  overrideEntries.forEach(entry => {
    const lower = entry.key.toLowerCase();
    if (index.has(lower)) {
      entries[index.get(lower) as number].value = entry.value;
    } else {
      index.set(lower, entries.length);
      entries.push({ ...entry });
    }
  });

  return entries.map(entry => `${entry.key}: ${entry.value}`).join('\n');
}

/**
 * 将请求头对象转换为 `Key: Value` 换行分隔的文本
 *
 * 与后端 `headersToText` 规则保持一致，用于配置回显与持久化，
 * 避免对象→文本的转换逻辑在多处重复。
 */
export function headersToText(headers?: Record<string, unknown> | string | null): string {
  if (!headers) return '';
  if (typeof headers === 'string') return headers;

  return Object.entries(headers)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');
}

/**
 * 读取快捷模板下拉当前选中的值，并重置下拉以便再次选择同一模板
 * @returns 选中的模板文本；未选择时返回空串
 */
export function readHeaderTemplateValue(event: Event): string {
  const target = event.target as HTMLSelectElement;
  const value = target.value;
  target.value = '';
  return value;
}
