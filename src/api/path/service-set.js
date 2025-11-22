/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-12 17:33:03
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-17 14:21:38
 * @Description: 服务管理
 */

import axios from '~axios';

//url地址
const urls = {
  a: '/ifengniao/cloud/server/xiyou/localserver/page',
  b: '/ifengniao/cloud/server/xiyou/localserver/edit',
  c: '/ifengniao/cloud/server/xiyou/localserver/uploadLicense',
  e: '/ifengniao/cloud/server/xiyou/localserver/uploadLicenseResult'
};

// 获取本地服务数据
const serviceSetGetTableData = (params) => axios.get(urls.a, params);

// 编辑服务
const serviceSetEditItem = (params) => axios.post(urls.b, params);

// 上传授权文件
const serviceSetUploadAuthorizedFile = (params) => axios.post(urls.c, params);

// 轮询上传文件生效状态
const serviceSetGetUploadAuthorizedFileStatus = (params) => axios.get(urls.e, params);

export default {
  serviceSetGetTableData,
  serviceSetEditItem,
  serviceSetUploadAuthorizedFile,
  serviceSetGetUploadAuthorizedFileStatus
};
