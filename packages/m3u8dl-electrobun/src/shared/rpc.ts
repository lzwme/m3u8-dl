import type { RPCSchema } from 'electrobun/bun';

/** 浏览器 ↔ Bun：统一 IPC 管道 */
export type M3u8MainRpc = {
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
