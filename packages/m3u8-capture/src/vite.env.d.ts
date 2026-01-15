/// <reference types="vite/client" />

/**
 * Vite 环境变量类型定义
 *
 * Vite 自动提供的环境变量：
 * - MODE: 当前模式（development | production | 自定义模式）
 * - DEV: 是否为开发模式（boolean）
 * - PROD: 是否为生产模式（boolean）
 * - SSR: 是否为 SSR 模式（boolean）
 */
interface ImportMetaEnv {
  // Vite 内置环境变量
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
