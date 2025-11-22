/*
 * @Author: shenlan
 * @Description: 用户信息
 */
import { catchToken } from '@/lib/js/cache';
import login from '@/api/path/login';

export default {
  state: {
    token: catchToken.get(),
    hasGetInfo: false,
    access: [],
    userMsg: {
      // avatar: '',
      userName: ''
    }
  },
  mutations: {
    setAccess(state, access) {
      state.access = access;
    },
    setToken(state, token) {
      state.token = token;
      catchToken.set(token);
    },
    setHasGetInfo(state, data) {
      state.hasGetInfo = data.status;
      state.userMsg = data.userInfo;
    }
  },
  getters: {},
  actions: {
    // 获取用户相关信息
    // eslint-disable-next-line no-unused-vars
    getUserInfo({ state, commit }) {
      try {
        return new Promise((resolve) => {
          login
            .loginGetUserInfo({
              loading: false
            })
            .then((res) => {
              // console.log('获取个人信息成功');

              commit('setHasGetInfo', {
                status: true,
                userInfo: res
              });
              resolve(res);
            });
        });
      } catch (error) {
        // console.log(error);
      }
    }
  }
};
