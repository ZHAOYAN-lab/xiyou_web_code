/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-06-29 11:48:43
 * @LastEditors: shenlan
 * @LastEditTime: 2023-08-23 11:30:41
 * @Description: 信标管理
 */

import axios from '~axios';
import config from '@/config';

import { slDownloadFile } from '@/lib/js/pub';
import { catchLanguage } from '@/lib/js/cache';

//url地址
const urls = {
  list: '/ifengniao/cloud/server/xiyou/beacon/page',
  delete: '/ifengniao/cloud/server/xiyou/beacon/delete',
  add: '/ifengniao/cloud/server/xiyou/beacon/edit',
  piliang: '/ifengniao/cloud/server/xiyou/beacon/batch',
  example: {
    zh_CN: '/upload/example_zh.csv',
    ja_JP: '/upload/example_jp.csv'
  },
  bindObj: '/ifengniao/cloud/server/xiyou/beacon/bind',
  luru: '/ifengniao/cloud/server/xiyou/beacon/allow',
  allType: '/ifengniao/cloud/server/xiyou/beacon/allProduct' //获取所有信标类型
};

//API 请求
const beaconManageGetTable = (params) => axios.get(urls.list, params);

// 删除信标
const beaconManageDeleteBeacon = (params) => axios.deletes(urls.delete, params);

// 新增/编辑 单个 信标
const beaconManageAddBeacon = (params) => axios.post(urls.add, params);

// 批量录入
const beaconManageBatchAddBeacon = (params) => axios.post(urls.piliang, params);

// 下载示例文件
const beaconManageDownloadExampleFile = () => {
  console.log(`${config.baseUrl}${urls.example[catchLanguage.get()]}`);
  const language = catchLanguage.get();
  slDownloadFile(
    `${config.baseUrl}${urls.example[language]}`,
    {
      zh_CN: 'example_zh.csv',
      ja_JP: 'example_jp.csv'
    }[language]
  );
};

// 绑定对象
const beaconManageBindObject = (params) => axios.post(urls.bindObj, params);

// 录入
const beaconManageLuRu = (params) => axios.post(urls.luru, params);

// 获取所有信标类型
const beaconManageGetAllBeaconType = (params) => axios.get(urls.allType, params);

export default {
  beaconManageGetTable,
  beaconManageDeleteBeacon,
  beaconManageAddBeacon,
  beaconManageBatchAddBeacon,
  beaconManageDownloadExampleFile,
  beaconManageBindObject,
  beaconManageLuRu,
  beaconManageGetAllBeaconType
};
