<template>
  <div
    v-if="visible"
    class="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
    @click.self="close"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div class="p-6">
        <h2 class="text-xl font-semibold mb-4">确认删除</h2>
        <p class="text-gray-600 mb-6">
          确定要删除选中的 {{ count }} 个任务吗？
        </p>
        <div class="space-y-3 mb-6">
          <label class="flex items-center cursor-pointer">
            <input
              v-model="deleteCache"
              type="checkbox"
              class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500 mr-3"
            />
            <span class="text-gray-700">同时删除已下载的缓存文件</span>
          </label>
          <label class="flex items-center cursor-pointer">
            <input
              v-model="deleteVideo"
              type="checkbox"
              class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500 mr-3"
            />
            <span class="text-red-700 font-medium">同时删除已下载的视频文件</span>
          </label>
        </div>
        <div class="flex justify-end gap-3">
          <button
            @click="close"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleConfirm"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  count: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', options: { deleteCache: boolean; deleteVideo: boolean }): void;
}>();

const deleteCache = ref(true);
const deleteVideo = ref(true);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      deleteCache.value = true;
      deleteVideo.value = true;
    }
  }
);

function close() {
  emit('close');
}

function handleConfirm() {
  emit('confirm', {
    deleteCache: deleteCache.value,
    deleteVideo: deleteVideo.value,
  });
  close();
}
</script>
