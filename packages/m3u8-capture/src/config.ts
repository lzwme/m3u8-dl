/** 配置存储键名 */
export const STORAGE_KEY_WEBUI_URL = 'm3u8_capture_webui_url';
export const STORAGE_KEY_EXCLUDE_URLS = 'm3u8_capture_exclude_urls';
export const STORAGE_KEY_PANEL_POS = 'm3u8_capture_panel_pos';
export const STORAGE_KEY_PANEL_VISIBLE = 'm3u8_capture_panel_visible';
export const STORAGE_KEY_MEDIA_EXT_LIST = 'm3u8_capture_media_ext_list';
export const STORAGE_KEY_AUTO_START = 'm3u8_capture_auto_start';

/** 默认媒体扩展名列表 */
export const DEFAULT_MEDIA_EXT_LIST = [
  'm3u8',
  'mp4',
  'mkv',
  'avi',
  'mov',
  'wmv',
  'flv',
  'webm',
  'm4v',
  'm3u',
  'm4a',
  'aac',
  'flac',
  'ape',
  'mp3',
  'wav',
  'ogg',
  'wma',
] as const;

/** 默认排除网址规则列表 */
export const DEFAULT_EXCLUDE_URLS = ['localhost:6600', '/example.com/', 'lzw.me', 'doubleclick.net'] as const;
