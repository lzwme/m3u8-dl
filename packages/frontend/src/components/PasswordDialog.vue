<template>
  <div
    v-if="visible"
    class="fixed inset-0 modal-overlay flex items-center justify-center z-[9999] p-4"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div class="p-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <i class="fas fa-lock text-red-600"></i>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900">需要访问密码</h2>
            <p class="text-sm text-gray-500 mt-1">请输入正确的访问密码以继续</p>
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">访问密码</label>
          <input
            ref="passwordInput"
            v-model="password"
            type="password"
            maxlength="256"
            class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入访问密码"
            @keyup.enter="handleConfirm"
          />
          <p v-if="errorMessage" class="mt-2 text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <div class="flex justify-end">
          <button
            @click="handleConfirm"
            :disabled="submitting || !password.trim()"
            class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? '验证中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'confirm', password: string): void;
}>();

const password = ref('');
const errorMessage = ref('');
const submitting = ref(false);
const passwordInput = ref<HTMLInputElement | null>(null);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      password.value = '';
      errorMessage.value = '';
      submitting.value = false;
      // 自动聚焦到输入框
      nextTick(() => {
        passwordInput.value?.focus();
      });
    }
  }
);

function handleConfirm() {
  if (submitting.value || !password.value.trim()) return;

  submitting.value = true;
  errorMessage.value = '';

  // 触发确认事件，让父组件处理密码验证和重连
  emit('confirm', password.value.trim());

  // 注意：这里不重置 submitting，由父组件在验证完成后处理
}

// 暴露方法供父组件调用
defineExpose({
  setError: (message: string) => {
    errorMessage.value = message;
    submitting.value = false;
  },
  reset: () => {
    password.value = '';
    errorMessage.value = '';
    submitting.value = false;
  },
});
</script>
