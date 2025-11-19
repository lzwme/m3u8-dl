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

const router = createRouter({
  history: createWebHistory('/portal/'),
  routes,
});

// 设置 HTML lang 属性
const locale = detectBrowserLanguage();
document.documentElement.lang = locale;

const app = createApp(App);
app.use(i18n);
app.use(router);

app.mount('#app');
initStats();
