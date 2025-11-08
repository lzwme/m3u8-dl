import { type Ref, ref, watch } from 'vue';

export function useDebounce<T>(value: Ref<T>, delay = 300): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>;

  let timeoutId: number | null = null;

  watch(
    value,
    newValue => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        debouncedValue.value = newValue;
      }, delay);
    },
    { immediate: true }
  );

  return debouncedValue;
}
