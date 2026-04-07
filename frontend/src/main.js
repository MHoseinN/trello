import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import App from './App.vue';
import router from './router';
import './style.css';

const vuetify = createVuetify({
  components,
  directives,
  locale: {
    rtl: { fa: true },
    locale: 'fa'
  },
  theme: {
    defaultTheme: 'light'
  }
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(Toast, {
  rtl: true,
  position: 'top-right',
  timeout: 2500,
  closeOnClick: true,
  pauseOnHover: true
});

app.mount('#app');
