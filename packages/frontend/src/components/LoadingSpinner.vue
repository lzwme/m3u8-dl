<template>
  <div class="flex items-center justify-center p-8">
    <div class="relative">
      <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
    <span v-if="text" class="ml-3 text-gray-600">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text?: string;
}>();
</script>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
