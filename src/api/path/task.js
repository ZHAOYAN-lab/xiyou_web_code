/*
 * @Author: shenlan
 * @Description: 任务管理接口 (手动拼接 URL 版 - 专治参数丢失)
 */
import axios from '~axios';

const baseUrl = '/ifengniao/cloud/server/xiyou/task';

const urls = {
  list: `${baseUrl}/list`,
  add: `${baseUrl}/add`,
  dispatch: `${baseUrl}/dispatch`,
  cancel: `${baseUrl}/cancel`,
  delete: `${baseUrl}/delete`
};

// 辅助函数：把对象转成 URL 查询字符串 (例如: {a:1, b:2} => "?a=1&b=2")
const toQuery = (obj) => {
  if (!obj) return '';
  const parts = [];
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
};

// 1. 获取任务列表 (GET请求通常没问题)
const taskGetList = (params) => axios.get(urls.list, params);

// 2. 新增任务 (POST) - 手动拼接 URL
const taskAdd = (data) => {
  const queryString = toQuery(data);
  return axios.post(`${urls.add}${queryString}`);
};

// 3. 派发任务 (POST) - 手动拼接 URL
const taskDispatch = (data) => {
  const params = {
    taskId: data.taskId,
    employees: Array.isArray(data.employees) ? data.employees.join(',') : data.employees
  };
  const queryString = toQuery(params);
  return axios.post(`${urls.dispatch}${queryString}`);
};

// 4. 取消派发 (POST) - 手动拼接 URL
const taskCancel = (data) => {
  const params = { taskId: data.taskId || data.id };
  const queryString = toQuery(params);
  return axios.post(`${urls.cancel}${queryString}`);
};

// 5. 删除任务 (POST) - 手动拼接 URL
const taskDelete = (data) => {
  const params = { id: data.id };
  const queryString = toQuery(params);
  return axios.post(`${urls.delete}${queryString}`);
};

export default {
  taskGetList,
  taskAdd,
  taskDispatch,
  taskCancel,
  taskDelete
};