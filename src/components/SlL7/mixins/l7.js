import {
  ImageLayer,
  Mapbox,
  metersToLngLat,
  Scene,
  Popup,
  PointLayer,
  LineLayer,
  PolygonLayer,
  lngLatToMeters
} from '@antv/l7';

export const l7Scale = 10;

export const l7DataScale = 0.0036;

// 后端软件点位数据转换成前端坐标系点位数据
export const l7ConvertDataToWeb = (params) => {
  const { mapMetersPerPixel, mapOriginPixelX, mapOriginPixelY, x, y } = params;

  let xValue = (Number(x) / Number(mapMetersPerPixel) - Number(mapOriginPixelX)) * l7DataScale;
  let yValue = -1 * (Number(y) / Number(mapMetersPerPixel) - Number(mapOriginPixelY)) * l7DataScale;

  return [xValue, yValue];
};

/**
 * 厘米转经纬度，这里是虚构的CM，对应的是M
 * @export
 * @param {Point} m
 * @param {number} [width=0]
 * @return {*}
 */
export const l7ConvertCMtoL = (m, width = 0) => {
  const [x, prevY] = m;
  const y = width - prevY;

  return metersToLngLat([x * l7Scale, y * l7Scale]);
};

//前端坐标系点位数据转换成 后端软件点位数据
export const l7ConvertWebToData = (params) => {
  const { mapMetersPerPixel, mapOriginPixelX, mapOriginPixelY, x, y } = params;

  let xValue = (Number(x) / l7DataScale + Number(mapOriginPixelX)) * Number(mapMetersPerPixel);
  let yValue =
    ((Number(y) / l7DataScale) * -1 + Number(mapOriginPixelY)) * Number(mapMetersPerPixel);

  return [xValue, yValue];
};

//经纬度转厘米
export const l7ConvertLtoCM = (l, width = 0) => {
  const [x, y] = lngLatToMeters(l);
  return [x / l7Scale, width - y / l7Scale];
};

// 计算地图尺寸
export const l7HandleImageMaxRange = (width, height) => {
  // 原参考图片 width  1654 -> l7MapLength * l7Scale = 64
  // 原参考图片 height 1078 -> l7MapWidth * l7Scale = 42
  //  同比例 /275 *10

  // 测试图片   width  2048 ->  2048/275*10
  // 测试图片   height 950  ->  950/275 *10

  let w = ((+width / 275) * 10).toFixed(1);
  let h = ((+height / 275) * 10).toFixed(1);

  let l7MapWidth = (+height / 275).toFixed(1);

  return {
    l7MapWidth: l7MapWidth,
    maxRange: metersToLngLat([w, h])
  };
};

export { ImageLayer, Mapbox, metersToLngLat, Scene, Popup, PointLayer, LineLayer, PolygonLayer };
