/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-06-29 11:48:43
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-24 09:44:19
 * @Description: 围栏管理
 */

import axios from '~axios';

//url地址
const urls = {
  a: '/ifengniao/cloud/server/xiyou/fence/page',
  b: '/ifengniao/cloud/server/xiyou/fence/edit',
  c: '/ifengniao/cloud/server/xiyou/fence/changeStatus',
  d: '/ifengniao/cloud/server/xiyou/fence/delete',
  e: '/ifengniao/cloud/server/xiyou/fence/byMap'
};

// 获取围栏列表
const fenceManageGetTable = (params) => axios.get(urls.a, params);

// 添加/编辑 围栏
const fenceManageAddEdit = (params) => axios.post(urls.b, params);

// 启用/禁用
const fenceManageSetStatus = (params) => axios.post(urls.c, params);

// 删除围栏
const fenceManageDelete = (params) => axios.deletes(urls.d, params);

//按照地图ID查找围栏
const fenceManageGetDataByMapId = (params) => axios.get(urls.e, params);

export default {
  fenceManageGetTable,
  fenceManageAddEdit,
  fenceManageDelete,
  fenceManageSetStatus,
  fenceManageGetDataByMapId
};
