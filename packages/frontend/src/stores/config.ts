import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DownloadConfig } from '@/types/config';
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
