<template>
  <div class="relative pt-2">
    <div class="flex mb-1 items-center justify-between text-xs">
      <span class="font-semibold text-blue-600">{{ progress }}%</span>
      <span v-if="speed" class="font-semibold text-green-600">{{ speed }}</span>
    </div>
    <div class="overflow-hidden h-2 rounded-full bg-blue-100">
      <div
        :style="{ width: `${progress}%` }"
        class="h-full bg-blue-500 transition-all duration-300 ease-out"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  progress: number;
  speed?: string;
}>();
</script>
