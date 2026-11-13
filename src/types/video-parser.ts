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
  /**
   * 独立的音频流地址。
   *
   * 部分平台（如 B 站 DASH）音视频分离，此时需将 `url`（视频流）与 `audioUrl`（音频流）
   * 下载后合并为一个可播放的文件。
   */
  audioUrl?: string;
  /** 备用流地址（视频），主地址失效时依次重试 */
  backupUrls?: string[];
  /** 备用音频流地址 */
  audioBackupUrls?: string[];
}
