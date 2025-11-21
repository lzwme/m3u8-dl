<template>
  <div class="fixed inset-0 overflow-hidden pointer-events-none">
    <!-- 动画人物 -->
    <div
      v-for="character in characters"
      :key="character.id"
      class="character cursor-pointer"
      :style="{
        left: character.x + 'px',
        top: character.y + 'px',
        animation: `${character.animation} ${character.duration}ms ease-in-out ${character.delay}ms infinite`,
        fontSize: character.size + 'px'
      }"
      @click="handleCharacterClick(character.id)"
    >
      {{ character.emoji }}
    </div>

    <!-- 点击爆炸效果 -->
    <div
      v-for="effect in clickEffects"
      :key="effect.id"
      class="click-effect"
      :style="{
        left: effect.x + 'px',
        top: effect.y + 'px',
        transform: 'translate(-50%, -50%)'
      }"
    >
      {{ effect.emoji }}
    </div>

    <!-- 粒子效果 -->
    <div
      v-for="particle in particles"
      :key="particle.id"
      class="particle"
      :style="{
        left: particle.x + 'px',
        top: particle.y + 'px',
        backgroundColor: particle.color,
        '--tx': particle.tx + 'px',
        '--ty': particle.ty + 'px'
      }"
    ></div>

    <!-- 漂浮文字 -->
    <div
      v-for="text in floatingTexts"
      :key="text.id"
      class="floating-text"
      :style="{
        left: text.x + 'px',
        top: text.y + 'px',
        color: text.color
      }"
    >
      {{ text.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Character {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  animation: string;
  duration: number;
  delay: number;
}

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  tx: number;
  ty: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const characters = ref<Character[]>([]);
const clickEffects = ref<ClickEffect[]>([]);
const particles = ref<Particle[]>([]);
const floatingTexts = ref<FloatingText[]>([]);
const animationInterval = ref<number>();

// 动画效果名称
const animations = [
  'float',
  'bounce',
  'spin',
  'pulse',
  'swing',
  'fadeInOut',
  'shake',
  'wobble'
];

// 动画人物表情
const emojis = [
  '🚀', '🦜', '✨', '💫', '🌟', '☄️', '🛸', '👽', '🤖', '🧞‍♂️',
  '🐡', '🦉', '🎭', '🦹', '🧚‍♀️', '🎲', '🦸‍♂️', '🎳', '🦖', '🧜‍♀️',
  '🦄', '🦋', '🐉', '😈', '🔮', '🐒', '🎀', '🎈', '🎉', '🎊',
  '🏄', '🚁', '🛩️', '🧚', '🐲', '🐣', '🦄', '👼', '🐠', '🐬'
];

// 粒子颜色
const particleColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEEAD', '#FFD93D', '#FF9A8B', '#A8E6CF',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C'
];

// 鼓励语
const popWords = [
  'POP!', 'WOW!', 'NICE!', 'COOL!', '✨', '🌟',
  '+1', 'BOOM!', 'GREAT!', 'SUPER!', 'YEAH!'
];

// 生成随机动画人物
function generateCharacters() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const characterCount = Math.floor(Math.random() * 4) + 2; // 2-5个角色

  const newCharacters: Character[] = [];

  for (let i = 0; i < characterCount; i++) {
    newCharacters.push({
      id: Date.now() + i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * (windowWidth - 60),
      y: Math.random() * (windowHeight - 60),
      size: Math.random() * 30 + 16, // 16-46px
      animation: animations[Math.floor(Math.random() * animations.length)],
      duration: Math.random() * 3000 + 2000, // 2-5秒
      delay: Math.random() * 1000 // 0-1秒延迟
    });
  }

  characters.value = newCharacters;
}

// 处理角色点击事件
function handleCharacterClick(characterId: number) {
  const character = characters.value.find(c => c.id === characterId);
  if (character) {
    const centerX = character.x + character.size / 2;
    const centerY = character.y + character.size / 2;

    // 添加点击爆炸效果
    createClickEffect(character.emoji, centerX, centerY);

    // 添加粒子效果
    createParticles(centerX, centerY);

    // 添加漂浮文字
    createFloatingText(centerX, centerY);

    // 立即变换该角色的样式
    character.emoji = emojis[Math.floor(Math.random() * emojis.length)];
    character.animation = animations[Math.floor(Math.random() * animations.length)];
    character.duration = Math.random() * 3000 + 2000;
    character.delay = Math.random() * 1000;
    character.size = Math.random() * 100 + 16;

    // 添加一个临时的放大效果
    character.size = character.size * 1.5;
    setTimeout(() => {
      character.size = Math.random() * 40 + 16;
    }, 300);
  }
}

