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
  });

  const token = ref<string>('');

  async function loadConfig() {
    try {
      const result = await fetchConfig();
      if (result && typeof result === 'object' && 'saveDir' in result) {
        Object.assign(config.value, result);
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
