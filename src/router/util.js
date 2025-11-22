import config from '@/config';
import routes from './routers';
import i18n from '@/language'; // 国际化

const { permissionDeniedRedirectPage } = config;

/**
 * 权鉴
 * @param {*} name 即将跳转的路由name
 * @param {*} access 用户权限数组
 * @param {*} routes 路由列表
 * @description 用户是否可跳转到该页
 */
const baseCanTurnTo = (name, access, routes) => {
  const routePermissionJudge = (list) => {
    return list.some((item) => {
      if (item.children && item.children.length) {
        return routePermissionJudge(item.children);
      } else if (item.name === name) {
        if (item.meta && item.meta.access) {
          return access.some((_) => item.meta.access.indexOf(_) > -1);
        } else {
          return true;
        }
      }
    });
  };

  return routePermissionJudge(routes);
};

/**
 * @description 根据当前跳转的路由设置显示在浏览器标签的title
 * @param {Object} routeItem 路由对象
 * @param {Object} vm Vue实例
 */
export const baseSetTitle = (routeItem, vm) => {
  const getRouteTitleHandled = (route) => {
    let router = { ...route };

    let meta = { ...route.meta };
    let title = '';
    if (meta.title) {
      if (typeof meta.title === 'function') {
        meta.__titleIsFunction__ = true;
        title = meta.title(router);
      } else {
        title = meta.title;
      }
    }
    meta.title = title;
    router.meta = meta;
    return router;
  };

  const baseShowTitle = (item) => {
    let { title } = item.meta;

    if (!title) {
      return;
    }
    title = (item.meta && item.meta.title) || item.name;

    return title;
  };

  let copyTitle = i18n.messages[i18n.locale].base.systemName;

  const handledRoute = getRouteTitleHandled(routeItem);
  const pageTitle = baseShowTitle(handledRoute, vm);
  const resTitle = pageTitle ? `${copyTitle} - ${pageTitle}` : copyTitle;
  window.document.title = resTitle;
};

export const routerCheckCanTurnTo = (to, access, next) => {
  if (baseCanTurnTo(to.name, access, routes)) {
    next(); // 有权限，可访问
  } else {
    next({ replace: true, name: permissionDeniedRedirectPage }); // 无权限，重定向页面
  }
};
