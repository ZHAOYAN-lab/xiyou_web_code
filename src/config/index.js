/*
 * @Author: shenlan
 * @Description:配置文件
 */

// console.log(process.env);
import languageConfig from '@/language/config';
const ENV = process.env;

export default {
  //项目名称(用于缓存数据设置 key)
  projectName: 'FN_indoor_location', // 名称前缀 建议：项目名 + 项目版本

  // 配置显示在浏览器标签的title
  title: 'indoor-location',
  language: languageConfig.key.ja,

  //Cookie中存储的天数
  cookieExpires: 7,

  //首页
  homeName: 'home',

  // 登陆页
  loginPage: 'login',

  // 无权限跳转页面
  permissionDeniedRedirectPage: 'login',

  //当前是否是开发环境
  isDevelopment: process.env.NODE_ENV === 'development',

  //api请求基础路径
  baseUrl: ENV.VUE_APP_BASE_URL
};
