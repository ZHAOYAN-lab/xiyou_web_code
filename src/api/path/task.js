/*
 * @Author: shenlan
 * @Description: 任务管理接口（统一封装版）
 */
import { get, post } from '@/api/http/axios';

const baseUrl = '/ifengniao/cloud/server/xiyou/task';

export function taskGetList(params) {
  return get(`${baseUrl}/list`, {
    params: params
  });
}

export function taskAdd(data) {
  return post(`${baseUrl}/add`, {
    data: data
  });
}

// ★★★ 派发任务必须用 URL 参数，不支持 JSON Body ★★★
export function taskDispatch(data) {
  const employeesStr = Array.isArray(data.employees)
    ? data.employees.join(',')
    : data.employees;

  return post(`${baseUrl}/dispatch`, {
    url: `${baseUrl}/dispatch?taskId=${data.taskId}&employees=${employeesStr}`,
    data: {}
  });
}

export function taskCancel(data) {
  return post(`${baseUrl}/cancel`, {
    url: `${baseUrl}/cancel?taskId=${data.taskId}`,
    data: {}
  });
}

export function taskDelete(data) {
  return post(`${baseUrl}/delete`, {
    url: `${baseUrl}/delete?id=${data.id}`,
    data: {}
  });
}

/* ★★★★★ 新增：手机端自动获取我的任务 ★★★★★ */
export function taskGetMyTask(param) {
  return get(`${baseUrl}/mobile/current`, param);
}

export default {
  taskGetList,
  taskAdd,
  taskDispatch,
  taskCancel,
  taskDelete,
  taskGetMyTask
};
