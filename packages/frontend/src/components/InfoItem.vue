<template>
  <span class="flex items-center text-gray-500">
    <i :class="`fas ${icon} mr-1`"></i>
    <span>{{ text }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  text: string;
}>();
</script>
