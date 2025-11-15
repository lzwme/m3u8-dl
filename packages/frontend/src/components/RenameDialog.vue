<template>
  <div
    v-if="visible"
    class="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div class="p-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            <i class="fas fa-edit text-purple-600"></i>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900">{{ $t('completedList.renameTitle') }}</h2>
          </div>
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('completedList.newFilename') }}</label>
          <input
            ref="renameInput"
            v-model="renameInputValue"
            type="text"
            class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            :placeholder="$t('completedList.filenamePlaceholder')"
            @keyup.enter="handleConfirm"
            @keyup.esc="handleClose"
          />
          <p v-if="renameError" class="mt-2 text-sm text-red-600">{{ renameError }}</p>
        </div>
        <div class="flex justify-end gap-3">
          <button
            @click="handleClose"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            @click="handleConfirm"
            :disabled="!renameInputValue.trim() || renaming"
            class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ renaming ? $t('common.loading') : $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTasksStore } from '@/stores/tasks';
import { renameDownload, fetchTasks } from '@/utils/request';
import { toast } from '@/utils/toast';
import type { DownloadTask } from '@/types/task';

const { t } = useI18n();
const tasksStore = useTasksStore();

const props = defineProps<{
  visible: boolean;
  task: DownloadTask | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
  (e: 'error', message: string): void;
}>();

const renameInputValue = ref('');
const renameError = ref('');
const renaming = ref(false);
const renameInput = ref<HTMLInputElement | null>(null);

// 当对话框显示时，初始化输入值
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.task) {
      // 获取当前文件名（不含扩展名）
      const currentFilename = props.task.filename || props.task.dlOptions?.filename || props.task.showName || '';
      const filenameWithoutExt = currentFilename.replace(/\.[^.]+$/, '');
      renameInputValue.value = filenameWithoutExt;
      renameError.value = '';
      renaming.value = false;

      nextTick(() => {
        renameInput.value?.focus();
        renameInput.value?.select();
      });
    } else if (!visible) {
      // 关闭时重置
      renameInputValue.value = '';
      renameError.value = '';
      renaming.value = false;
    }
  },
  { immediate: true }
);

function handleClose() {
  if (!renaming.value) {
    emit('close');
  }
}

async function handleConfirm() {
  if (!props.task || !renameInputValue.value.trim() || renaming.value) {
    return;
  }

  // 验证文件名
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(renameInputValue.value)) {
    renameError.value = t('completedList.invalidFilename');
    return;
  }

  renaming.value = true;
  renameError.value = '';

  try {
    const result = await renameDownload(props.task.url, renameInputValue.value.trim());

    if (!result.code) {
      // 重命名成功
      toast({ text: result.message || t('toast.renameSuccess'), type: 'success' });

      // 刷新任务列表
      const tasks = await fetchTasks();
      tasksStore.setTasks(tasks);

      // 关闭对话框
      renaming.value = false;
      emit('success');
      emit('close');
    } else {
      // 重命名失败
      const errorMessage = result.message || t('toast.renameFailed');
      toast({ text: errorMessage, type: 'error' });
      renameError.value = errorMessage;
      renaming.value = false;
      emit('error', errorMessage);
    }
  } catch (error) {
    // 处理异常
    const errorMessage = error instanceof Error ? error.message : t('toast.renameFailed');
    toast({ text: errorMessage, type: 'error' });
    renameError.value = errorMessage;
    renaming.value = false;
    emit('error', errorMessage);
  }
}
</script>
