import { formatHeaders, getLocation, logger } from '../../lib/utils.js';
import type { ApiResponse, VideoInfo } from '../../types';
import { BaseParser } from './base-parser';
import { BILI_REFERER, BILI_UA, getDashStreams, getDurlStream, getVideoInfo } from './bilibili/api.js';

/**
 * B 站视频解析器
 *
 * 取流分三级降级：
 * 1. 已登录（提供 cookie）→ WBI 签名接口的 DASH 流，画质最高（受账号权限限制）
 * 2. 未登录 → 旧接口 + `try_look=1` 的 DASH 流，实测可拿到 1080P
 * 3. DASH 不可用 → MP4(durl) 单文件流，音视频已合并，无需二次合并
 *
 * DASH 流的视频与音频分离，需要下载后用 ffmpeg 合并。
 */
export class BilibiliParser extends BaseParser {
  /** 解析请求头，补齐 B 站必需的 UA 与 Referer */
  private static getHeaders(headers: Record<string, string> = {}) {
    return {
      'user-agent': BILI_UA,
      referer: BILI_REFERER,
      ...formatHeaders(headers),
    };
  }

  /** 是否携带了登录 cookie */
  private static hasCookie(headers: Record<string, string>) {
    return /sessdata|bili_jct|buvid3/i.test(headers.cookie || '');
  }

  /**
   * 从输入中提取 BV 号与分P序号。
   * `b23.tv` 短链需先展开为真实地址。
   */
  private static async resolveTarget(url: string) {
    let target = url;

    if (/b23\.tv/i.test(target)) {
      try {
        target = await getLocation(target, 'GET');
      } catch (e) {
        logger.warn('[bilibili]短链展开失败:', (e as Error).message);
      }
    }

    const bvid = /\/video\/(BV[0-9A-Za-z]{10})/.exec(target)?.[1] || /BV[0-9A-Za-z]{10}/.exec(target)?.[0] || '';
    const page = Math.max(1, Number(/[?&]p=(\d+)/.exec(target)?.[1] || 1));

    return { target, bvid, page };
  }

  public static override async parse(url: string, headers: Record<string, string> = {}): Promise<ApiResponse<VideoInfo>> {
    try {
      const reqHeaders = BilibiliParser.getHeaders(headers);
      const { target, bvid, page } = await BilibiliParser.resolveTarget(url);

      if (!bvid) return BilibiliParser.error(400, '无法解析 B 站视频地址，请检查是否为 BV 号链接');

      const info = await getVideoInfo(bvid, reqHeaders);
      if (!info.cid) return BilibiliParser.error(201, `未找到 B 站视频信息: ${bvid}`);

      // 分P：优先取 url 中指定的分P，未指定则取第一P
      const currentPage = info.pages.find(p => p.page === page) || info.pages[0];
      const cid = currentPage?.cid || info.cid;

      // 取流：DASH 优先，失败降级为单文件
      let streams = null;
      const useWbi = BilibiliParser.hasCookie(reqHeaders);

      if (useWbi) {
        try {
          streams = await getDashStreams(bvid, cid, reqHeaders, true);
        } catch (e) {
          logger.warn('[bilibili]WBI 接口取流失败，尝试降级:', (e as Error).message);
        }
      }

      if (!streams) {
        try {
          streams = await getDashStreams(bvid, cid, reqHeaders, false);
        } catch (e) {
          logger.warn('[bilibili]DASH 取流失败，尝试降级为单文件:', (e as Error).message);
        }
      }

      if (!streams) {
        streams = await getDurlStream(bvid, cid, reqHeaders);
      }

      if (!streams?.videoUrl) return BilibiliParser.error(201, `未获取到 B 站视频流地址: ${bvid}`);

      const title = page > 1 && currentPage?.part ? `${info.title} - ${currentPage.part}` : info.title;

      logger.debug('[bilibili]解析结果', {
        bvid,
        cid,
        page,
        quality: streams.quality,
        dash: !!streams.audioUrl,
        title,
      });

      return BilibiliParser.success<VideoInfo>({
        url: streams.videoUrl,
        audioUrl: streams.audioUrl,
        backupUrls: streams.backupUrls,
        audioBackupUrls: streams.audioBackupUrls,
        title,
        author: info.owner,
        uid: String(info.mid || ''),
        cover: info.cover,
        like: info.like,
        time: info.pubdate,
        referer: target,
      });
    } catch (error) {
      return BilibiliParser.error(500, `解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}
