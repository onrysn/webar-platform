import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import Toast, { POSITION } from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import './assets/styles.css';
import i18n from './i18n';

const app = createApp(App);
app.use(router);
app.use(Toast, {
  position: POSITION.TOP_RIGHT, 
  timeout: 3000,
});
app.use(createPinia());
app.use(i18n);
app.mount('#app');
