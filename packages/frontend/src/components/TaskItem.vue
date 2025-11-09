<template>
  <div class="download-item p-4 hover:bg-gray-50 relative">
    <div class="flex items-center justify-between mb-2">
      <div class="flex-1">
        <div class="flex items-center">
          <input
            type="checkbox"
            :checked="isSelected"
            @change="$emit('toggle-select')"
            class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500 mr-2"
            :title="$t('taskItem.selectTask', { name: task.showName })"
          />
          <h3 class="font-bold text-green-600 truncate max-w-[calc(100vw-100px)]" :title="task.url">
            {{ task.showName }}
          </h3>
          <div class="absolute right-1 top-1 text-xs rounded overflow-hidden">
            <span v-if="task.status === 'pending'" class="px-2 py-0.5 bg-yellow-100 text-yellow-800">{{ $t('download.status.pending') }}</span>
            <span v-else-if="task.status === 'resume'" class="px-2 py-0.5 bg-green-100 text-green-800">{{ $t('download.status.resume') }}</span>
            <span v-else-if="task.status === 'pause'" class="px-2 py-0.5 bg-gray-100 text-gray-800">{{ $t('download.status.pause') }}</span>
            <span v-else-if="task.status === 'done'" class="px-2 py-0.5 bg-blue-100 text-blue-800">{{ $t('download.status.done') }}</span>
            <span v-else-if="task.status === 'error'" class="px-2 py-0.5 bg-red-100 text-red-600" :title="task.errmsg">
              {{ task.errmsg || $t('download.status.error') }} <i class="fas fa-info-circle"></i>
            </span>
          </div>
        </div>
        <div class="flex items-center text-sm text-gray-500 mt-1 flex-wrap gap-2">
          <span class="cursor-pointer text-blue-600 hover:text-blue-800" @click="$emit('show-detail')">
            <i class="fas fa-info-circle mr-1"></i>
            <span>{{ $t('taskItem.detail') }}</span>
          </span>
          <span v-if="config?.showPreview" class="text-blue-500 hover:text-blue-600 cursor-pointer" @click="$emit('preview')">
            <i class="fas fa-eye mr-1"></i>{{ $t('taskItem.preview') }}
          </span>
          <span v-if="config?.showLocalPlay" class="text-green-500 hover:text-green-600 cursor-pointer" @click="$emit('local-play')">
            <i class="fas fa-play-circle mr-1"></i>{{ task.localVideo ? $t('taskItem.play') : $t('taskItem.localPlay') }}
          </span>
          <span v-if="task.duration" class="flex items-center">
            <i class="fas fa-clock mr-1"></i>
            <span>{{ $t('taskItem.duration') }}: {{ formatTimeCost(task.duration * 1000) }}</span>
          </span>
          <span class="flex items-center">
            <i class="fas fa-file-video mr-1"></i>
            <span>{{ $t('taskItem.size') }}: {{ formatSize(task.downloadedSize || 0) }}</span>
          </span>
          <span v-if="task.tsCount" class="flex items-center">
            <i class="fas fa-file-alt mr-1"></i>
            <span>{{ $t('taskItem.segments') }}: {{ (task.tsSuccess || 0) + (task.tsFailed || 0) }}/{{ task.tsCount }}</span>
          </span>
          <span v-if="task.status === 'resume'" class="flex items-center">
            <i class="fas fa-hourglass-half mr-1"></i>
            <span>{{ $t('taskItem.remaining') }}: {{ formatTimeCost(task.remainingTime || 0) }}</span>
          </span>
        </div>
      </div>
      <div class="flex space-x-2">
        <button
          v-if="task.status === 'resume' || task.status === 'pending'"
          @click="$emit('pause')"
          class="p-2 text-yellow-500 hover:bg-yellow-50 rounded"
          :title="$t('taskItem.pause')"
        >
          <i class="fas fa-pause"></i>
        </button>
        <button
          v-if="task.status === 'pause' || task.status === 'error'"
          @click="$emit('resume')"
          class="p-2 text-green-500 hover:bg-green-50 rounded"
          :title="$t('taskItem.resume')"
        >
          <i class="fas fa-play"></i>
        </button>
        <button
          @click="$emit('delete')"
          class="p-2 text-red-500 hover:bg-red-50 rounded"
          :title="$t('taskItem.delete')"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="relative pt-1">
      <div class="flex mb-2 items-center justify-between">
        <div class="flex items-center">
          <span class="text-xs font-semibold inline-block text-blue-600">
            {{ task.progress || 0 }}%
          </span>
        </div>
        <div>
          <span class="text-xs font-semibold inline-block py-1 px-2 rounded text-green-600">
            {{ task.speedDesc }}
          </span>
        </div>
      </div>
      <div class="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
        <div
          :style="{ width: (task.progress || 0) + '%' }"
          class="progress-bar shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DownloadTask } from '@/types/task';
import { useConfigStore } from '@/stores/config';
import { formatSize, formatTimeCost } from '@/utils/format';

const { t } = useI18n();

defineProps<{
  task: DownloadTask;
  isSelected: boolean;
}>();

defineEmits<{
  (e: 'toggle-select'): void;
  (e: 'show-detail'): void;
  (e: 'preview'): void;
  (e: 'local-play'): void;
  (e: 'pause'): void;
  (e: 'resume'): void;
  (e: 'delete'): void;
}>();

const configStore = useConfigStore();
const config = computed(() => configStore.config);
</script>
