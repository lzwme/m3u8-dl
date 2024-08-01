import { AnyObject } from '@lzwme/fe-utils';

export interface SearchApiResult<T> {
  /** api 来源 */
  api_key?: number | string;
  code?: number;
  msg?: string;
  page?: number;
  pagecount?: number;
  limit?: string;
  total: number;
  list: T;
}

/** 模糊搜索返回的结果(?wd=<wd>) */
export interface VideoSearchResult extends SearchApiResult<VodList[]> {
  class?: {
    type_id: number;
    type_pid: number;
    type_name: string;
  }[];
}

type VodList = Pick<
  VideoDetails,
  'api_key' | 'vod_id' | 'vod_name' | 'vod_en' | 'vod_time' | 'vod_remarks' | 'vod_play_from' | 'vod_play_url' | 'type_name' | 'type_id'
>;

/** 按 id 搜素返回的详情列表 */
export type VideoDetailsResult = SearchApiResult<VideoDetails[]>;

export interface VideoDetails {
  /** api 来源 */
  api_key: number | string;
  /** 视频 id，可用于查询详情 */
  vod_id: number;
  /** 视频名称 */
  vod_name: string;
  /** 播放地址 */
  vod_play_url: string;
  /** 分类 id */
  type_id?: number;
  /** 分类名称 */
  type_name?: string;
  vod_en?: string;
  vod_time?: string;
  vod_remarks?: string;
  vod_play_from?: string;
  type_id_1?: number;
  group_id?: number;
  vod_sub?: string;
  vod_status?: number;
  vod_letter?: string;
  vod_color?: string;
  vod_tag?: string;
  vod_class?: string;
  vod_pic?: string;
  vod_pic_thumb?: string;
  vod_pic_slide?: string;
  vod_pic_screenshot: null;
  vod_actor?: string;
  vod_director?: string;
  vod_writer?: string;
  vod_behind?: string;
  vod_blurb?: string;
  vod_pubdate?: string;
  vod_total?: number;
  vod_serial?: string;
  vod_tv?: string;
  vod_weekday?: string;
  vod_area?: string;
  vod_lang?: string;
  vod_year?: string;
  vod_version?: string;
  vod_state?: string;
  vod_author?: string;
  vod_jumpurl?: string;
  vod_tpl?: string;
  vod_tpl_play?: string;
  vod_tpl_down?: string;
  vod_isend?: number;
  vod_lock?: number;
  vod_level?: number;
  vod_copyright?: number;
  vod_points?: number;
  vod_points_play?: number;
  vod_points_down?: number;
  vod_hits?: number;
  vod_hits_day?: number;
  vod_hits_week?: number;
  vod_hits_month?: number;
  vod_duration?: string;
  vod_up?: number;
  vod_down?: number;
  /** 评分 */
  vod_score?: string;
  vod_score_all?: number;
  vod_score_num?: number;
  vod_time_add?: number;
  vod_time_hits?: number;
  vod_time_make?: number;
  vod_trysee?: number;
  /** 在豆瓣的 id */
  vod_douban_id?: number;
  /** 豆瓣评分 */
  vod_douban_score?: string;
  vod_reurl?: string;
  vod_rel_vod?: string;
  vod_rel_art?: string;
  vod_pwd?: string;
  vod_pwd_url?: string;
  vod_pwd_play?: string;
  vod_pwd_play_url?: string;
  vod_pwd_down?: string;
  vod_pwd_down_url?: string;
  vod_content?: string;
  vod_play_server?: string;
  vod_play_note?: string;
  vod_down_from?: string;
  vod_down_server?: string;
  vod_down_note?: string;
  vod_down_url?: string;
  vod_plot?: number;
  vod_plot_name?: string;
  vod_plot_detail?: string;
}

/** 搜索Api的格式 */
export interface SearchApi extends AnyObject {
  /** API 唯一标记 */
  key: string | number;
  /** API 描述 */
  desc?: string;
  /** 是否启用 */
  enable?: boolean;
  /** 按关键字搜索列表 */
  search(wd: string, ...args: unknown[]): Promise<VideoSearchResult>;
  /** 按 id 获取某个视频的详情 */
  detail(id: string | number, ...args: unknown[]): Promise<VideoDetailsResult>;
}
