import { Request } from '@lzwme/fe-utils';
import type { SearchApi, VideoDetailsResult, VideoSearchResult } from '../../types';
import { type M3u8StorConfig } from '../storage.js';

const req = new Request(null, {
  'content-type': 'application/json; charset=UTF-8',
});

export interface VSOptions {
  /** 采集站地址 */
  api?: string;
  /** 站点描述 */
  desc?: string;
  /** 是否启用 */
  enable?: 0 | 1 | boolean;
}

/**
 * 基于采集站点 API 的通用搜索
 * @example
 * ```ts
 * const v = new CommSearchApi({ api: 'https://api.xinlangapi.com/xinlangapi.php/provide/vod/' });
 * v.search('三体')
 *   .then(d => {
 *     console.log(d.total, d.list);
 *     return v.getVideoList(d.list[0].vod_id);
 *   })
 *   .then(d => {
 *     console.log('detail:', d.total, d.list[0]);
 *   });
 * ```
 */
export class CommSearchApi implements SearchApi {
  protected currentUrl: M3u8StorConfig['remoteConfig']['data']['apiSites'][0];
  public apiMap = new Map<string, M3u8StorConfig['remoteConfig']['data']['apiSites'][0]>();
  public get desc() {
    return this.options.desc || this.options.api;
  }
  public get key() {
    return this.options.api;
  }
  public get enable() {
    return this.options.api && this.options.enable !== false;
  }
  constructor(protected options: VSOptions = {}) {
    if (options.api) options.api = this.formatUrl(options.api)[0];
    this.options = options;
  }
  async search(wd: string, api = this.options.api) {
    let { data } = await req.get<VideoSearchResult>(api, { wd }, null, { rejectUnauthorized: false });
    if (typeof data == 'string') data = JSON.parse(data) as VideoSearchResult;
    return data;
  }
  async detail(id: string | number, api = this.options.api) {
    return this.getVideoList(id, api);
  }
  /** 按 id 取列表(每一项中包含了更为详细的内容) */
  async getVideoList(ids: number | string | (number | string)[], api = this.options.api) {
    let { data } = await req.get<VideoDetailsResult>(
      api,
      {
        ac: 'videolist',
        ids: Array.isArray(ids) ? ids.join(',') : ids,
      },
      null,
      { rejectUnauthorized: false }
    );

    if (typeof data == 'string') data = JSON.parse(data) as VideoDetailsResult;

    return data;
  }
  private formatUrl(url: string | string[]) {
    const urls: string[] = [];
    if (!url) return urls;
    if (typeof url === 'string') url = [url];

    for (let u of url) {
      u = String(u || '').trim();

      if (u.startsWith('http')) {
        if (u.endsWith('provide/')) u += 'vod/';
        if (u.endsWith('provide/vod')) u += '/';
        urls.push(u.replace('/at/xml/', '/'));
      }
    }

    return [...new Set(urls)];
  }
}
