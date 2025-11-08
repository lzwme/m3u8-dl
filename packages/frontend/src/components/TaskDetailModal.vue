<template>
  <div
    v-if="visible"
    class="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-2 md:p-4"
    @click.self="close"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div class="flex justify-between items-center p-2 md:p-4 border-b">
        <h2 class="text-lg md:text-xl font-semibold">任务详情</h2>
        <button
          @click="close"
          class="text-gray-500 hover:text-gray-700 transition-colors p-1.5 md:p-2 rounded-lg hover:bg-gray-100"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="overflow-y-auto p-2 md:p-4 flex-1">
        <div v-if="task" class="flex flex-col w-full text-left space-y-2 md:space-y-3">
          <div class="flex items-start">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">名称:</label>
            <span class="ml-1 md:ml-2 text-gray-800 break-words flex-1 text-sm md:text-base">{{ task.filename || task.localVideo || '-' }}</span>
          </div>
          <div class="flex items-center">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">状态:</label>
            <span :class="getStatusClass(task.status)" class="ml-1 md:ml-2 text-xs md:text-sm">{{ getStatusText(task.status) }}</span>
          </div>
          <div class="flex items-center">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">进度:</label>
            <span class="ml-1 md:ml-2 text-gray-800 text-sm md:text-base">{{ task.progress || 0 }}%</span>
          </div>
          <div class="flex items-center">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">平均速度:</label>
            <span class="ml-1 md:ml-2 text-gray-800 text-sm md:text-base">{{ task.avgSpeedDesc || '-' }}/s</span>
          </div>
          <div class="flex items-center">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">大小:</label>
            <span class="ml-1 md:ml-2 text-gray-800 text-sm md:text-base">
              {{ formatSize(task.downloadedSize || 0) }}
              <span v-if="task.size"> / {{ formatSize(task.size) }}</span>
            </span>
          </div>
          <div class="flex items-center" v-if="task.tsCount">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">分片:</label>
            <span class="ml-1 md:ml-2 text-gray-800 text-sm md:text-base">
              <span class="text-green-600">{{ task.tsSuccess || 0 }}</span> /
              <span class="text-red-500">{{ task.tsFailed || 0 }}</span> /
              {{ task.tsCount }}
            </span>
          </div>
          <div class="flex items-center" v-if="task.threadNum">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">并发线程:</label>
            <span class="ml-1 md:ml-2 text-gray-800 text-sm md:text-base">{{ task.threadNum }}</span>
          </div>
          <div class="flex items-center" v-if="(task as any).duration">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">时长:</label>
            <span class="ml-1 md:ml-2 text-gray-800 text-sm md:text-base">{{ formatTimeCost((task as any).duration * 1000) }}</span>
          </div>
          <div class="flex items-center" v-if="task.startTime">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">开始时间:</label>
            <span class="ml-1 md:ml-2 text-gray-800 text-sm md:text-base">{{ new Date(task.startTime).toLocaleString() }}</span>
          </div>
          <div class="flex items-center" v-if="task.endTime && task.status !== 'resume'">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">结束时间:</label>
            <span class="ml-1 md:ml-2 text-gray-800 text-sm md:text-base">{{ new Date(task.endTime).toLocaleString() }}</span>
          </div>
          <div class="flex items-center" v-if="task.status === 'resume' && task.remainingTime">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">预估还需:</label>
            <span class="ml-1 md:ml-2 text-gray-800 text-sm md:text-base">{{ formatTimeCost(task.remainingTime) }}</span>
          </div>
          <div class="flex items-start">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">下载地址:</label>
            <div class="ml-1 md:ml-2 flex-1 flex items-center gap-1 md:gap-2">
              <div class="flex-1 p-1.5 md:p-2 bg-gray-50 rounded border text-xs md:text-sm text-gray-700 break-all">
                {{ task.url }}
              </div>
              <button
                @click="copyToClipboard(task.url)"
                class="px-2 py-1.5 md:px-3 md:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex-shrink-0 text-sm"
                title="复制"
              >
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <div class="flex items-start" v-if="task.localVideo || task.options?.saveDir">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">保存位置:</label>
            <div class="ml-1 md:ml-2 flex-1 flex items-center gap-1 md:gap-2">
              <div class="flex-1 p-1.5 md:p-2 bg-gray-50 rounded border text-xs md:text-sm text-gray-700 break-all">
                {{ task.localVideo || task.options?.saveDir || '-' }}
              </div>
              <button
                v-if="task.localVideo || task.options?.saveDir"
                @click="copyToClipboard(task.localVideo || task.options?.saveDir || '')"
                class="px-2 py-1.5 md:px-3 md:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex-shrink-0 text-sm"
                title="复制"
              >
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <div class="flex items-start" v-if="task.errmsg">
            <label class="font-bold text-right inline-block text-sm md:text-base" style="min-width: 80px; max-width: 80px;">相关信息:</label>
            <span class="ml-1 md:ml-2 text-red-600 break-words flex-1 text-sm md:text-base">{{ task.errmsg }}</span>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 p-2 md:p-4 border-t">
        <button
          @click="close"
          class="px-3 py-1.5 md:px-4 md:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm md:text-base"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DownloadTask } from '@/types/task';
import { formatSize, formatTimeCost } from '@/utils/format';
import { toast } from '@/utils/toast';

defineProps<{
  visible: boolean;
  task: DownloadTask | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function close() {
  emit('close');
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    resume: '下载中',
    pending: '等待中',
    pause: '已暂停',
    error: '异常',
    done: '已完成',
  };
  return statusMap[status] || status;
}

function getStatusClass(status: string): string {
  const classMap: Record<string, string> = {
    resume: 'px-2 py-1 bg-green-100 text-green-800 rounded text-sm inline-block',
    pending: 'px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm inline-block',
    pause: 'px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm inline-block',
    error: 'px-2 py-1 bg-red-100 text-red-600 rounded text-sm inline-block',
    done: 'px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm inline-block',
  };
  return classMap[status] || 'px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm inline-block';
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast({ text: '已复制到剪贴板', type: 'success' });
  } catch (error) {
    console.error('复制失败:', error);
    toast({ text: '复制失败', type: 'error' });
  }
}
</script>
