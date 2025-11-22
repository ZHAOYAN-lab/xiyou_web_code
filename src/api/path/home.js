/*
 * @Author: shenlan
 * @Description: 登录
 */
import axios from '~axios';

//url地址
const urls = {
  a: '/ifengniao/cloud/server/xiyou/overview/locationObjectAndDeviceGroup',
  b: '/ifengniao/cloud/server/xiyou/overview/alarmGroup'
};

//定位对象相关图表：定位概览（人员-物品-设备-车辆）-在线对象分布-基站状态-信标状态
const homeGetLocationObjectAndDeviceGroup = (params) => axios.get(urls.a, params);

//今日警告-今日告警类别占比-24小时告警变化
const homeGetAlarmGroup = (params) => axios.get(urls.b, params);

export default { homeGetLocationObjectAndDeviceGroup, homeGetAlarmGroup };
