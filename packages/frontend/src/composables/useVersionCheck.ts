import { useI18n } from 'vue-i18n';
import { useServerStore } from '@/stores/server';
import { toast } from '@/utils/toast';

const CACHE_KEY = 'm3u8-dl-version-check-cache';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6小时（毫秒）

interface VersionCache {
  version: string;
  timestamp: number;
}
/**
 * 获取缓存的版本信息
 */
function getCachedVersion(): VersionCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache: VersionCache = JSON.parse(cached);
    const now = Date.now();
    const isExpired = now - cache.timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cache;
  } catch (error) {
    console.error('读取版本缓存失败:', error);
    return null;
  }
}

/**
 * 保存版本信息到缓存
 */
function setCachedVersion(version: string): void {
  try {
    const cache: VersionCache = {
      version,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('保存版本缓存失败:', error);
  }
}

export function useVersionCheck() {
  const { t, locale } = useI18n();
  const serverStore = useServerStore();

  /**
   * 检测新版本
   * @param showToast 是否显示 toast 提示（默认 true）
   * @param forceCheck 是否强制检测（忽略缓存，默认 false）
   * @returns 返回是否有新版本
   */
  async function checkNewVersion(showToast = true, forceCheck = false): Promise<boolean> {
    try {
      let latestVersion: string | undefined;

      // 检查缓存（除非强制检测）
      if (!forceCheck) {
        latestVersion = getCachedVersion()?.version;
      }

      if (!latestVersion) {
        // Electron 环境下从 GitHub API 获取版本信息
        if (window.electron) {
          const response = await fetch('https://api.github.com/repos/lzwme/m3u8-dl/releases/latest');
          const r = await response.json();
          if (r.tag_name) latestVersion = r.tag_name.replace(/^v/, '');
        } else {
          // 非 Electron 环境从 npm registry 获取
          const response = await fetch(`https://registry.${locale.value === 'zh-CN' ? 'npmmirror' : 'npmjs'}.com/@lzwme/m3u8-dl/latest`);
          const r = await response.json();
          if (r.version) latestVersion = r.version;
        }

        if (latestVersion) setCachedVersion(latestVersion);
      }

      if (latestVersion) {
        const hasNewVersion = latestVersion !== serverStore.serverInfo.version;

        if (!hasNewVersion) {
          if (showToast) {
            toast({ text: t('about.latestVersion', { version: latestVersion }), type: 'success' });
          }
          return false;
        }

        serverStore.updateServerInfo({ newVersion: latestVersion });
        if (window.electron) {
          window.electron.ipc.send('checkForUpdate');
        } else if (showToast) {
          const url = locale.value === 'zh-CN' ? 'https://m3u8-player.lzw.me/download.html' : 'https://github.com/lzwme/m3u8-dl/releases';
          toast({
            text: t('about.newVersionAvailable', { version: latestVersion, url }),
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
