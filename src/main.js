import Vue from 'vue';
import App from './App.vue';
import store from './store';
import router from './router';
import i18n from '@/language'; // 国际化

import './plugins/index';

Vue.config.productionTip = false;

import 'core-js/stable';
import 'regenerator-runtime/runtime';

new Vue({
  i18n,
  store,
  router,
  render: (h) => h(App)
}).$mount('#app');
