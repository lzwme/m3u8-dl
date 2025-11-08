import { createRouter, createWebHistory } from 'vue-router';
import About from '@/views/About.vue';
import Config from '@/views/Config.vue';
import Download from '@/views/Download.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/download',
    },
    {
      path: '/download',
      name: 'download',
      component: Download,
    },
    {
      path: '/config',
      name: 'config',
      component: Config,
    },
    {
      path: '/about',
      name: 'about',
      component: About,
    },
  ],
});

export default router;
