import { LiteStorage } from '@lzwme/fe-utils';
import { type VSOptions } from './video-search';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

export interface M3u8StorConfig extends VSOptions {
  /** 播放地址缓存 */
  api?: string[];
  remoteConfig?: {
    updateTime?: number;
    data?: {
      apiSites: {
        url: string;
        desc?: string;
        enable?: 0 | 1 | boolean;
        remote?: boolean;
      }[];
    };
  };
}

export const stor = LiteStorage.getInstance<M3u8StorConfig>({ uuid: 'm3u8dl', filepath: resolve(homedir(), '.liteStorage/m3u8dl.json') });
