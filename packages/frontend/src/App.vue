<template>
  <div id="app">
    <router-view />
    <PasswordDialog
      :visible="showPasswordDialog"
      @close="handlePasswordDialogClose"
      @confirm="handlePasswordConfirm"
      ref="passwordDialogRef"
    />
    <NewDownloadDialog
      :visible="showGlobalDownloadDialog"
      :initial-data="globalDialogInitialData"
      @close="handleGlobalDialogClose"
      ref="newDownloadDialogRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfigStore } from '@/stores/config';
import { useWebSocket, reconnectWithToken } from '@/composables/useWebSocket';
import { useVersionCheck } from '@/composables/useVersionCheck';
import PasswordDialog from '@/components/PasswordDialog.vue';
import NewDownloadDialog from '@/components/NewDownloadDialog.vue';

const route = useRoute();
const router = useRouter();
const configStore = useConfigStore();
const { checkNewVersion } = useVersionCheck();
let wsDisconnect: (() => void) | null = null;
const showPasswordDialog = ref(false);
const passwordDialogRef = ref<InstanceType<typeof PasswordDialog> | null>(null);

// 全局下载对话框状态
const showGlobalDownloadDialog = ref(false);
const globalDialogInitialData = ref<{ url?: string; title?: string } | undefined>(undefined);
const newDownloadDialogRef = ref<InstanceType<typeof NewDownloadDialog> | null>(null);
const shouldAutoStart = ref(false);

// 提供全局显示下载对话框的方法
function showGlobalNewDownload(data?: { url?: string; title?: string }) {
  globalDialogInitialData.value = data;
  showGlobalDownloadDialog.value = true;
}

provide('showGlobalNewDownload', showGlobalNewDownload);

function handleGlobalDialogClose() {
  showGlobalDownloadDialog.value = false;
  globalDialogInitialData.value = undefined;
  shouldAutoStart.value = false;
  // 清除 URL 参数
  if (route.query.action === 'new' || route.query.url || route.query.autoStart) {
    router.replace({ query: {} });
  }
}

// 监听对话框打开状态，如果设置了自动开始，则延迟1秒后触发
watch(showGlobalDownloadDialog, async (visible) => {
  if (visible && shouldAutoStart.value) {
    await nextTick();
    setTimeout(() => {
      newDownloadDialogRef.value?.handleSubmit();
      shouldAutoStart.value = false;
    }, 1000);
  }
});

// 处理路由参数
function handleRouteQuery() {
  if (route.query.action === 'new' && route.query.url) {
    const urlParam = route.query.url as string;
    const autoStart = route.query.autoStart === '1';

    shouldAutoStart.value = autoStart;
    showGlobalNewDownload({
      url: decodeURIComponent(urlParam),
    });
  }
}

// 监听路由变化
watch(
  () => route.query,
  () => {
    handleRouteQuery();
  },
  { immediate: true }
);

// 处理未授权，显示密码对话框
function handleUnauthorized() {
  showPasswordDialog.value = true;
}

onMounted(async () => {
  // 首先从 localStorage 加载 token（优先于服务器配置）
  const savedToken = localStorage.getItem('token') || '';
  if (savedToken) {
    configStore.token = savedToken;
  }

  // 尝试加载服务器配置（可能需要 token）
  try {
    await configStore.loadConfig();
  } catch (error) {
    // 如果加载配置失败（可能是未授权），继续使用 localStorage 中的 token
    console.log('[App] 配置加载失败，使用本地 token:', error);
  }

  // 确保使用最新的 token（优先使用 configStore 中的，否则使用 localStorage 中的）
  const tokenToUse = configStore.token || localStorage.getItem('token') || '';
  if (tokenToUse && !configStore.token) {
    configStore.token = tokenToUse;
  }

  // 在应用级别初始化 WebSocket 连接，避免路由切换时断开重连
  // 传入未授权回调，当收到 1008 错误时显示密码对话框
  const { connect, disconnect } = useWebSocket(tokenToUse, handleUnauthorized);
  wsDisconnect = disconnect;

  // 尝试连接 WebSocket
  connect();

  // 应用初始化后检测新版本。延迟一下，避免与 WebSocket 连接冲突
  setTimeout(() => checkNewVersion(false), 5000);
});

onUnmounted(() => {
  // 应用卸载时断开 WebSocket 连接
  if (wsDisconnect) {
    wsDisconnect();
  }
});

// 处理密码对话框关闭（未授权时不允许关闭，此函数不会被调用）
function handlePasswordDialogClose() {
  // 未授权时不允许关闭对话框
}

// 处理密码确认
async function handlePasswordConfirm(password: string) {
  if (!password.trim()) {
    passwordDialogRef.value?.setError('请输入访问密码');
    return;
  }

  try {
    // 处理密码：如果存在 md5，使用 md5 加密前 8 位，否则使用 base64
    let finalToken = password.trim();
    if (typeof window !== 'undefined' && (window as any).md5) {
      finalToken = (window as any).md5(finalToken).slice(0, 8);
    } else {
      finalToken = btoa(finalToken).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    }

    // 更新 token
    configStore.token = finalToken;
    localStorage.setItem('token', finalToken);

    // 使用全局重新连接函数，使用新 token 重新连接
    // 传入 isVerifying=true 标记这是密码验证流程
    reconnectWithToken(finalToken, true, (success: boolean) => {
      if (success) {
        // 密码验证成功，关闭对话框
        showPasswordDialog.value = false;
        passwordDialogRef.value?.reset();
      } else {
        // 密码验证失败，显示错误信息
        passwordDialogRef.value?.setError('密码错误，请重新输入');
      }
    });

    // 重置对话框状态，等待验证结果
    passwordDialogRef.value?.reset();
  } catch (error) {
    passwordDialogRef.value?.setError('密码处理失败，请重试');
    console.error('密码处理失败:', error);
  }
}
</script>
