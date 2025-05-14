import { URL } from 'url';
import { extname, resolve } from 'node:path';
import { download, formatByteSize, formatTimeCost, type DownloadResult } from '@lzwme/fe-utils';
import { blueBright, cyan, gray, greenBright, magentaBright, yellowBright } from 'console-log-colors';
import type { ApiResponse, M3u8DLOptions, M3u8DLProgressStats, VideoInfo } from '../types';
import { DouyinParser } from './parsers/douyin-parser';
import { PipixiaParser } from './parsers/pipixia-parser';
import { WeiboParser } from './parsers/weibo-parser';
import { BaseParser } from './parsers/base-parser';
import { formatOptions, logger, formatHeaders } from '../lib/utils';

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

  public async download(url: string, options: M3u8DLOptions): Promise<ApiResponse<DownloadResult> & { stats?: M3u8DLProgressStats }> {
    const info = await this.parse(url);
    logger.debug('解析视频信息', info);

    if (info.code || !info.data?.url) return { code: 1, ...info, data: null };

    if (!options.filename && info.data.title) {
      options.filename = info.data.title.replaceAll(/[\s\\/:*?"<>|]/g, '_');
    }

    [url, options] = formatOptions(info.data.url, options);

    if (!extname(options.filename)) options.filename += '.mp4';

    const startTime = Date.now();
    const stats: M3u8DLProgressStats = {
      url,
      startTime,
      progress: 0,
      tsSuccess: 0,
      tsFailed: 0,
      tsCount: 0,
      duration: 0,
      durationDownloaded: 0,
      downloadedSize: 0,
      avgSpeed: 0,
      avgSpeedDesc: '0B/s',
      speed: 0,
      speedDesc: '0B/s',
      remainingTime: 0,
      filename: options.filename,
      localVideo: resolve(options.saveDir, options.filename),
    };
    logger.debug('开始下载', gray(url), cyan(stats.localVideo));
    if (options.onInited) options.onInited(stats, null, null);
    try {
      const r = await download({
        url,
        filepath: stats.localVideo,
        paralelism: options.threadNum,
        force: options.force,
        requestOptions: {
          headers: {
            referer: info.data.referer || info.data.url,
            ...formatHeaders(options.headers),
          },
          rejectUnauthorized: false,
        },
        onProgress: info => {
          stats.progress = +info.percent.toFixed(2);
          stats.size = info.size;
          stats.downloadedSize = info.downloaded;
          stats.speed = info.speed;
          stats.speedDesc = formatByteSize(stats.speed) + '/s';
          stats.remainingTime = Math.round((info.size - info.downloaded) / stats.speed);

          if (options.showProgress) {
            const processBar = info.percent === -1 ? '' : '='.repeat(Math.floor(stats.progress * 0.2)).padEnd(20, '-');
            logger.logInline(
              `${stats.progress}% [${greenBright(processBar)}] ` +
                `${blueBright(formatByteSize(stats.downloadedSize))} ${yellowBright(formatTimeCost(startTime))} ${magentaBright(stats.speedDesc)} ` +
                (stats.progress === 100 ? '\n' : stats.remainingTime ? `${cyan(formatTimeCost(Date.now() - stats.remainingTime))}` : '')
            );
          }

          if (options.onProgress) {
            options.onProgress(info.downloaded, info.size, null, stats);
          }
        },
      });

      stats.endTime = Date.now();

      return {
        code: r.filepath ? 0 : 201,
        message: r.filepath ? '下载完成' : '下载失败',
        data: r,
        stats,
      };
    } catch (error) {
      logger.error('下载失败', (error as Error).message, gray(url));
      stats.errmsg = (error as Error).message;

      return {
        code: 201,
        message: '下载失败: ' + (error as Error).message,
        stats,
      };
    }
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
    } catch (error) {
      console.error('解析 URL 失败', url, error);
      return null;
    }

    return null;
  }
  /**
   * 获取所有支持的平台列表
   */
  public getSupportedPlatforms(): string[] {
    return Object.keys(VideoParser.platforms);
  }
}
