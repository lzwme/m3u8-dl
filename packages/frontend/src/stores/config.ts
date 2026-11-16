import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DownloadConfig } from '@/types/config';
import { headersToText } from '@/utils/headers';
import { fetchConfig, updateConfig as updateConfigApi } from '@/utils/request';

export const useConfigStore = defineStore('config', () => {
  const config = ref<DownloadConfig>({
    threadNum: 0,
    saveDir: '',
    delCache: true,
    convert: true,
    showPreview: true,
    showLocalPlay: true,
    maxDownloads: 3,
    ffmpegPath: '',
    // 全局默认请求头，新建任务时自动带上
    headers: '',
    // 代理配置默认值
    proxyMode: 'disabled',
    proxyUrl: '',
    noProxy: '', // NO_PROXY 默认值
  });

  const token = ref<string>('');

  async function loadConfig() {
    try {
      const result = await fetchConfig();
      if (result && typeof result === 'object' && 'saveDir' in result) {
        Object.assign(config.value, result);
        // 兼容旧版本服务端：请求头可能是对象，统一转换为 `Key: Value` 文本
        if (result.headers && typeof result.headers !== 'string') {
          config.value.headers = headersToText(result.headers as Record<string, unknown>);
        }
        // 确保代理模式有默认值
        if (!config.value.proxyMode) {
          config.value.proxyMode = 'disabled';
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('加载配置失败:', error);
      return false;
    }
  }

  async function updateConfig() {
    const result = await updateConfigApi(config.value);
    return result;
  }

  return {
    config,
    token,
    loadConfig,
    updateConfig,
  };
});
