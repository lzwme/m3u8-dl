import { Request, color } from '@lzwme/fe-utils';
import { formatHeaders, logger } from './utils.js';
import type { OutgoingHttpHeaders } from 'node:http';

export interface GetM3u8UrlsOption {
  url: string;
  /** 播放子页面 URL 特征规则 */
  subUrlRegex?: string | RegExp;
  headers?: OutgoingHttpHeaders | string;
  deep?: number;
  visited?: Set<string>;
}

function getFormatTitle(text: string) {
  if (typeof text !== 'string' || !text) return '';
  if (/^\d+$/.test(text)) return text;

  const match = /第(\d+)(集|期)/.exec(text);
  if (match) return match[0];
  return '';
}

/** 从指定的 url 页面中提取 m3u8 播放地址。deep 指定搜索页面深度 */
export async function getM3u8Urls(opts: GetM3u8UrlsOption) {
  const options = { headers: {}, deep: 1, visited: new Set<string>(), ...opts };
  const baseUrl = new URL(options.url).origin;

  const req = new Request({
    headers: { 'content-type': 'text/html; charset=UTF-8', referer: baseUrl, ...formatHeaders(options.headers) },
    reqOptions: { rejectUnauthorized: false },
  });
  const { data: html, response } = await req.get<string>(options.url);
  const m3u8Urls: Map<string, string> = new Map();

  if (!response.statusCode || response.statusCode >= 400) {
    logger.error('获取页面失败:', color.red(options.url), response.statusCode, response.statusMessage, html);
    return m3u8Urls;
  }

  // 从 html 中正则匹配提取 m3u8
  const m3u8Regex = /https?:[^\s'":]+\.(m3u8|mp4)(\?[^\s'"]*)?/gi;

  // 1. 直接正则匹配 m3u8 地址
  let match = m3u8Regex.exec(html);
  const title = (/<title>([^<]+)</.exec(html)?.[1].split('-')[0] || '').replace(/在线播放|在线观看|详情|介绍|《|》/g, '').trim();
  while (match) {
    const href = match[0].replaceAll('\\/', '/');
    match = m3u8Regex.exec(html);
    if (!m3u8Urls.has(href)) m3u8Urls.set(href, getFormatTitle(title) || title);
  }

  // 找到了多个链接，修改 title 添加序号
  if (m3u8Urls.size > 3 && !/第\d+(集|期)/.test(title)) {
    let idx = 1;
    for (const [key] of m3u8Urls) {
      m3u8Urls.set(key, `${title}第${String(++idx).padStart(2, '0')}集`);
    }
  }

  // 2. 若未找到且深度大于 0，则获取所有 a 标签的 href 并递归查找
  if (m3u8Urls.size === 0 && options.deep > 0) {
    logger.debug('未获取到 m3u8 地址', color.gray(options.url), html.length);
    options.visited.add(options.url);

    const aTagRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let aMatch = aTagRegex.exec(html);
    const subPageUrls = new Map<string, string>();
    let failedSubPages = 0;

    while (aMatch) {
      const href = aMatch[1] ? new URL(aMatch[1], baseUrl).toString() : '';
      const text = aMatch[2].replace(/<[^>]+>/g, '');

      aMatch = aTagRegex.exec(html);

      if (!href || options.visited.has(href) || !href.startsWith(baseUrl)) continue;
      if (options.subUrlRegex) {
        if (typeof options.subUrlRegex === 'string') {
          options.subUrlRegex = new RegExp(options.subUrlRegex.replaceAll(/\*+/g, '.+'));
        }
        if (!options.subUrlRegex.test(href)) continue;
      } else if (!/集|期|HD|高清|抢先|BD/.test(text)) continue;

      subPageUrls.set(href, text);
      logger.debug(' > 提取到子页面: ', color.gray(href), text);
    }

    for (const [href, text] of subPageUrls) {
      try {
        options.visited.add(href);
        const subUrls = await getM3u8Urls({ ...options, url: href, deep: options.deep - 1 });
        logger.debug(' > 从子页面提取: ', color.gray(href), text, subUrls);

        if (subUrls.size === 0 && m3u8Urls.size === 0) {
          failedSubPages++;
          if (failedSubPages > 3) {
            logger.warn(`连续查找 ${failedSubPages} 个子页面均未获取到，不再继续`, options.url, href);
            return m3u8Urls;
          }
        }

        for (const [u, t] of subUrls) {
          let stitle = t;
          for (const s of [text, t, m3u8Urls.get(u) || '']) {
            const ft = getFormatTitle(s);
            if (ft) {
              stitle = ft;
              break;
            }
          }

          logger.debug(' > m3u8地址: ', color.gray(u), color.green(stitle));
          m3u8Urls.set(u, stitle.trim());
        }
      } catch (err) {
        logger.warn(' > 尝试访问子页面异常: ', color.red(href), (err as Error).message);
      }
    }
  }

  return m3u8Urls;
}
// logger.updateOptions({ levelType: 'debug' });
// getM3u8Urls(process.argv.slice(2)[0]).then(d => console.log(d));
