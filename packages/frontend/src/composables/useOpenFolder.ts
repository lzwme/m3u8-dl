import { onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { envConfig } from '@/utils/env';
import { toast } from '@/utils/toast';

const IPC_CHANNEL = 'open-folder';
const IPC_RESULT_CHANNEL = 'open-folder-result';

/**
 * 打开文件夹的通用 hook
 * 桌面端通过 `window.nativeApi.ipc`（Electrobun 桥接）打开系统文件夹
 */
export function useOpenFolder() {
  const { t } = useI18n();
  const isNativeApp = envConfig.isNativeApp;

  /**
   * 打开指定路径的文件夹
   * @param folderPath 文件夹路径
   * @returns 是否成功发送打开请求
   */
  function openFolder(folderPath: string): boolean {
    if (!isNativeApp) {
      toast({ text: t('taskDetail.openFolderNotSupported'), type: 'warning' });
      return false;
    }
    if (!folderPath) {
      toast({ text: t('taskDetail.openFolderEmptyPath'), type: 'error' });
      return false;
    }

    window.nativeApi?.ipc.send(IPC_CHANNEL, folderPath);
    return true;
  }

  /**
   * 处理打开文件夹的结果
   */
  function handleOpenFolderResult(data: { success: boolean; error?: string }) {
    if (!data.success) {
      toast({ text: data.error || t('taskDetail.openFolderFailed'), type: 'error' });
    }
  }

  /**
   * 注册 IPC 监听器（在组件挂载时调用）
   */
  function registerListener() {
    if (isNativeApp) {
      window.nativeApi?.ipc.on(IPC_RESULT_CHANNEL, handleOpenFolderResult);
    }
  }

  /**
   * 移除 IPC 监听器（在组件卸载时调用）
   */
  function removeListener() {
    if (isNativeApp) {
      window.nativeApi?.ipc.removeAllListeners(IPC_RESULT_CHANNEL);
    }
  }

  // 自动注册和清理监听器
  onMounted(registerListener);
  onUnmounted(removeListener);

  return {
    openFolder,
    isNativeApp,
    registerListener,
    removeListener,
  };
}

export type OpenFolderResult = { success: boolean; error?: string };
