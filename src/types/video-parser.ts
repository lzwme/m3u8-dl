export interface VideoInfo {
  url: string;
  title: string;
  author?: string;
  avatar?: string;
  time?: number;
  cover?: string;
  uid?: string;
  like?: number;
  /** 来源页面 */
  referer?: string;
  music?: {
    author: string;
    avatar: string;
  };
}
