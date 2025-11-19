<template>
  <canvas ref="canvasRef" class="fixed inset-0 w-full h-full pointer-events-none" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
const particles = ref<Particle[]>([]);
const animationId = ref<number>();
const mousePosition = ref({ x: 0, y: 0 });

// 初始化粒子
function initParticles(canvas: HTMLCanvasElement) {
  const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
  const particlesArray: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const radius = Math.random() * 2 + 0.5;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const vx = (Math.random() - 0.5) * 0.3;
    const vy = (Math.random() - 0.5) * 0.3;
    const opacity = Math.random() * 0.3 + 0.1;
    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    particlesArray.push({ x, y, vx, vy, radius, opacity, color });
  }

  particles.value = particlesArray;
}

// 绘制粒子
function drawParticles(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.value.forEach((particle, index) => {
    // 更新位置
    particle.x += particle.vx;
    particle.y += particle.vy;

    // 边界检测
    if (particle.x < 0 || particle.x > canvas.width) particle.vx = -particle.vx;
    if (particle.y < 0 || particle.y > canvas.height) particle.vy = -particle.vy;

    // 鼠标交互
    const dx = mousePosition.value.x - particle.x;
    const dy = mousePosition.value.y - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 100) {
      const force = (100 - distance) / 100;
      particle.vx -= (dx / distance) * force * 0.02;
      particle.vy -= (dy / distance) * force * 0.02;
    }

    // 绘制粒子
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.opacity;
    ctx.fill();

    // 连线效果
    particles.value.forEach((particle2, index2) => {
      if (index !== index2) {
        const dx2 = particle.x - particle2.x;
        const dy2 = particle.y - particle2.y;
        const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (distance2 < 120) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle2.x, particle2.y);
          ctx.strokeStyle = particle.color;
          ctx.globalAlpha = (1 - distance2 / 120) * 0.2;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
  });

  ctx.globalAlpha = 1;
}

// 动画循环
function animate() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  drawParticles(ctx, canvas);
  animationId.value = requestAnimationFrame(animate);
}

// 调整画布大小
function resizeCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if (particles.value.length === 0) {
    initParticles(canvas);
  }
}

// 鼠标移动事件
function handleMouseMove(e: MouseEvent) {
  mousePosition.value = { x: e.clientX, y: e.clientY };
}

onMounted(() => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('mousemove', handleMouseMove);
  animate();
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
  window.removeEventListener('mousemove', handleMouseMove);
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }
});
</script>