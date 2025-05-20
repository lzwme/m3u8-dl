import { URL } from 'url';
import { extname } from 'node:path';
import type { ApiResponse, M3u8DLOptions, M3u8DLResult, VideoInfo } from '../types';
import { DouyinParser } from './parsers/douyin-parser';
import { PipixiaParser } from './parsers/pipixia-parser';
import { WeiboParser } from './parsers/weibo-parser';
import { BaseParser } from './parsers/base-parser';
import { logger, formatHeaders } from '../lib/utils';
import { fileDownload } from '../lib/file-download';

type Platforms = {
  [key: string]: {
    class: typeof BaseParser;
    domains: string[];
  };
};

export class VideoParser {
  private static readonly platforms: Platforms = {
    pipixia: {
      class: PipixiaParser,
      domains: ['pipix.com'],
    },
    douyin: {
      class: DouyinParser,
      domains: ['douyin.com'],
    },
    weibo: {
      class: WeiboParser,
      domains: ['weibo.com'],
    },
    unknown: {
      class: BaseParser,
      domains: ['**'],
    },
  };
  /**
   * 解析视频 URL
   */
  public async parse(url: string, headers: Record<string, string> = {}): Promise<ApiResponse<VideoInfo>> {
    const info = VideoParser.getPlatform(url);
    if (!info) return { code: 201, message: '不支持的视频平台' };

    const parserClass = VideoParser.platforms[info.platform].class;
    return await parserClass.parse(info.url, headers);
  }

  public async download(url: string, options: M3u8DLOptions): Promise<M3u8DLResult> {
    const info = await this.parse(url);
    logger.debug('解析视频信息', info);

    if (info.code || !info.data?.url) return { errmsg: info.message || '解析视频信息失败', options };

    if (!options.filename && info.data.title) {
      options.filename = info.data.title.replaceAll(/[\s\\/:*?"<>|]/g, '_');
    }

    if (!options.type) options.type = 'parser';

    if (!extname(options.filename)) options.filename += '.mp4';

    options.headers = {
      referer: info.data.referer || info.data.url,
      ...formatHeaders(options.headers),
    };

    return fileDownload(url, options);
  }
  /**
   * 根据 URL 获取平台标识
   */
  public static getPlatform(url: string) {
    try {
      url = /https?:\/\/[^ ]+/.exec(url)?.[0];

      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.replace(/^www\./, '');

      for (const [platform, config] of Object.entries(VideoParser.platforms)) {
        if (config.domains.some(domain => host.includes(domain))) {
          return { url, platform };
        }
      }

      return { url, platform: 'unknown' };
    } catch (error) {
      console.error('解析 URL 失败', url, error);
      return null;
    }
  }
  /**
   * 获取所有支持的平台列表
   */
  public getSupportedPlatforms(): string[] {
    return Object.keys(VideoParser.platforms);
  }
}
