import { formatHeaders, request } from '../../lib/utils.js';
import type { ApiResponse, VideoInfo } from '../../types';
import { BaseParser } from './base-parser';

export class WeiboParser extends BaseParser {
  private static fixUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `https:${url}`;
  }

  public static override async parse(url: string, headers: Record<string, string> = {}): Promise<ApiResponse<VideoInfo>> {
    try {
      let id: string | undefined;

      if (url.includes('show?fid=')) {
        const match = url.match(/fid=(.*)/);
        id = match?.[1];
      } else {
        const match = url.match(/\d+:\d+/);
        id = match?.[0];
      }

      if (!id) return WeiboParser.error(400, '无法解析视频 ID');

      headers = {
        ...formatHeaders(headers),
        'content-type': 'application/x-www-form-urlencoded',
        referer: 'https://weibo.com',
      };
      if (!headers.cookie) return WeiboParser.error(400, '请先设置微博 cookie');

      const params = { data: `{"Component_Play_Playinfo":{"oid":"${id}"}}` };
      const furl = `https://weibo.com/tv/api/component?page=${encodeURIComponent(`/tv/show/${id}`)}`;
      const { data: res } = await request.post(furl, params, headers);
      const item = res.data?.Component_Play_Playinfo;

      if (!item) return WeiboParser.error(500, `视频数据解析失败: ${id}`);

      const videoUrls = item.urls;
      if (!videoUrls || Object.keys(videoUrls).length === 0) return WeiboParser.error(201, '未找到视频URL');

      const videoUrl = WeiboParser.fixUrl(videoUrls[Object.keys(videoUrls)[0]]);

      return WeiboParser.success<VideoInfo>({
        title: item.title || '',
        author: item.author || '',
        url: videoUrl,
        referer: headers.referer,
        uid: item.author_id || '',
        avatar: WeiboParser.fixUrl(item.avatar || ''),
        like: item.like_count || 0,
        time: item.real_date || 0,
        cover: WeiboParser.fixUrl(item.cover_image || ''),
        music: {
          author: item.music?.author || '',
          avatar: item.music?.cover_large?.url_list?.[0] || '',
        },
      });
    } catch (error) {
      return WeiboParser.error(500, `解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}
