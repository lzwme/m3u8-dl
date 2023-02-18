import { LiteStorage } from '@lzwme/fe-utils';

interface M3u8StorConfig {
  /** 播放地址缓存 */
  api: string[];
}

export const stor = LiteStorage.getInstance<M3u8StorConfig>({ uuid: 'm3u8dl', filepath: 'm3u8dl.json' });
