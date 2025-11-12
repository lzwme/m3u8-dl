import { createRouter, createWebHistory } from 'vue-router';
import About from '@/views/About.vue';
import Completed from '@/views/Completed.vue';
import Config from '@/views/Config.vue';
import Download from '@/views/Download.vue';
import WebBrowser from '@/views/WebBrowser.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/page/download',
    },
    {
      path: '/page/download',
      name: 'download',
      component: Download,
    },
    {
      path: '/page/web-browser',
      name: 'web-browser',
      component: WebBrowser,
    },
    {
      path: '/page/completed',
      name: 'completed',
      component: Completed,
    },
    {
      path: '/page/config',
      name: 'config',
      component: Config,
    },
    {
      path: '/page/about',
      name: 'about',
      component: About,
    },
  ],
});

export default router;
