/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-12 13:52:57
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-21 09:06:48
 * @Description: 轨迹追踪
 */

import axios from '~axios';

//url地址
const urls = {
  a: '/ifengniao/cloud/server/xiyou/beaconHistory/find'
};

//获取轨迹
const trackingManageGetTracking = (params) => axios.get(urls.a, params);

export default { trackingManageGetTracking };
