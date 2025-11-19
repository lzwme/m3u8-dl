export function initStats({ gaId = '', baiduId = '' } = {}) {
  if (location.hostname.includes('localhost')) return;

  // 初始化百度统计
  if (!baiduId) baiduId = import.meta.env.MD_BAIDU_ID || 'ce3443432a45d620c8a194194e5360e5';
  const win = window as unknown as { _hmt: unknown[] };
  if (Array.isArray(win._hmt) && win._hmt.length > 0) return;

  win._hmt = [];
  var hm = document.createElement('script');
  hm.src = `https://hm.baidu.com/hm.js?${baiduId}`;
  var s = document.getElementsByTagName('script')[0];
  s.parentNode!.insertBefore(hm, s);

  // 初始化 Google Analytics (GA4)
  if (!gaId) gaId = import.meta.env.MD_GA_ID || 'G-PJFTCPLDQ9';
  // 加载 gtag.js
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script1);

  // 初始化 gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
  document.head.appendChild(script2);
}
