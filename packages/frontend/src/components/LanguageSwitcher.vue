<template>
  <div class="language-switcher">
    <select
      :value="currentLocale"
      @change="handleLanguageChange"
      class="px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
      :title="$t('common.language')"
    >
      <option value="zh-CN">中文</option>
      <option value="en">English</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const currentLocale = computed({
  get: () => locale.value as string,
  set: (value: string) => {
    locale.value = value;
    localStorage.setItem('language', value);
  },
});

function handleLanguageChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  currentLocale.value = target.value;
}
</script>
