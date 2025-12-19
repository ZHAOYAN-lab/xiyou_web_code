/*
 * @Author: shenlan
 * @Description: 路由
 */

import ViewUI from 'view-design';
import Vue from 'vue';
import Router from 'vue-router';
import routes from './routers';
import store from '@/store';
import config from '@/config';
import pub from '@/lib/js/pub';

import { baseSetTitle } from './util';
import { catchToken } from '@/lib/js/cache';

Vue.use(Router);

const { homeName, loginPage } = config;
const mobileHome = 'h5_location';
const { slBrowserDevice } = pub;

const router = new Router({
  routes
});

router.beforeEach((to, from, next) => {
  ViewUI.LoadingBar.start();

  const token = catchToken.get();
  const mobile = slBrowserDevice().mobile;

  // ★★★ 关键：当前登录用户名（从 store 或 token 中取）
  const username =
    store.state.userInfo?.userName ||
    store.state.userInfo?.username ||
    '';

  const isWorker = username === 'worker1';

  // ========== 未登录 ==========
  if (!token && to.name !== loginPage) {
    next({ name: loginPage });
    return;
  }

  if (!token && to.name === loginPage) {
    next();
    return;
  }

  // ========== 已登录 ==========
  if (token && to.name === loginPage) {
    // worker1 登录后强制进 h5
    if (isWorker) {
      next({ name: mobileHome });
    } else {
      next({ name: mobile ? mobileHome : homeName });
    }
    return;
  }

  // ========== 已登录 + 已拉用户信息 ==========
  if (store.state.userInfo.hasGetInfo) {
    // ★★★ worker1：只能访问 h5_location
    if (isWorker && to.name !== mobileHome) {
      next({ name: mobileHome });
      return;
    }

    // 原有 mobile 限制逻辑
    if (mobile && to.name !== mobileHome) {
      next({ name: mobileHome });
    } else {
      next();
    }
    return;
  }

  // ========== 已登录 + 未拉用户信息 ==========
  store
    .dispatch('getUserInfo')
    .then(() => {
      const username =
        store.state.userInfo?.userName ||
        store.state.userInfo?.username ||
        '';

      const isWorker = username === 'worker1';

      if (isWorker && to.name !== mobileHome) {
        next({ name: mobileHome });
        return;
      }

      if (mobile && to.name !== mobileHome) {
        next({ name: mobileHome });
      } else {
        next();
      }
    })
    .catch(() => {
      catchToken.remove();
      next({ name: 'login' });
    });
});

router.afterEach((to) => {
  baseSetTitle(to, router.app);
  ViewUI.LoadingBar.finish();
  window.scrollTo(0, 0);
});

export default router;
