/*
 * @Author: shenlan
 * @Description:
 */
import Vue from 'vue';
import Vuex from 'vuex';

import app from './module/app';
import userInfo from './module/userInfo';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    app,
    userInfo
  }
});
