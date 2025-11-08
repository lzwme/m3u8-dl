import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ServerInfo } from '@/types/api';

export const useServerStore = defineStore('server', () => {
  const serverInfo = ref<ServerInfo>({
    version: '{{version}}',
    ariang: false,
    newVersion: '',
    appUpdateMessage: '',
  });

  function updateServerInfo(info: Partial<ServerInfo>) {
    Object.assign(serverInfo.value, info);
  }

  return {
    serverInfo,
    updateServerInfo,
  };
});
