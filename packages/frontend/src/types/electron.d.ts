export interface ElectronIPC {
  on(channel: string, callback: (data: any) => void): void;
  send(channel: string, ...args: any[]): void;
}

export interface Electron {
  ipc: ElectronIPC;
}

declare global {
  interface Window {
    electron?: Electron;
  }
}
