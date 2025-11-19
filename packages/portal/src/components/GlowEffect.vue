<template>
  <div class="relative overflow-hidden">
    <div class="glow-orb glow-orb-1"></div>
    <div class="glow-orb glow-orb-2"></div>
    <div class="glow-orb glow-orb-3"></div>
    <slot />
  </div>
</template>

<style scoped>
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s ease-in-out infinite;
  pointer-events: none;
  mix-blend-mode: screen;
}

.glow-orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
  top: -150px;
  left: -150px;
  animation-delay: 0s;
}

.glow-orb-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
  bottom: -125px;
  right: -125px;
  animation-delay: 3s;
}

.glow-orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgb(5, 109, 74) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 6s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(30px, -30px) rotate(90deg);
  }
  50% {
    transform: translate(-20px, 20px) rotate(180deg);
  }
  75% {
    transform: translate(-30px, -20px) rotate(270deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glow-orb {
    animation: none;
  }
}
</style>
