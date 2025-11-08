<template>
  <button
    :class="buttonClass"
    class="cursor-pointer hover:underline transition-colors"
    @click="$emit('click')"
  >
    <i :class="`fas ${icon} mr-1`"></i>
    <span>{{ text }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  icon: string;
  text: string;
  color: 'blue' | 'green' | 'red' | 'yellow';
}>();

defineEmits<{
  (e: 'click'): void;
}>();

const buttonClass = computed(() => {
  const colorMap = {
    blue: 'text-blue-600 hover:text-blue-800',
    green: 'text-green-500 hover:text-green-600',
    red: 'text-red-500 hover:text-red-600',
    yellow: 'text-yellow-500 hover:text-yellow-600',
  };
  return colorMap[props.color] || colorMap.blue;
});
</script>
