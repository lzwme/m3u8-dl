import { ReqFetch, color } from '@lzwme/fe-utils';
import { logger } from './utils.js';

/** 从指定的 url 页面中提取 m3u8 播放地址。deep 指定搜索页面深度 */
export async function getM3u8Urls(url: string, deep = 2, visited = new Set<string>()) {
  const req = new ReqFetch({ headers: { 'content-type': 'text/html; charset=UTF-8' }, reqOptions: {} });
  const { data: html } = await req.get<string>(url);

  // 从 html 中正则匹配提取 m3u8
  const m3u8Urls: Map<string, string> = new Map();
  const m3u8Regex = /https?:[^\s'"]+\.m3u8(\?[^\s'"]*)?/gi;

  // 1. 直接正则匹配 m3u8 地址
  let match = m3u8Regex.exec(html);
  const title = (/<title>([^<]+)</.exec(html)?.[1].split('-')[0] || '').replace(/在线播放|详情|介绍|《|》/g, '').trim();
  while (match) {
    const href = match[0].replaceAll('\\/', '/');
    match = m3u8Regex.exec(html);
    if (!m3u8Urls.has(href)) m3u8Urls.set(href, title);
  }

  // 找到了多个链接，修改 title 添加序号
  if (m3u8Urls.size > 3 && !/第.+(集|期)/.test(title)) {
    let idx = 1;
    for (const [key] of m3u8Urls) {
      m3u8Urls.set(key, `${title}第${String(idx++).padStart(2, '0')}集`);
    }
  }

  // 2. 若未找到且深度大于 0，则获取所有 a 标签的 href 并递归查找
  if (m3u8Urls.size === 0 && deep > 0) {
    logger.debug('未获取到 m3u8 地址', color.gray(url), html.length);
    visited.add(url);

    const aTagRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let aMatch = aTagRegex.exec(html);
    const origin = new URL(url).origin;
    const subPageUrls = new Map<string, string>();
    let failedSubPages = 0;

    while (aMatch) {
      const href = aMatch[1] ? new URL(aMatch[1], origin).toString() : '';
      const text = aMatch[2].replace(/<[^>]+>/g, '');

      aMatch = aTagRegex.exec(html);
      if (!href || visited.has(href) || !href.startsWith(origin)) continue;
      if (!/集|期|HD|高清|抢先|BD/.test(text)) continue;

      subPageUrls.set(href, text);
    }

    for (const [href, text] of subPageUrls) {
      try {
        visited.add(href);
        const subUrls = await getM3u8Urls(href, deep - 1, visited);
        logger.debug(' > 从子页面提取: ', color.gray(href), text, subUrls.size);

        if (subUrls.size === 0 && m3u8Urls.size === 0) {
          failedSubPages++;
          if (failedSubPages > 3) {
            logger.warn(`连续查找 ${failedSubPages} 个子页面均未获取到，不再继续`, url, href);
            return m3u8Urls;
          }
        }

        for (const [u, t] of subUrls) m3u8Urls.set(u, subUrls.size === 1 || /第.+(集|期)/.test(t) ? t : text);
      } catch (err) {
        logger.warn(' > 尝试访问子页面异常: ', color.red(href), (err as Error).message);
      }
    }
  }

  return m3u8Urls;
}
// logger.updateOptions({ levelType: 'debug' });
// getM3u8Urls(process.argv.slice(2)[0]).then(d => console.log(d));
