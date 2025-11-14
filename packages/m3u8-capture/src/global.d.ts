// Violentmonkey/Tampermonkey 类型定义
// declare function GM_addElement(
//   parent: HTMLElement,
//   tag: string,
//   attributes: Record<string, string>
// ): HTMLElement;

// declare function GM_setValue(name: string, value: unknown): void;
// declare function GM_getValue<T>(name: string, defaultValue: T): T;
// declare function GM_getResourceText(name: string): string;
// declare function GM_xmlhttpRequest(options: unknown): void;

// SweetAlert2 类型定义
interface SwalOptions {
  title?: string;
  text?: string;
  html?: string;
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  width?: string;
  timer?: number;
  showConfirmButton?: boolean;
  preConfirm?: () => unknown | false;
  target?: HTMLElement;
}

interface SwalResult {
  isConfirmed: boolean;
  value?: unknown;
}

interface SwalStatic {
  fire(options: SwalOptions): Promise<SwalResult>;
  fire(title: string, text?: string, icon?: SwalOptions['icon']): Promise<SwalResult>;
  mixin(options: SwalOptions): SwalStatic;
  showValidationMessage(message: string): void;
}

declare global {
  interface Window {
    Swal: SwalStatic;
    Sweetalert2: SwalStatic;
    SetSwalTarget: (target: HTMLElement) => void;
    GetSwalTarget: () => HTMLElement;
  }
}

// window.d.ts
declare interface Window {
  Swal: SwalStatic;
  Sweetalert2: SwalStatic;
  SetSwalTarget: (target: HTMLElement) => void;
  GetSwalTarget: () => HTMLElement;
}
