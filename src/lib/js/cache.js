/*
 * @Author: shenlan
 * @Description: 本地缓存数据
 */

import config from '@/config';

import { slCacheCookie, slCacheStorage } from 'shenlan-util';

//配置 存储本地 数据 key
const cache = {
  //token在Cookie中存储的天数
  cookieExpires: config.cookieExpires,
  token: `${config.projectName}_TOKEN`,
  language: `${config.projectName}_LANGUAGE`
};

/*******************************设置token********************************** */

export const catchToken = {
  set: (token) => {
    slCacheCookie.set(cache.token, token, cache.cookieExpires);
  },
  get: () => {
    return slCacheCookie.get(cache.token);
  },
  remove: () => {
    slCacheCookie.remove(cache.token);
  }
};

/*******************************设置token********************************** */

/*******************************设置language********************************** */

export const catchLanguage = {
  set: (value) => {
    slCacheStorage.localStorage.set(cache.language, value);
  },
  get: () => {
    const val = slCacheStorage.localStorage.get(cache.language);

    return val ? val : config.language;
  }
};

/*******************************设置language********************************** */
