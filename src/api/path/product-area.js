/*
 * @Author: shenlan
 * @Description: 商品区域 API
 */
import { get, post } from '@/api/http/axios'

// ★★★ 必改：获取区域列表（必须使用 params 才会发 GET 请求）
export function getProductAreaList() {
  console.log("=== 调用 getProductAreaList API ===");

  return get('/ifengniao/cloud/server/xiyou/productArea/list', {
    params: { _: Date.now() }  // 防止缓存，确保请求必发
  });
}

// 新增区域
export function addProductArea(data) {
  return post('/ifengniao/cloud/server/xiyou/productArea/add', {
    data: {
      objectName: data.objectName,
      belongType: data.belongType,
      iconUrl: data.iconUrl,
      mapIds: Array.isArray(data.mapIds) ? data.mapIds.join(',') : data.mapIds,
      areaContent: data.areaContent || null
    }
  });
}

// 更新区域
export function updateProductArea(data) {
  return post('/ifengniao/cloud/server/xiyou/productArea/update', {
    data: {
      areaId: data.areaId,
      objectName: data.objectName,
      belongType: data.belongType,
      iconUrl: data.iconUrl,
      mapIds: Array.isArray(data.mapIds) ? data.mapIds.join(',') : data.mapIds,
      areaContent: data.areaContent || null
    }
  });
}

// 删除区域
export function deleteProductArea(params) {
  return post('/ifengniao/cloud/server/xiyou/productArea/delete', {
    data: {
      areaId: params.areaId
    }
  });
}

// 区域类型
export function getProductAreaTypes() {
  return get('/ifengniao/cloud/server/xiyou/productArea/types', {
    params: { _: Date.now() }
  });
}

// ★★★ 关键补充：默认导出，TaskManage.vue 才能正常 import ★★★
export default {
  getProductAreaList,
  addProductArea,
  updateProductArea,
  deleteProductArea,
  getProductAreaTypes
};
