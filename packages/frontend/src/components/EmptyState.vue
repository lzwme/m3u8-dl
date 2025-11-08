<template>
  <div class="p-8 text-center text-gray-500">
    <i class="fas fa-download text-4xl mb-4"></i>
    <p>暂无下载任务</p>
    <button
      @click="$emit('new-download')"
      class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      <i class="fas fa-plus mr-1"></i>添加下载任务
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'new-download'): void;
}>();
</script>
