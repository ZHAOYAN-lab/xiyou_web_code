/*
 * @Author: shenlan
 * @Description: app
 */
import routers from '@/router/routers';
import config from '@/config';

/**
 * @param {Array} list 通过路由列表得到菜单列表
 * @returns {Array}
 */
const baseGetMenuByRouter = (list, access) => {
  const forEach = (arr, fn) => {
    if (!arr.length || !fn) return;
    let i = -1;
    let len = arr.length;
    while (++i < len) {
      let item = arr[i];
      fn(item, i, arr);
    }
  };

  const showThisMenuEle = (item, access) => {
    if (item.meta && item.meta.access && item.meta.access.length) {
      // if (hasOneOf(item.meta.access, access)) {
      if (item.meta.access.some((_) => access.indexOf(_) > -1)) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  };

  const hasChild = (item) => {
    return item.children && item.children.length !== 0;
  };
  let res = [];
  forEach(list, (item) => {
    if (!item.meta || (item.meta && !item.meta.hideInMenu)) {
      let obj = {
        icon: (item.meta && item.meta.icon) || '',
        name: item.name,
        meta: item.meta
      };
      if (
        (hasChild(item) || (item.meta && item.meta.showAlways)) &&
        showThisMenuEle(item, access)
      ) {
        obj.children = baseGetMenuByRouter(item.children, access);
      }
      if (item.meta && item.meta.href) {
        obj.href = item.meta.href;
      }
      if (showThisMenuEle(item, access)) {
        res.push(obj);
      }
    }
  });

  return res;
};

/**
 * @param {Array} routers 路由列表数组
 * @description 用于找到路由列表中name为home的对象
 */
const baseGetHomeRoute = (routers, homeName = 'home') => {
  let i = -1;
  let len = routers.length;
  let homeRoute = {};
  while (++i < len) {
    let item = routers[i];
    if (item.children && item.children.length) {
      let res = baseGetHomeRoute(item.children, homeName);
      if (res.name) return res;
    } else {
      if (item.name === homeName) homeRoute = item;
    }
  }
  return homeRoute;
};
const { homeName } = config;

export default {
  state: {
    homeRoute: {},
    collapsed: false //侧边栏状态,
  },
  getters: {
    menuList: (state, getters, rootState) => baseGetMenuByRouter(routers, rootState.userInfo.access)
  },
  mutations: {
    setHomeRoute(state, routes) {
      state.homeRoute = baseGetHomeRoute(routes, homeName);
    },
    setCollapsed(state, data) {
      state.collapsed = data;
    }
  },
  actions: {}
};
