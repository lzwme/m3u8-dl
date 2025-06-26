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
  while (match) {
    const title = (/<title>([^<]+)</.exec(html)?.[1].split('-')[0] || '').replace(/在线播放|《|》/g, '');
    const href = match[0].replaceAll('\\/', '/');
    if (!m3u8Urls.has(href)) m3u8Urls.set(href, title);
    match = m3u8Regex.exec(html);
  }

  // 2. 若未找到且深度大于 0，则获取所有 a 标签的 href 并递归查找
  if (m3u8Urls.size === 0 && deep > 0) {
    logger.debug('未获取到 m3u8 地址', color.gray(url), html.length);
    visited.add(url);

    const aTagRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let aMatch = aTagRegex.exec(html);
    const origin = new URL(url).origin;

    while (aMatch) {
      const href = aMatch[1] ? new URL(aMatch[1], origin).toString() : '';
      const text = aMatch[2];

      aMatch = aTagRegex.exec(html);
      if (!href || visited.has(href) || !href.startsWith(origin) || !/集|HD|高清|播放/.test(text)) continue;

      visited.add(href);
      try {
        const subUrls = await getM3u8Urls(href, deep - 1, visited);
        logger.debug(' > 从子页面提取: ', color.gray(href), text, subUrls.size);
        for (const [u, t] of subUrls) m3u8Urls.set(u, t || text);
      } catch (err) {
        logger.warn(' > 尝试访问子页面异常: ', color.red(href), (err as Error).message);
      }
    }
  }

  return m3u8Urls;
}
// logger.updateOptions({ levelType: 'debug' });
// getM3u8Urls(process.argv.slice(2)[0]).then(d => console.log(d));
