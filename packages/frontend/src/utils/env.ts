// 生产环境移除调试代码
export function logDebug(message: string) {
  if (import.meta.env.DEV) {
    console.log('[DEBUG]', message);
  }
}

/**
 * 环境配置对象
 * 集中管理所有环境相关的配置
 */
export const envConfig = {
  /** 是否为开发模式 */
  isDev: import.meta.env.DEV,

  /** 是否为生产模式 */
  isProd: import.meta.env.PROD,

  /** 当前模式 */
  mode: import.meta.env.MODE,

  /** 是否启用调试 */
  enableDebug: import.meta.env.DEV,

  /** 是否启用 Electron */
  isElectron: typeof window !== 'undefined' && !!window.electron,

  /** WebSocket 地址 */
  wsUrl: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
};

/*
// 在 Vue 组件中使用示例：

<script setup lang="ts">
import { envConfig } from '@/utils/env';

// 根据环境显示不同的信息
if (envConfig.isDev) {
  console.log('开发模式：', envConfig);
}

// 条件渲染
const showDebugPanel = envConfig.isDev;
</script>

<template>
  <div>
    <div v-if="showDebugPanel" class="debug-panel">
      调试面板（仅开发环境显示）
    </div>
  </div>
</template>
*/
