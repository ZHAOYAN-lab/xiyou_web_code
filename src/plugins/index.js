/*
 * @Author: shenlan
 * @Description: 自动引入相关组件
 */

const requirePlugin = require.context(
  // 当前plugins目录
  './modules/',
  // 是否查询其子目录
  false,
  // 匹配当前plugins目录下的js文件
  /.+\.js$/
);
requirePlugin.keys().forEach((fileName) => {
  requirePlugin(fileName);
});
