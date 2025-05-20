import { BaseParser } from './base-parser';
import type { ApiResponse, VideoInfo } from '../../types';
import { getLocation, request } from '../../lib/utils.js';

export class PipixiaParser extends BaseParser {
  public static override async parse(url: string): Promise<ApiResponse<VideoInfo>> {
    try {
      const loc = await getLocation(url);
      if (!loc.includes('/item/')) return this.error(400, '无效的URL格式');

      const idMatch = loc.match(/item\/([^?]*)/);
      if (!idMatch?.[1]) return this.error(400, '无法解析视频 ID');

      const headers = { referer: 'https://www.pipix.com' };
      const furl = `https://h5.pipix.com/bds/cell/cell_h5_comment/?cell_id=${idMatch[1]}&aid=1319&app_name=super`;
      const { data } = await request.get(furl, null, headers);
      if (!data) return this.error(400, '未找到视频数据');

      const item = data.data.cell_comments[0].comment_info.item;
      const videoUrl = item.video.video_high.url_list[0].url;

      if (!videoUrl) return this.error(201, '未找到视频URL');

      return this.success<VideoInfo>({
        referer: headers.referer,
        title: item.content,
        author: item.author.name,
        url: videoUrl,
        uid: item.author.uid || '',
        avatar: item.author.avatar?.url_list[0].url || '',
        like: item.digg_count || 0,
        time: item.create_time || 0,
        cover: item.cover?.url_list[0].url || '',
        music: {
          author: item.author?.name || '',
          avatar: item.video?.cover_image?.url_list[0].url || '',
        },
      });
    } catch (error) {
      return this.error(500, `解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}
