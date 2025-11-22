/*
 * @Author: shenlan
 * @Description: 本地模拟数据
 * @文档    http://mockjs.com/examples.html
 * @github https://github.com/nuysoft/Mock/wiki/Getting-Started
 */
import Mock from 'mockjs';

const mockFiles = require.context('./modules', false, /.+\.js$/);
let mocks = [];

mockFiles.keys().forEach((key) => {
  console.log(mockFiles(key));

  mocks.push(...mockFiles(key));
});

mocks.forEach((item) => {
  Mock.mock(item.url, item.type, item.response);
});

//模拟接口返回时间
Mock.setup({
  timeout: 1000
});

export default Mock;
