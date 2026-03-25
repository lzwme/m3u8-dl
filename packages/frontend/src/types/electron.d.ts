export interface NativeApiIPC {
  on(channel: string, callback: (data: any) => void): void;
  send(channel: string, ...args: any[]): void;
  removeAllListeners(channel: string): void;
}

// export interface Electron {
//   ipc: NativeApiIPC;
// }

declare global {
  interface Window {
    nativeApi?: NativeApi;
  }
}
