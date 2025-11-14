/** 复制到剪贴板 */
export function copyToClipboard(text: string) {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => resolve(true))
        .catch(() => {
          _fallbackCopy(text) ? resolve(true) : reject(new Error('复制失败'));
        });
    } else {
      _fallbackCopy(text) ? resolve(true) : reject(new Error('复制失败'));
    }
  });
}

/** 降级复制方案（使用 document.execCommand） */
function _fallbackCopy(text: string) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length); // 兼容移动端
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (e) {
    console.error('[M3U8 Capture] fallbackCopy failed:', e);
    return false;
  }
}
