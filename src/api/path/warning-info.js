/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-12 13:52:57
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-24 10:14:54
 * @Description: 告警明细
 */

import axios from '~axios';

//url地址
const urls = {
  a: '/ifengniao/cloud/server/xiyou/alarm/page',
  b: '/ifengniao/cloud/server/xiyou/alarm/delete',
  c: '/ifengniao/cloud/server/xiyou/alarm/handle',
  d: '/ifengniao/cloud/server/xiyou/alarm/mailStatus'
};

//告警列表
const warningInfoGetTable = (params) => axios.get(urls.a, params);

// 删除告警
const warningInfoDelete = (params) => axios.deletes(urls.b, params);

// 处理告警
const warningInfoHandleWarning = (params) => axios.post(urls.c, params);

// 获取邮件开关
const warningInfoGetEmailSwitch = (params) => axios.get(urls.d, params);

// 设置邮件开关
const warningInfoSetEmailSwitch = (params) => axios.post(urls.d, params);

export default {
  warningInfoGetTable,
  warningInfoDelete,
  warningInfoHandleWarning,
  warningInfoGetEmailSwitch,
  warningInfoSetEmailSwitch
};
