import { Request } from '@lzwme/fe-utils';
import type { VideoListResult, VideoSearchResult } from '../types';
import { stor, type M3u8StorConfig } from './storage.js';
import { logger } from './utils.js';

const req = new Request(null, {
  'content-type': 'application/json; charset=UTF-8',
});

export interface VSOptions {
  /** 播放地址缓存 */
  api?: string[];
  force?: boolean;
}

export class VideoSearch {
  public apiMap = new Map<string, M3u8StorConfig['remoteConfig']['data']['apiSites'][0]>();
  public get api() {
    return [...this.apiMap.values()];
  }
  constructor(protected options: VSOptions = {}) {
    if (!options.api?.length) options.api = [];
    if (process.env.VAPI) options.api.push(...process.env.VAPI.split('$$$'));
    this.updateOptions(options).then(() => {
      if (!this.apiMap.size) throw Error('没有可用站点，请添加或指定');
    });
  }
  async updateOptions(options: VSOptions) {
    const cache = stor.get();
    const apis = [...(cache.api || []), ...options.api];

    await this.formatUrl(apis);

    if (options.api?.length) {
      stor.set({ api: [...(cache.api || []), ...options.api] });
    }

    (cache.api || []).forEach(url => {
      this.apiMap.set(url, { url, desc: url });
    });

    await this.updateApiFromRemote(options.force);

    return this;
  }
  async search(wd: string, api = this.api[0]) {
    let { data } = await req.get<VideoSearchResult>(api.url, { wd }, null, { rejectUnauthorized: false });

    if (typeof data == 'string') data = JSON.parse(data) as VideoSearchResult;

    return data;
  }
  async getVideoList(ids: number | string | (number | string)[], api = this.api[0]) {
    let { data } = await req.get<VideoListResult>(
      api.url,
      {
        ac: 'videolist',
        ids: Array.isArray(ids) ? ids.join(',') : ids,
      },
      null,
      { rejectUnauthorized: false }
    );

    if (typeof data == 'string') data = JSON.parse(data) as VideoListResult;

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
  private async loadRemoteConfig(force = false) {
    const cache = stor.get();
    let needUpdate = true;

    if (!force && cache.remoteConfig?.updateTime) {
      needUpdate = Date.now() - cache.remoteConfig.updateTime > 1 * 60 * 60 * 1000;
    }

    if (needUpdate) {
      const url = 'https://ghproxy.com/raw.githubusercontent.com/lzwme/m3u8-dl/main/test/remote-config.json';
      const { data } = await req.get<M3u8StorConfig['remoteConfig']['data']>(
        url,
        null,
        { 'content-type': 'application/json' },
        { rejectUnauthorized: false }
      );
      logger.debug('加载远程配置', data);

      if (Array.isArray(data.apiSites)) {
        cache.remoteConfig = {
          updateTime: Date.now(),
          data,
        };
        stor.save(cache);
      }
    }

    return cache.remoteConfig;
  }
  async updateApiFromRemote(force = false) {
    const remoteConfig = await this.loadRemoteConfig(force);

    if (Array.isArray(remoteConfig?.data?.apiSites)) {
      remoteConfig.data.apiSites.forEach(item => {
        if (item.enable === 0 || item.enable === false) return;
        item.url = this.formatUrl(item.url)[0];
        item.remote = true;
        this.apiMap.set(item.url, item);
      });
    }
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
