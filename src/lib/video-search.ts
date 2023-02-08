import { Request } from '@lzwme/fe-utils';
import { VideoListResult, VideoSearchResult } from '../types';
import { logger } from './utils';

const req = new Request(null, {
  'content-type': 'application/json; charset=UTF-8',
});

export class VideoSearch {
  protected apiList: string[] = [];
  protected _api = process.env.VAPI;
  constructor(protected options: { apiList?: string[] } = {}) {
    if (options.apiList) this.apiList = options.apiList;
    if (process.env.VAPI) this.apiList = process.env.VAPI.split('$$$');
  }
  async search(wd: string, api = this.apiList[0]) {
    let { data } = await req.get<VideoSearchResult>(api, { wd });

    if (typeof data == 'string') data = JSON.parse(data) as VideoSearchResult;
    if (data.code !== 200) logger.error(data.code, data.msg);

    return data;
  }
  async getVideoList(ids: number | string | (number | string)[], api = this.apiList[0]) {
    let { data } = await req.get<VideoListResult>(api, {
      ac: 'videolist',
      ids: Array.isArray(ids) ? ids.join(',') : ids,
    });

    if (typeof data == 'string') data = JSON.parse(data) as VideoListResult;
    if (data.code !== 200) logger.error(data.code, data.msg);

    return data;
  }
  fetchVideoApi() {
    // todo: fetch from remote config
  }
  getVideoApi() {
    return this.apiList;
  }
}

// const v = new VideoSearch({ apiList: ['https://api.xinlangapi.com/xinlangapi.php/provide/vod/'] });
// v.search('三体')
//   .then(d => {
//     console.log(d.total, d.list);
//     return v.getVideoList(d.list[0].vod_id);
//   })
//   .then(d => {
//     console.log('detail:', d.total, d.list[0]);
//   });
