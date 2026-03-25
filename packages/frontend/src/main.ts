import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { i18n } from './i18n';
import { initElectrobunDesktopBridge } from './native/electrobun-bridge';
import router from './router';
import './assets/styles/main.css';
import { initStats } from './utils/common';

initElectrobunDesktopBridge();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

app.mount('#app');
initStats();
