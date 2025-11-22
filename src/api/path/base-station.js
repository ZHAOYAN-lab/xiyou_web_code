/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-06-29 11:48:43
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-14 10:04:50
 * @Description: 基站管理
 */

import axios from '~axios';

//url地址
const urls = {
  demo: '/ifengniao/cloud/server/xiyou/baseStation/page'
};

//API 请求
const baseStationGetTable = (params) => axios.get(urls.demo, params);

export default { baseStationGetTable };
