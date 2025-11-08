export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  text: string;
}

const iconMap: Record<ToastType, string> = {
  success: 'fa-check-circle text-green-600',
  error: 'fa-times-circle text-red-600',
  warning: 'fa-exclamation-triangle text-yellow-600',
  info: 'fa-info-circle text-blue-500',
};

export function toast(options: ToastOptions | string) {
  const config: ToastOptions = typeof options === 'string' ? { text: options } : options;
  const type = config.type || 'success';
  const duration = config.duration ?? 3000;

  const toastEl = document.createElement('div');
  toastEl.className = `custom-toast custom-toast-${type}`;
  toastEl.innerHTML = [
    `<i class="custom-toast-icon mr-2 fa ${iconMap[type]}"></i>`,
    `<span class="break-all">${config.text || ''}</span>`,
    `<i class="custom-toast-close fa fa-close fixed right-2 cursor-pointer text-lg" onclick="this.parentElement.remove()"></i>`,
  ].join('');

  document.body.appendChild(toastEl);
  setTimeout(() => toastEl.classList.add('show'), 10);

  const close = () => {
    toastEl.classList.remove('show');
    toastEl.classList.add('hide');
    setTimeout(() => toastEl.remove(), 300);
  };

  if (duration > 0) {
    setTimeout(() => close(), duration);
  }

  return { element: toastEl, close };
}
