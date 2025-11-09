<template>
  <span :class="badgeClass" class="px-2 py-0.5 rounded text-xs font-medium">
    {{ statusText }}
    <i v-if="status === 'error' && errmsg" class="fas fa-info-circle ml-1"></i>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  status: string;
  errmsg?: string;
}>();

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    pending: t('download.status.pending'),
    resume: t('download.status.resume'),
    pause: t('download.status.pause'),
    error: props.errmsg || t('download.status.error'),
    done: t('download.status.done'),
  };
  return statusMap[props.status] || props.status;
});

const badgeClass = computed(() => {
  const classMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    resume: 'bg-green-100 text-green-800',
    pause: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-600',
    done: 'bg-blue-100 text-blue-800',
  };
  return classMap[props.status] || 'bg-gray-100 text-gray-800';
});
</script>
