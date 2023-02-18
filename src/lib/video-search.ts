import { Request } from '@lzwme/fe-utils';
import { VideoListResult, VideoSearchResult } from '../types';
import { stor } from './storage';

const req = new Request(null, {
  'content-type': 'application/json; charset=UTF-8',
});

interface VSOptions {
  api?: string[];
}
export class VideoSearch {
  public get api() {
    return this.options.api;
  }
  constructor(protected options: VSOptions = {}) {
    if (!options.api?.length) options.api = [];
    if (process.env.VAPI) options.api.push(...process.env.VAPI.split('$$$'));
    this.updateOptions(options).then(() => {
      if (!this.api.length) throw Error('没有可用站点，请添加或指定');
    });
  }
  async updateOptions(options: VSOptions) {
    const cache = stor.get();
    if (Array.isArray(cache.api)) this.options.api.push(...cache.api);
    if (options.api?.length) {
      this.options.api.unshift(...options.api);
      this.options.api = await this.formatUrl(this.options.api);
      stor.set({ api: this.options.api });
    }
    return this;
  }
  async search(wd: string, api = this.api[0]) {
    let { data } = await req.get<VideoSearchResult>(api, { wd });

    if (typeof data == 'string') data = JSON.parse(data) as VideoSearchResult;

    return data;
  }
  async getVideoList(ids: number | string | (number | string)[], api = this.api[0]) {
    let { data } = await req.get<VideoListResult>(api, {
      ac: 'videolist',
      ids: Array.isArray(ids) ? ids.join(',') : ids,
    });

    if (typeof data == 'string') data = JSON.parse(data) as VideoListResult;

    return data;
  }
  async formatUrl(url: string | string[]) {
    const urls: string[] = [];
    if (!url) return urls;
    if (typeof url === 'string') url = [url];

    for (let u of url) {
      u = String(u || '').trim();
      if (!u) continue;
      if (u.endsWith('.json')) {
        const { data } = await req.get<Record<string, string>>(u, {});
        if (Array.isArray(data)) {
          urls.push(...(await this.formatUrl(data as string[])));
        } else {
          urls.push(...Object.values(data));
        }
      } else if (u.startsWith('http')) {
        if (u.endsWith('provide/')) u += 'vod/';
        if (u.endsWith('provide/vod')) u += '/';
        urls.push(u.replace('/at/xml/', '/'));
      }
    }

    return [...new Set(urls)];
  }
}

// const v = new VideoSearch({ api: ['https://api.xinlangapi.com/xinlangapi.php/provide/vod/'] });
// v.search('三体')
//   .then(d => {
//     console.log(d.total, d.list);
//     return v.getVideoList(d.list[0].vod_id);
//   })
//   .then(d => {
//     console.log('detail:', d.total, d.list[0]);
//   });
