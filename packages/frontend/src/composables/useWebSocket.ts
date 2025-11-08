import { ref } from 'vue';
import { useServerStore } from '@/stores/server';
import { useTasksStore } from '@/stores/tasks';
import type { DownloadTask } from '@/types/task';
import { toast } from '@/utils/toast';

// 全局 WebSocket 实例，避免路由切换时断开重连
let globalWs: WebSocket | null = null;
let globalReconnectDelay = 3000;
let globalReconnectTimer: number | null = null;
let onUnauthorizedCallback: (() => void) | null = null;
let onPasswordVerifiedCallback: ((success: boolean) => void) | null = null;
let globalToken = '';
// 标记是否正在验证密码（避免在验证过程中显示"连接成功"提示）
let isPasswordVerifying = false;

// 全局重新连接函数，使用新 token
export function reconnectWithToken(newToken: string, isVerifying = false, onVerified?: (success: boolean) => void) {
  globalToken = newToken;
  isPasswordVerifying = isVerifying;
  if (onVerified) {
    onPasswordVerifiedCallback = onVerified;
  }
  // 关闭旧连接
  if (globalWs) {
    try {
      globalWs.close();
    } catch (_e) {
      // 忽略关闭错误
    }
    globalWs = null;
  }
  // 清除重连定时器
  if (globalReconnectTimer) {
    clearTimeout(globalReconnectTimer);
    globalReconnectTimer = null;
  }
  // 使用新 token 连接
  _connect(globalToken);
}

function _connect(token: string) {
  // 如果已经有全局连接且处于打开状态，直接返回
  if (globalWs && globalWs.readyState === WebSocket.OPEN) {
    return;
  }

  // 如果存在旧连接（非打开状态），先关闭
  if (globalWs && globalWs.readyState !== WebSocket.OPEN) {
    try {
      globalWs.close();
    } catch (_e) {
      // 忽略关闭错误
    }
    globalWs = null;
  }

  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${protocol}://${location.host}/ws?token=${token}`;
  const socket = new WebSocket(wsUrl);
  globalWs = socket;

  socket.onmessage = e => {
    try {
      const { type, data } = JSON.parse(e.data);

      // 在函数内部获取 store 实例，确保 Pinia 已初始化
      const tasksStore = useTasksStore();
      const serverStore = useServerStore();

      switch (type) {
        case 'serverInfo':
          serverStore.updateServerInfo(data);
          // 收到 serverInfo 说明密码验证成功，显示成功提示并重置验证标志
          if (isPasswordVerifying) {
            toast({ text: '密码验证成功，连接已建立', type: 'success' });
            isPasswordVerifying = false;
            // 通知密码验证成功
            if (onPasswordVerifiedCallback) {
              onPasswordVerifiedCallback(true);
              onPasswordVerifiedCallback = null;
            }
          }
          break;
        case 'tasks':
          console.log('[WebSocket] 收到任务数据:', data);
          if (data && typeof data === 'object') {
            tasksStore.setTasks(data);
            console.log('[WebSocket] 任务数据已更新，任务数量:', Object.keys(data).length);
          }
          break;
        case 'progress': {
          const progressData = Array.isArray(data) ? data : [data];
          progressData.forEach((item: Partial<DownloadTask>) => {
            if (item.url) {
              tasksStore.updateTask(item.url, item);
            }
          });
          break;
        }
        case 'delete':
          if (Array.isArray(data)) {
            tasksStore.deleteTasks(data);
          }
          break;
        case 'queueStatus':
          if (data) {
            tasksStore.queueStatus = data;
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket 消息解析失败:', error);
    }
  };

  socket.onopen = () => {
    // 如果正在验证密码，延迟显示成功提示，等待实际验证结果
    // 如果验证成功，会在收到 serverInfo 消息后显示成功提示
    if (!isPasswordVerifying) {
      toast({ text: 'ws连接成功', type: 'success' });
    }
    globalReconnectDelay = 3000;
  };

  socket.onclose = ev => {
    console.error('ws连接关闭:', ev.code, ev.reason);
    globalWs = null;

    if (ev.code === 1008) {
      // 如果正在验证密码，说明密码错误
      if (isPasswordVerifying) {
        // 重置验证标志，避免影响后续提示
        isPasswordVerifying = false;
        // 通知密码验证失败
        if (onPasswordVerifiedCallback) {
          onPasswordVerifiedCallback(false);
          onPasswordVerifiedCallback = null;
        }
      } else {
        // 不是验证流程中的错误，触发未授权回调，显示密码输入对话框
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      }
      return;
    }

    toast({
      text: `连接已断开，${globalReconnectDelay / 1000}s 后将重试...`,
      type: 'error',
    });

    // 清除旧的定时器
    if (globalReconnectTimer) {
      clearTimeout(globalReconnectTimer);
    }

    // 使用全局定时器进行重连
    globalReconnectTimer = window.setTimeout(() => {
      globalReconnectDelay += 1000;
      _connect(globalToken);
    }, globalReconnectDelay);
  };

  socket.onerror = error => {
    console.error('WebSocket 错误:', error);
  };
}

export function useWebSocket(token: string, onUnauthorized?: () => void) {
  const ws = ref<WebSocket | null>(null);
  let reconnectTimer: number | null = null;

  // 保存未授权回调和 token
  if (onUnauthorized) {
    onUnauthorizedCallback = onUnauthorized;
  }
  globalToken = token;

  function connect() {
    _connect(token);
    // 更新 ws ref
    if (globalWs) {
      ws.value = globalWs;
    }
  }

  function disconnect() {
    // 清除定时器
    if (globalReconnectTimer) {
      clearTimeout(globalReconnectTimer);
      globalReconnectTimer = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    // 关闭连接
    if (globalWs) {
      globalWs.close();
      globalWs = null;
    }
    ws.value = null;
  }

  return {
    ws,
    connect,
    disconnect,
  };
}
