/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-12 17:33:03
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-17 15:37:01
 * @Description: 地图-楼层管理
 */

import axios from '~axios';

//url地址
const urls = {
  a: '/ifengniao/cloud/server/xiyou/localserver/available',
  b: '/ifengniao/cloud/server/xiyou/localserver/uploadCpa',
  c: '/ifengniao/cloud/server/xiyou/localserver/uploadCpaResult',
  d: '/ifengniao/cloud/server/xiyou/localserver/deleteCpa'
};

// 获取列表(通过获取服务列表显示数据)

// 查找可用的本地服务列表
const floorGetLocalServiceAvailable = (params) => axios.get(urls.a, params);

// 新增/编辑
const floorSetAddEditCpa = (params) => axios.post(urls.b, params);

// 获取 cpa 生效状态
const floorGetUploadCpaStatus = (params) => axios.get(urls.c, params);

// 删除
const floorSetDeleteCpa = (params) => axios.deletes(urls.d, params);

export default {
  floorGetLocalServiceAvailable,
  floorSetAddEditCpa,
  floorGetUploadCpaStatus,
  floorSetDeleteCpa
};
