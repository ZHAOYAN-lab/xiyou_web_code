/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-06-28 11:51:06
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-14 17:35:23
 * @Description:登录
 */

import axios from '~axios';

//url地址
const urls = {
  login: '/ifengniao/cloud/server/xiyou/token/request',
  userInfo: '/ifengniao/cloud/server/xiyou/user/loginer'
};

//token 换取用户信息
const loginMethod = (params) => axios.post(urls.login, params);

// 获取用户信息

const loginGetUserInfo = (params) => axios.get(urls.userInfo, params);
export default {
  loginMethod,
  loginGetUserInfo
};
