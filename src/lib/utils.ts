import { execSync, NLogger, color, Request, retry } from '@lzwme/fe-utils';

export const request = new Request('', {
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
});

export const getRetry = <T = string>(url: string, retries = 3) =>
  retry(
    () => request.get<T>(url),
    1000,
    retries,
    r => r.response.statusCode === 200
  );

export const logger = NLogger.getLogger('[M3U8-DL]', { color });

let _isSupportFfmpeg: boolean = null;
export function isSupportFfmpeg() {
  if (null == _isSupportFfmpeg) _isSupportFfmpeg = execSync('ffmpeg -version').stderr === '';
  return _isSupportFfmpeg;
}
