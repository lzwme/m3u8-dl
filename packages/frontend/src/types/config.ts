export interface DownloadConfig {
  /** 并发下载线程数。取决于服务器限制，过多可能会容易下载失败。一般建议不超过 8 个。默认为 cpu数 * 2，但不超过 8 */
  threadNum: number;
  /** 下载文件保存的路径。默认为当前目录 */
  saveDir: string;
  /** 下载成功后是否删除临时文件。默认为 true。保存临时文件可以在重复下载时识别缓存 */
  delCache: boolean;
  /** 下载完毕后，是否合并转换为 mp4 或 ts 文件。默认为 true */
  convert: boolean;
  /** 是否显示预览按钮 */
  showPreview: boolean;
  /** 是否显示边下边播按钮 */
  showLocalPlay: boolean;
  /** 最大并发下载数 */
  maxDownloads: number;
  /** ffmpeg 可执行文件路径。如果未指定，则尝试使用系统 PATH 中的 'ffmpeg' */
  ffmpegPath?: string;
}
