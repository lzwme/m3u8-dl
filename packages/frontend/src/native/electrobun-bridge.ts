import { Electroview, type RPCSchema } from 'electrobun/view';

type DesktopSchema = {
  bun: RPCSchema<{
    messages: {
      appIpc: { channel: string; data?: unknown };
    };
  }>;
  webview: RPCSchema<{
    messages: {
      ipcEvent: { channel: string; args?: unknown[] };
    };
  }>;
};

const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

/**
 * Electrobun 桌面端：用 RPC 复现原 Electron preload 的 `window.nativeApi.ipc` 行为。
 */
export function initElectrobunDesktopBridge(): void {
  if (typeof window === 'undefined') return;
  const w = window as Window & { __electrobunWindowId?: number; nativeApi?: unknown };
  if (typeof w.__electrobunWindowId !== 'number') return;
  if (w.nativeApi) return;

  const rpc = Electroview.defineRPC<DesktopSchema>({
    handlers: {
      messages: {
        ipcEvent: ({ channel, args = [] }) => {
          listeners.get(channel)?.forEach(fn => {
            fn(...args);
          });
        },
      },
    },
  });

  const view = new Electroview({ rpc });

  w.nativeApi = {
    ipc: {
      send(channel: string, data?: unknown) {
        view.rpc.send.appIpc({ channel, data });
      },
      on(channel: string, func: (...args: unknown[]) => void) {
        if (!listeners.has(channel)) listeners.set(channel, new Set());
        listeners.get(channel)!.add(func);
      },
      removeAllListeners(channel: string) {
        listeners.delete(channel);
      },
    },
  };
}
