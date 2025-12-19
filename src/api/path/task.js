/*
 * @Author: shenlan
 * @Description: 任务管理接口（统一恢复为老版可用写法）
 */
import { get, post } from '@/api/http/axios';

const baseUrl = '/ifengniao/cloud/server/xiyou/task';

/* ================= 管理端 ================= */

/* 查询任务列表 */
export function taskGetList(params) {
  return get(`${baseUrl}/list`, { params });
}

/* 新增任务 */
export function taskAdd(data) {
  return post(`${baseUrl}/add`, {
    url: `${baseUrl}/add`,
    data
  });
}

/* 派发任务 */
export function taskDispatch({ taskId, employees }) {
  const employeesStr = Array.isArray(employees)
    ? employees.join(',')
    : employees;

  return post(`${baseUrl}/dispatch`, {
    url: `${baseUrl}/dispatch?taskId=${taskId}&employees=${employeesStr}`,
    data: {}
  });
}

/* 取消任务（✅ 关键修复点） */
export function taskCancel({ taskId }) {
  return post(`${baseUrl}/cancel`, {
    url: `${baseUrl}/cancel?taskId=${taskId}`,
    data: {}
  });
}

/* 删除任务 */
export function taskDelete({ id }) {
  return post(`${baseUrl}/delete`, {
    url: `${baseUrl}/delete?id=${id}`,
    data: {}
  });
}

/* ================= H5 worker ================= */

/* 我的任务 */
export function taskMy() {
  return get(`${baseUrl}/my`);
}

/* 开始执行：已派发 → 执行中 */
export function taskStart({ taskId }) {
  return post(`${baseUrl}/start`, {
    url: `${baseUrl}/start?taskId=${taskId}`,
    data: {}
  });
}

/* 已到达：执行中 → 已完成 */
export function taskArrived({ taskId }) {
  return post(`${baseUrl}/arrived`, {
    url: `${baseUrl}/arrived?taskId=${taskId}`,
    data: {}
  });
}

export default {
  taskGetList,
  taskAdd,
  taskDispatch,
  taskCancel,
  taskDelete,
  taskMy,
  taskStart,
  taskArrived
};
