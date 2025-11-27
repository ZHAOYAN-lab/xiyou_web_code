import { get, post } from '@/api/http/axios'

// 查询区域列表
export function getProductAreaList(data) {
  return get('/ifengniao/cloud/server/xiyou/productArea/list', { data })
}

// 新增区域
export function addProductArea(data) {
  return post('/ifengniao/cloud/server/xiyou/productArea/add', {
    data: {
      objectName: data.objectName,
      belongType: data.belongType,
      iconUrl: data.iconUrl,
      mapIds: Array.isArray(data.mapIds) ? data.mapIds.join(',') : data.mapIds
    }
  })
}

// 更新区域
export function updateProductArea(data) {
  return post('/ifengniao/cloud/server/xiyou/productArea/update', {
    data: {
      areaId: data.areaId,
      objectName: data.objectName,
      belongType: data.belongType,
      iconUrl: data.iconUrl,
      mapIds: Array.isArray(data.mapIds) ? data.mapIds.join(',') : data.mapIds
    }
  })
}

// 删除区域
export function deleteProductArea(areaId) {
  return request({
    url: '/ifengniao/cloud/server/xiyou/productArea/delete',
    method: 'post',
    data: { areaId }
  })
}


// 获取所属类型列表
export function getProductAreaTypes() {
  return get('/ifengniao/cloud/server/xiyou/productArea/types')
}
