import './assets/main.css'
import 'virtual:uno.css'
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import i18n from './locales';

const pinia = createPinia();

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(i18n);  // 确保 i18n 在其它插件之前挂载

app.mount('#app');

export { i18n }; // 导出 i18n 实例
