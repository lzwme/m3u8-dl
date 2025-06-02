import { getLocation, request } from '../../lib/utils.js';
import type { ApiResponse, VideoInfo } from '../../types';
import { BaseParser } from './base-parser';

export class DouyinParser extends BaseParser {
  protected static getHeaders() {
    return {
      'user-agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 Edg/122.0.0.0',
    };
  }
  public static override async parse(url: string): Promise<ApiResponse<VideoInfo>> {
    try {
      const loc = await getLocation(url);
      const idMatch = loc.match(/[0-9]+/);

      if (!idMatch) return DouyinParser.error(400, '无法解析视频 ID');

      const { data: res } = await request.get<string>(
        `https://www.iesdouyin.com/share/video/${idMatch[0]}`,
        null,
        DouyinParser.getHeaders()
      );
      const matches = res.match(/window\._ROUTER_DATA\s*=\s*(.*?)<\/script>/s);

      if (!matches) return DouyinParser.error(400, '无法解析视频数据');

      const data = JSON.parse(matches[1].trim());
      const item = data.loaderData['video_(id)/page'].videoInfoRes.item_list[0];

      if (!item) return DouyinParser.error(400, '解析视频信息失败');

      const videoId = item.video.play_addr.uri;
      if (!videoId) return DouyinParser.error(201, '未找到视频URL');

      const videoUrl = `https://www.iesdouyin.com/aweme/v1/play/?video_id=${videoId}&ratio=1080p&line=0`;

      return DouyinParser.success<VideoInfo>({
        author: item.author.nickname,
        uid: item.author.unique_id,
        avatar: item.author.avatar_medium.url_list[0],
        like: item.statistics.digg_count,
        time: item.create_time,
        title: item.desc,
        cover: item.video.cover.url_list[0],
        url: await getLocation(videoUrl),
        referer: url,
        music: {
          author: item.music.author,
          avatar: item.music.cover_large.url_list[0],
        },
      });
    } catch (error) {
      return DouyinParser.error(500, `解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}
