/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-06-29 11:48:43
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-25 08:54:35
 * @Description: 对象管理
 */

import axios from '~axios';

//url地址
const urls = {
  a: '/ifengniao/cloud/server/xiyou/locationobject/page',
  b: '/ifengniao/cloud/server/xiyou/locationobject/bingMap',
  c: '/ifengniao/cloud/server/xiyou/locationobject/edit',
  d: '/ifengniao/cloud/server/xiyou/locationobject/delete',
  e: '/ifengniao/cloud/server/xiyou/locationobject/byBeaconId',
  f: '/ifengniao/cloud/server/xiyou/locationobject/available'
};

// 分页获取
const objectManageGetTable = (params) => axios.get(urls.a, params);

// 绑定地图
const objectManageBindMap = (params) => axios.post(urls.b, params);

// 新增/编辑对象
const objectManageAddEdit = (params) => axios.post(urls.c, params);

// 删除对象
const objectManageDelete = (params) => axios.deletes(urls.d, params);

// 按分类查找定位对象信息
const objectManageGetListByType = (params) => axios.get(urls.e, params);

// 查找全部可用对象
const objectManageGetAllAvailable = (params) => axios.get(urls.f, params);

export default {
  objectManageGetTable,
  objectManageBindMap,
  objectManageAddEdit,
  objectManageDelete,
  objectManageGetListByType,
  objectManageGetAllAvailable
};