// 创建点击效果
function createClickEffect(emoji: string, x: number, y: number) {
  const effectId = Date.now();
  clickEffects.value.push({
    id: effectId,
    emoji,
    x,
    y
  });

  // 1秒后移除效果
  setTimeout(() => {
    const index = clickEffects.value.findIndex(e => e.id === effectId);
    if (index !== -1) {
      clickEffects.value.splice(index, 1);
    }
  }, 1000);
}

// 创建粒子效果
function createParticles(x: number, y: number) {
  const count = 8 + Math.floor(Math.random() * 6); // 8-14个粒子
  const newParticles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 30 + Math.random() * 60; // 扩散距离
    const id = Date.now() + i + Math.random();

    newParticles.push({
      id,
      x,
      y,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      tx: Math.cos(angle) * speed,
      ty: Math.sin(angle) * speed
    });
  }

  particles.value.push(...newParticles);

  // 移除粒子
  setTimeout(() => {
    const ids = newParticles.map(p => p.id);
    particles.value = particles.value.filter(p => !ids.includes(p.id));
  }, 1000);
}

// 创建漂浮文字
function createFloatingText(x: number, y: number) {
  const id = Date.now() + Math.random();
  const text = popWords[Math.floor(Math.random() * popWords.length)];

  floatingTexts.value.push({
    id,
    x,
    y,
    text,
    color: particleColors[Math.floor(Math.random() * particleColors.length)]
  });

  // 移除文字
  setTimeout(() => {
    const index = floatingTexts.value.findIndex(t => t.id === id);
    if (index !== -1) floatingTexts.value.splice(index, 1);
  }, 1000);
}

// 定期更新动画人物
function startCharacterAnimation() {
  generateCharacters();
  animationInterval.value = window.setInterval(() => {
    generateCharacters();
  }, Math.random() * 4000 + 3000); // 3-7秒变换一次
}

onMounted(() => {
  startCharacterAnimation();
});

onUnmounted(() => {
  if (animationInterval.value) {
    clearInterval(animationInterval.value);
  }
});
</script>

<style scoped>
.character {
  position: absolute;
  z-index: 10000;
  user-select: none;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  will-change: transform;
  transition: transform 0.3s ease, font-size 0.3s ease;
  pointer-events: auto;
}

.character:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}

.character:active {
  transform: scale(1.3);
  filter: brightness(1.4) saturate(1.3);
}

/* 浮动动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(5deg);
  }
  66% {
    transform: translateY(10px) rotate(-5deg);
  }
}

/* 弹跳动画 */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
}

/* 旋转动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 脉冲动画 */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 摇摆动画 */
@keyframes swing {
  0%, 100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

/* 淡入淡出动画 */
@keyframes fadeInOut {
  0%, 100% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 震动动画 */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px);
  }
}

/* 摇摆动画 */
@keyframes wobble {
  0%, 100% {
    transform: translateX(0);
  }
  15% {
    transform: translateX(-10px) rotate(-5deg);
  }
  30% {
    transform: translateX(10px) rotate(5deg);
  }
  45% {
    transform: translateX(-10px) rotate(-5deg);
  }
  60% {
    transform: translateX(10px) rotate(5deg);
  }
  75% {
    transform: translateX(-5px) rotate(-2deg);
  }
  90% {
    transform: translateX(5px) rotate(2deg);
  }
}

/* 点击爆炸效果 */
.click-effect {
  position: absolute;
  z-index: 10001;
  font-size: 36px;
  animation: explode 1s ease-out forwards;
  pointer-events: none;
}

@keyframes explode {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .character {
    font-size: 14px !important;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .character {
    animation: none !important;
    opacity: 0.6;
  }

  .click-effect {
    animation: none;
  }
}

/* 粒子效果 */
.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  animation: particle-fade 0.8s ease-out forwards;
  z-index: 10002;
}

@keyframes particle-fade {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
    opacity: 0;
  }
}

/* 漂浮文字 */
.floating-text {
  position: absolute;
  font-weight: 800;
  font-size: 20px;
  pointer-events: none;
  animation: float-up 0.8s ease-out forwards;
  z-index: 10000;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  white-space: nowrap;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

@keyframes float-up {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -80%) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -150%) scale(1);
    opacity: 0;
  }
}
</style>
