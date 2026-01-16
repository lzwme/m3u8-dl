<template>
  <div class="collapse-wrapper" :class="wrapperClass">
    <button
      @click="toggle"
      class="w-full flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200"
      :class="buttonClass"
    >
      <div class="flex items-center flex-1">
        <!-- 左侧图标插槽 -->
        <slot name="icon">
          <div v-if="icon" class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mr-2 sm:mr-3" :class="iconBgClass">
            <i :class="icon" class="text-white text-[10px] sm:text-sm"></i>
          </div>
        </slot>
        <!-- 标题 -->
        <span class="text-xs sm:text-sm font-medium text-gray-700" :class="titleClass">
          <slot name="title">{{ title }}</slot>
        </span>
      </div>
      <!-- 右侧折叠指示器 -->
      <i
        :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        class="text-gray-400 text-[10px] sm:text-xs transition-transform duration-200"
        :style="{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(0deg)' }"
      ></i>
    </button>

    <!-- 折叠内容 -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 transform -translate-y-4 max-h-0"
      enter-to-class="opacity-100 transform translate-y-0 max-h-[2000px]"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 transform translate-y-0 max-h-[2000px]"
      leave-to-class="opacity-0 transform -translate-y-4 max-h-0"
    >
      <div v-if="isExpanded" class="collapse-content" :class="contentClass">
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';

interface Props {
  /** 标题 */
  title?: string;
  /** 左侧图标类名（FontAwesome） */
  icon?: string;
  /** 图标背景颜色类 */
  iconBgClass?: string;
  /** 默认是否展开 */
  defaultExpanded?: boolean;
  /** 是否持久化状态到 localStorage */
  persist?: boolean;
  /** 持久化的 key（当 persist 为 true 时使用） */
  persistKey?: string;
  /** 区域标识 key，若存在则自动启用持久化并使用此 key */
  sectionKey?: string;
  /** 外层容器类名 */
  wrapperClass?: string;
  /** 按钮类名 */
  buttonClass?: string;
  /** 标题类名 */
  titleClass?: string;
  /** 内容类名 */
  contentClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: false,
  persist: false,
  iconBgClass: 'bg-gray-600',
  wrapperClass: '',
  buttonClass: '',
  titleClass: '',
  contentClass: 'mt-3 sm:mt-4',
});

const emit = defineEmits<{
  (e: 'update:expanded', value: boolean): void;
  (e: 'change', value: boolean): void;
}>();

// 计算实际使用的持久化 key
const storageKey = computed(() => {
  if (props.sectionKey) {
    return `m3u8dl_collapse_${props.sectionKey}`;
  }
  if (props.persist && props.persistKey) {
    return props.persistKey;
  }
  return null;
});
const isExpanded = ref( props.sectionKey ? localStorage.getItem(storageKey.value!) === 'true' : props.defaultExpanded);

// 从 localStorage 恢复状态
onMounted(() => {
  const key = storageKey.value;
  if (key) {
    const savedState = localStorage.getItem(key);
    if (savedState !== null) {
      isExpanded.value = savedState === 'true';
    }
  }
});

// 监听状态变化，持久化到 localStorage
watch(isExpanded, (newState) => {
  const key = storageKey.value;
  if (key) {
    localStorage.setItem(key, String(newState));
  }
  emit('update:expanded', newState);
  emit('change', newState);
});

function toggle() {
  isExpanded.value = !isExpanded.value;
}

// 暴露方法供外部调用
defineExpose({
  toggle,
  expand: () => {
    isExpanded.value = true;
  },
  collapse: () => {
    isExpanded.value = false;
  },
  isExpanded: () => isExpanded.value,
});
</script>

<style scoped>
.collapse-content {
  overflow: hidden;
}
</style>
