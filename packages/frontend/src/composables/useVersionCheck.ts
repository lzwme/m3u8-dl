import { useI18n } from 'vue-i18n';
import { useServerStore } from '@/stores/server';
import { toast } from '@/utils/toast';

export function useVersionCheck() {
  const { t, locale } = useI18n();
  const serverStore = useServerStore();

  /**
   * 检测新版本
   * @param showToast 是否显示 toast 提示（默认 true）
   * @returns 返回是否有新版本
   */
  async function checkNewVersion(showToast = true): Promise<boolean> {
    try {
      const response = await fetch(`https://registry.${locale.value === 'zh' ? 'npmmirror' : 'npmjs'}.com/@lzwme/m3u8-dl/latest`);
      const r = await response.json();
      if (r.version) {
        if (r.version === serverStore.serverInfo.version) {
          if (showToast) {
            toast({ text: t('about.latestVersion', { version: r.version }), type: 'success' });
          }
          return false;
        }
          serverStore.updateServerInfo({ newVersion: r.version });
          if (window.electron) {
            window.electron.ipc.send('checkForUpdate');
          } else if (showToast) {
            const url = locale.value === 'zh' ? 'https://m3u8-player.lzw.me/download.html' : 'https://github.com/lzwme/m3u8-dl/releases';
            toast({
              text: t('about.newVersionAvailable', { version: r.version, url }),
              type: 'success',
              duration: 10000,
            });
          }
          return true;
      }
      return false;
    } catch (error) {
      console.error('检查新版本失败:', error);
      if (showToast) {
        toast({
          text: t('about.versionCheckFailed', { error: error instanceof Error ? error.message : t('error.unknownError') }),
          type: 'error',
        });
      }
      return false;
    }
  }

  return {
    checkNewVersion,
  };
}
