import { prompt } from 'enquirer';
import type { SearchApi, VideoSearchResult } from '../../types';
import { findFiles, logger } from '../utils';
import { CommSearchApi } from './CommSearchApi';

export const apiManage = {
  api: new Map<string | number, SearchApi>(),
  current: null as SearchApi,
  load(apidir?: string, force = false) {
    const files: string[] = findFiles(apidir, (filepath, s) => !s.isFile() || /\.c?js/.test(filepath));

    for (const filepath of files) {
      const sApi = require(filepath);
      this.add(sApi.default || sApi, force);
    }
  },
  /** 添加 API 到列表中 */
  add(sApi: SearchApi | { api: string; desc?: string; enable?: boolean; key?: string | number }, force = false) {
    if (Array.isArray(sApi)) return sApi.forEach(d => this.add(d));

    if (sApi.api?.startsWith('http') && !('search' in sApi)) sApi = new CommSearchApi(sApi) as SearchApi;

    if (this.validate(sApi as SearchApi) && (force || !this.api.has(sApi.key))) {
      this.api.set(sApi.key, sApi as SearchApi);
      logger.debug('添加Api:', sApi.desc || sApi.key);
    }
  },
  /** API 有效性校验 */
  validate(sApi: SearchApi, desc?: string): sApi is SearchApi {
    if (!sApi) return false;

    const requiredKeys = ['enable', 'key', 'search', 'detail'];

    if (!sApi.key) sApi.key = sApi.desc;

    for (const key of requiredKeys) {
      if (!(key in sApi)) {
        logger.warn(`【API校验不通过】${desc} 缺少关键属性 ${key}`);
        return false;
      }

      if ((key === 'search' || key === 'detail') && typeof sApi[key] !== 'function') return false;
    }

    return sApi.enable !== false;
  },
  /** 选择一个 API */
  async select() {
    if (!this.api.size) {
      logger.error('没有可用的 API，请配置或指定 url、apidir 参数');
      process.exit(-1);
    }

    if (this.api.size === 1) {
      this.current = [...this.api.values()][0];
      return;
    }

    const apis = [...this.api.values()];
    const v = await prompt<{ k: string }>({
      type: 'select',
      name: 'k',
      message: '请选择 API 站点',
      choices: apis.map(d => ({ name: String(d.key), message: d.desc })),
      validate: value => value.length >= 1,
    });

    this.current = apis.find(d => String(d.key) === v.k);
  },
  async search(wd: string, api?: SearchApi) {
    const result: VideoSearchResult['list'] = [];
    try {
      if (api) return (await api.search(wd)).list;

      for (api of this.api.values()) {
        const r = await api.search(wd);
        if (Array.isArray(r.list)) {
          r.list.forEach(d => {
            d.api_key = api.key;
            result.push(d);
          });
        }
      }
    } catch (error) {
      logger.error('搜索失败！', (error as Error).message);
    }

    return result;
  },
  detail(info: VideoSearchResult['list'][0]) {
    const api = this.api.get(info.api_key) || this.current;
    return api.detail(info.vod_id);
  },
};
