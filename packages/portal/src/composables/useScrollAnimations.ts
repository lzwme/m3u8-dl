import { onMounted, onUnmounted, ref } from 'vue';

export function useScrollAnimations() {
  const animatedElements = ref<Element[]>([]);

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observerCallback = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');

        // 添加延迟动画效果
        const animations = entry.target.querySelectorAll('[data-delay]');
        animations.forEach(element => {
          const el = element as HTMLElement;
          const delay = Number.parseInt(el.dataset.delay || '0', 10);
          el.style.animationDelay = `${delay}ms`;
        });
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  onMounted(() => {
    // 查找所有需要动画的元素
    const elements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.value = Array.from(elements);

    // 为每个元素添加初始状态
    elements.forEach(el => {
      const element = el as HTMLElement;
      const animationType = element.dataset.animation || 'fade-up';
      element.classList.add('animation-initial', animationType);
    });

    // 开始观察
    elements.forEach(el => observer.observe(el));
  });

  onUnmounted(() => {
    animatedElements.value.forEach(el => observer.unobserve(el));
  });

  return {
    animatedElements,
  };
}

// 定义动画类型
export const animationTypes = {
  'fade-up': 'translate-y-8 opacity-0',
  'fade-down': '-translate-y-8 opacity-0',
  'fade-left': '-translate-x-8 opacity-0',
  'fade-right': 'translate-x-8 opacity-0',
  'scale-up': 'scale-95 opacity-0',
  'scale-down': 'scale-105 opacity-0',
  'rotate-in': 'rotate-3 opacity-0',
};

// 定义动画进入后的类
export const animationInClasses = {
  'fade-up': '!translate-y-0 !opacity-100',
  'fade-down': '!-translate-y-0 !opacity-100',
  'fade-left': '!-translate-x-0 !opacity-100',
  'fade-right': '!translate-x-0 !opacity-100',
  'scale-up': '!scale-100 !opacity-100',
  'scale-down': '!scale-100 !opacity-100',
  'rotate-in': '!rotate-0 !opacity-100',
};

// 基础过渡动画
export const baseTransition = 'transition-all duration-700 ease-out';
export const baseTransitionDelay = 'transition-all duration-700 ease-out';
