import { envConfig } from './env';

export function initStats(id = '') {
  if (envConfig.isDev) return;

  const win = window as unknown as { _hmt: unknown[] };
  if (Array.isArray(win._hmt) && win._hmt.length > 0) return;
  win._hmt = [];
  const hm = document.createElement("script");
  hm.src = `https://hm.baidu.com/hm.js?${id || '0b21eda331ac9677a4c546dea88616d0'}`;
  const s = document.getElementsByTagName("script")[0] as HTMLScriptElement;
  s.parentNode?.insertBefore(hm, s);
}
