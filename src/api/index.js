/*
 * @Author: shenlan
 * @Description: 导出全部接口
 *  * 注意：定义接口的时候最好加上当前文件的前缀防止方法被覆盖
 */

const requirePlugin = require.context(
  // 当前plugins目录
  './path/',
  // 是否查询其子目录
  false,
  // 匹配当前plugins目录下的js文件
  /.+\.js$/
);

let api = {};

requirePlugin.keys().forEach((key) => {
  api = { ...api, ...requirePlugin(key).default };
});

export default api;
