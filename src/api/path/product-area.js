/*
 * 商品区域 API
 */
import { get, post } from '@/api/http/axios';

// 查询区域列表
export function getProductAreaList() {
  return get(
    `/ifengniao/cloud/server/xiyou/productArea/list?_=${Date.now()}`
  );
}

// ✅ 根据 areaId 查询区域详情（H5 用，关键接口）
export function getProductAreaById(areaId) {
  // ★★★ 直接拼在 URL 上，绕开 get() 封装问题 ★★★
  return get(
    `/ifengniao/cloud/server/xiyou/productArea/getById?areaId=${areaId}`
  );
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
  return get(
    `/ifengniao/cloud/server/xiyou/productArea/types?_=${Date.now()}`
  );
}

// 默认导出（H5 import 用）
export default {
  getProductAreaList,
  getProductAreaById,
  addProductArea,
  updateProductArea,
  deleteProductArea,
  getProductAreaTypes
};
