/// <reference path="./global.d.ts" />
import { addCssOrScript } from './utils';

/** SweetAlert2 Shadow DOM 支持 */
export async function loadSwal(): Promise<void> {
  let swalTarget: HTMLElement = document.body;
  const setTarget = (newTarget: HTMLElement) => {
    swalTarget = newTarget;
  };
  const getTarget = () => swalTarget;

  // 设置全局函数
  unsafeWindow.SetSwalTarget = setTarget;
  window.SetSwalTarget = setTarget;
  unsafeWindow.GetSwalTarget = getTarget;
  window.GetSwalTarget = getTarget;

  try {
    // 读取并魔改 SweetAlert2 JS
    const SwalJS = GM_getResourceText('SwalJS').replace(/document\.body/g, 'GetSwalTarget()'); // 重定义容器

    // 注意：需要在 document 存在时才能添加元素
    const addScript = (): Promise<void> => {
      return addCssOrScript(SwalJS, document.head || document.documentElement, 'script')
        .then(() => {
          // 从全局获取 Swal（运行时动态获取）
          const swalInstance = window.Swal || window.Sweetalert2 || unsafeWindow.Swal || unsafeWindow.Sweetalert2;
          if (swalInstance) {
            window.Swal = swalInstance;
            unsafeWindow.Swal = swalInstance;
          }
        })
        .catch(err => {
          console.error('[M3U8 Capture] Failed to add SweetAlert2 script:', err);
        });
    };

    // 如果 document 已存在，直接添加；否则等待 DOMContentLoaded
    if (document.head || document.documentElement) {
      await addScript();
    } else {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => addScript());
      } else {
        setTimeout(addScript, 50);
      }
    }
  } catch (e) {
    console.error('[M3U8 Capture] Failed to load SweetAlert2:', e);
  }
}

/** 初始化 SweetAlert2 CSS */
export function initSwalCSS(shadowRoot: ShadowRoot, swalContainer: HTMLElement): void {
  addCssOrScript(
    GM_getResourceText('SwalCSS')
      .replace(/(\d+)rem/g, '$1em')
      .replace(/:root *{/, `#${swalContainer.id} {`)
      .replace(/body/g, ''),
    shadowRoot as unknown as HTMLElement,
    'css'
  );

  setTimeout(() => {
    const swalInstance = window.Swal;
    if (typeof window.SetSwalTarget === 'function' && swalInstance) {
      window.SetSwalTarget(swalContainer);
      window.Swal = swalInstance.mixin({ target: swalContainer });
    }
  }, 500);
}

export function initTailwindCSS(shadowRoot: ShadowRoot): void {
  addCssOrScript(GM_getResourceText('TailwindCSS').replace(/(\d+)rem/g, '$1em'), shadowRoot as unknown as HTMLElement, 'css');
}
