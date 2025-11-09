<template>
  <div
    v-if="visible"
    class="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
    @click.self="close"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div class="p-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <i class="fas fa-exclamation-triangle text-yellow-600"></i>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900">{{ title }}</h2>
          </div>
        </div>
        <div class="mb-6">
          <slot>
            <p class="text-gray-600 whitespace-pre-line">{{ message }}</p>
          </slot>
        </div>
        <div class="flex justify-end gap-3">
          <button
            @click="close"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            @click="handleConfirm"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  visible: boolean;
  title?: string;
  message?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

function close() {
  emit('close');
}

function handleConfirm() {
  emit('confirm');
  close();
}
</script>
