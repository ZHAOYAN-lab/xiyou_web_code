/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-12 13:52:57
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-18 10:35:17
 * @Description: 公共数据接口
 */

import axios from '~axios';

//url地址
const urls = {
  config: '/ifengniao/cloud/server/xiyou/config/find', //获取各个配置项
  map: '/ifengniao/cloud/server/xiyou/map/tree', // 获取地图数据
  mapDetail: '/ifengniao/cloud/server/xiyou/map/id' //获取地图上详细数据
};

// 获取配置项
const pubGetConfig = (params) => axios.get(urls.config, params);

// 全部地图树状结构
const pubGetMapData = (params) => axios.get(urls.map, params);

// 获取地图内详细数据
const pubGetMapDetailByMapId = (params) => axios.get(urls.mapDetail, params);

export default { pubGetConfig, pubGetMapData, pubGetMapDetailByMapId };
