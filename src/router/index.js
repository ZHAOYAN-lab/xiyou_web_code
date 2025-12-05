/*
 * @Author: shenlan
 * @Description: 路由
 */

import ViewUI from 'view-design';
import Vue from 'vue';
import Router from 'vue-router';
import routes from './routers';
// eslint-disable-next-line no-unused-vars
import store from '@/store';
import config from '@/config';
import pub from '@/lib/js/pub';

// eslint-disable-next-line no-unused-vars
import { baseSetTitle, routerCheckCanTurnTo } from './util';
import { catchToken } from '@/lib/js/cache';

Vue.use(Router);

// eslint-disable-next-line no-unused-vars
const { homeName, loginPage } = config;
const mobileHome = 'mobile_navigation'; //原h5_location
const { slBrowserDevice } = pub;

const router = new Router({
  routes
  // mode: 'history'
});

router.beforeEach((to, from, next) => {
  ViewUI.LoadingBar.start();
  const token = catchToken.get();

  const mobile = slBrowserDevice().mobile;

  console.log('mobile:', mobile);

  if (!token && to.name !== loginPage) {
    // 未登录且要跳转的页面不是登录页
    next({
      name: loginPage // 跳转到登录页
    });
  } else if (!token && to.name === loginPage) {
    // 未登陆且要跳转的页面是登录页
    next(); // 跳转
  } else if (token && to.name === loginPage) {
    // 已登录且要跳转的页面是登录页
    next({
      name: mobile ? mobileHome : homeName // 跳转到homeName页
    });
  } else {
    if (store.state.userInfo.hasGetInfo) {
      // routerCheckCanTurnTo(to, store.state.userInfo.access, next);

      if (mobile && to.name !== mobileHome) {
        next({
          name: mobileHome
        });
      } else {
        next();
      }
    } else {
      store
        .dispatch('getUserInfo')
        .then(() => {
          // console.log('拉取用户信息，通过用户权限和跳转的页面的name来判断是否有权限访问');
          // 拉取用户信息，通过用户权限和跳转的页面的name来判断是否有权限访问;access必须是一个数组，如：['super_admin'] ['super_admin', 'admin']
          // routerCheckCanTurnTo(to, access, next);

          if (mobile && to.name !== mobileHome) {
            next({
              name: mobileHome
            });
          } else {
            console.log('跳转');

            next();
          }
        })
        .catch(() => {
          // console.log('00000');
          catchToken.remove();
          next({
            name: 'login'
          });
        });
    }
  }
});

router.afterEach((to) => {
  baseSetTitle(to, router.app);
  ViewUI.LoadingBar.finish();
  window.scrollTo(0, 0);
});

export default router;
