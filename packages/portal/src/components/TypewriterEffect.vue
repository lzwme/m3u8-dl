<template>
  <span class="typewriter">
    <span>{{ displayText }}</span>
    <span class="cursor">|</span>
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Props {
  text: string | string[];
  speed?: number;
  deleteSpeed?: number;
  delayBetweenTexts?: number;
  loop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  speed: 100,
  deleteSpeed: 50,
  delayBetweenTexts: 2000,
  loop: true,
});

const displayText = ref('');
const currentIndex = ref(0);
const isTyping = ref(true);
const textArray = ref<string[]>([]);

onMounted(() => {
  if (Array.isArray(props.text)) {
    textArray.value = props.text;
  } else {
    textArray.value = [props.text];
  }
  startTyping();
});

async function startTyping() {
  if (textArray.value.length === 0) return;

  while (props.loop || currentIndex.value < textArray.value.length) {
    const currentText = textArray.value[currentIndex.value % textArray.value.length];
    
    // 打字效果
    await typeText(currentText);
    
    // 等待
    await sleep(props.delayBetweenTexts);
    
    // 删除效果
    if (props.loop || currentIndex.value < textArray.value.length - 1) {
      await deleteText();
    }
    
    currentIndex.value++;
  }
}

async function typeText(text: string) {
  isTyping.value = true;
  displayText.value = '';
  
  for (let i = 0; i <= text.length; i++) {
    displayText.value = text.substring(0, i);
    await sleep(props.speed);
  }
  
  isTyping.value = false;
}

async function deleteText() {
  isTyping.value = true;
  
  for (let i = displayText.value.length; i >= 0; i--) {
    displayText.value = displayText.value.substring(0, i);
    await sleep(props.deleteSpeed);
  }
  
  isTyping.value = false;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

watch(() => props.text, (newText) => {
  if (Array.isArray(newText)) {
    textArray.value = newText;
  } else {
    textArray.value = [newText];
  }
  currentIndex.value = 0;
  displayText.value = '';
  startTyping();
});
</script>

<style scoped>
.typewriter {
  display: inline-block;
}

.cursor {
  animation: blink 1s infinite;
  font-weight: bold;
  color: #3b82f6;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .cursor {
    animation: none;
  }
}
</style>