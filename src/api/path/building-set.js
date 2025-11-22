/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-12 17:33:03
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-17 14:37:20
 * @Description: 地图-建筑管理
 */

import axios from '~axios';

//url地址
const urls = {
  a: '/ifengniao/cloud/server/xiyou/building/page',
  b: '/ifengniao/cloud/server/xiyou/building/edit',
  c: '/ifengniao/cloud/server/xiyou/building/delete'
};

// 获取建筑数据
const buildingSetGetTableData = (params) => axios.get(urls.a, params);

// 新增/编辑
const buildingSetAddEdit = (params) => axios.post(urls.b, params);

// 删除
const buildingSetDelete = (params) => axios.deletes(urls.c, params);

export default { buildingSetGetTableData, buildingSetAddEdit, buildingSetDelete };
