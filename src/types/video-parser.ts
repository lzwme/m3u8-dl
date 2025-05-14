export interface VideoInfo {
  author: string;
  uid: string;
  avatar: string;
  like: number;
  time: number;
  title: string;
  cover: string;
  url: string;
  /** 来源页面 */
  referer?: string;
  music?: {
    author: string;
    avatar: string;
  };
}
