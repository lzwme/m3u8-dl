<template>
  <div ref="containerRef" class="relative">
    <button
      @click="showDropdown = !showDropdown"
      class="flex items-center gap-1 px-2 md:px-3 py-2 rounded hover:bg-primary-600/20 hover:text-secondary transition-colors text-white"
      :title="t('common.language')"
    >
      <span>🌐</span>
      <span class="hidden sm:inline text-sm font-medium">{{ currentLocale.name }}</span>
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <div
      v-if="showDropdown"
      class="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 py-2 z-50"
    >
      <button
        v-for="locale in supportedLocales"
        :key="locale.code"
        @click="switchLocale(locale.code)"
        class="w-full text-left px-4 py-2 hover:bg-primary-600/20 hover:text-secondary transition-colors flex items-center space-x-2 text-white"
        :class="{ 'bg-primary-600/30 text-secondary': currentLocale.code === locale.code }"
      >
        <span>{{ locale.flag }}</span>
        <span>{{ locale.name }}</span>
        <svg
          v-if="currentLocale.code === locale.code"
          class="w-4 h-4 ml-auto text-secondary"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { supportedLocales, setLocale } from '@/i18n';

const { locale, t } = useI18n();
const showDropdown = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const currentLocale = computed(() => {
  return supportedLocales.find((l) => l.code === locale.value) || supportedLocales[0];
});

function switchLocale(localeCode: string) {
  setLocale(localeCode);
  showDropdown.value = false;
  // 刷新页面以更新所有内容
  window.location.reload();
}

function closeDropdown() {
  showDropdown.value = false;
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;
  if (containerRef.value && !containerRef.value.contains(target)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (showDropdown.value) {
    showDropdown.value = false;
  }
});
</script>
