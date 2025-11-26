import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import { detectBrowserLanguage, i18n } from './i18n';
import './assets/styles/main.css';

import { initStats } from './utils/stat';
import Download from './views/Download.vue';
import Home from './views/Home.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/download', component: Download },
];

const BASES = ['/m3u8-dl/portal/', '/portal/'];
const base = import.meta.env.DEV ? '/' : BASES.find(b => window.location.pathname.startsWith(b)) || '/portal/';

const router = createRouter({
  history: createWebHistory(base),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition?.top) return savedPosition;

    return { top: 0, left: 0, behavior: 'smooth' };
  },
});

// 设置 HTML lang 属性
const locale = detectBrowserLanguage();
document.documentElement.lang = locale;

const app = createApp(App);
app.use(i18n);
app.use(router);

app.mount('#app');
setTimeout(() => initStats(), 300);
