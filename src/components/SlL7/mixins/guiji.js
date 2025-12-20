/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @LastEditors: shenlan（修复版：增强数据容错 + 强制渲染）
 * @Description: 轨迹 + 导航路线渲染
 */

import {
  PointLayer,
  l7ConvertCMtoL,
  LineLayer,
  l7ConvertDataToWeb
} from './l7';

export default {
  data() {
    return {
      // 普通轨迹
      guiji: {
        pointLayer: [],
        lineLayer: []
      },

      // 导航路线图层（示例：key 可以是 'route'、'xxx'）
      navLayers: {}
    };
  },

  methods: {
    /* ============================================================
     * 轨迹（保留原逻辑）
     * ============================================================ */
    guijiSetData(params) {
      let data = params;
      let colors = this.guijiColors(Object.keys(data).length);
      let index = 0;

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const ele = data[key];
          const color = colors[index];

          this.guijiSetPoint(ele, color);
          this.guijiSetLine(ele, color);

          index += 1;
        }
      }
    },

    /* ============================================================
     * 普通轨迹点
     * ============================================================ */
    guijiSetPoint(data, color) {
      let scene = this.scene;
      let guiji = this.guiji;

      let pointSource = data.reduce((arr, item) => {
        const [lng, lat] = l7ConvertCMtoL(
          l7ConvertDataToWeb({
            mapMetersPerPixel: this.mapMetersPerPixel,
            mapOriginPixelX: this.mapOriginPixelX,
            mapOriginPixelY: this.mapOriginPixelY,
            x: item.x,
            y: item.y
          }),
          this.l7MapWidth
        );

        arr.push({ ...item, lng, lat });
        return arr;
      }, []);

      const pointLayer = new PointLayer({ zIndex: 3 })
        .source(pointSource, {
          parser: { type: 'json', x: 'lng', y: 'lat' }
        })
        .shape('circle')
        .size(5)
        .color('mag', () => color);

      scene.addLayer(pointLayer);
      guiji.pointLayer.push(pointLayer);
    },

    /* ============================================================
     * 普通轨迹线
     * ============================================================ */
    guijiSetLine(data, color) {
      let scene = this.scene;
      let guiji = this.guiji;
      let lineSource = [];

      for (let index = 0; index < data.length - 1; index++) {
        const start = data[index];
        const end = data[index + 1];

        const [lng, lat] = l7ConvertCMtoL(
          l7ConvertDataToWeb({
            mapMetersPerPixel: this.mapMetersPerPixel,
            mapOriginPixelX: this.mapOriginPixelX,
            mapOriginPixelY: this.mapOriginPixelY,
            x: start.x,
            y: start.y
          }),
          this.l7MapWidth
        );

        const [lng1, lat1] = l7ConvertCMtoL(
          l7ConvertDataToWeb({
            mapMetersPerPixel: this.mapMetersPerPixel,
            mapOriginPixelX: this.mapOriginPixelX,
            mapOriginPixelY: this.mapOriginPixelY,
            x: end.x,
            y: end.y
          }),
          this.l7MapWidth
        );

        lineSource.push({ ...start, lng, lat, lng1, lat1 });
      }

      const lineLayer = new LineLayer({ zIndex: 3 })
        .source(lineSource, {
          parser: {
            type: 'json',
            x: 'lng',
            y: 'lat',
            x1: 'lng1',
            y1: 'lat1'
          }
        })
        .shape('line')
        .size(2)
        .color(color)
        .animate({
          interval: 0.4,
          duration: 1,
          trailLength: 0.8
        })
        .style({
          lineTexture: true,
          iconStep: 20
        });

      scene.addLayer(lineLayer);
      guiji.lineLayer.push(lineLayer);
    },

    /* ============================================================
     * 清除全部轨迹 + 全部导航线
     * ============================================================ */
    guijiClear() {
      let scene = this.scene;
      let guiji = this.guiji;

      // 普通轨迹
      if (guiji.pointLayer.length) {
        guiji.pointLayer.forEach((ele) => {
          scene.removeLayer(ele);
        });
        guiji.pointLayer = [];
      }

      if (guiji.lineLayer.length) {
        guiji.lineLayer.forEach((ele) => {
          scene.removeLayer(ele);
        });
        guiji.lineLayer = [];
      }

      // 导航路线
      if (this.navLayers) {
        Object.keys(this.navLayers).forEach((key) => {
          try {
            if (this.navLayers[key]) {
              scene.removeLayer(this.navLayers[key]);
            }
          } catch (e) {}
        });
        this.navLayers = {};
      }
    },

    /* ============================================================
     * 随机颜色
     * ============================================================ */
    guijiColors(count) {
      let colors = [];

      function randomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

      while (colors.length < count) {
        const c = randomColor();
        if (!colors.includes(c)) colors.push(c);
      }

      return colors;
    },

    /* ============================================================
     * ★★★ 导航线绘制（修复版）
     * data: [[x,y], ...] 必须是米坐标的数组
     * key: 比如 'route'
     * ============================================================ */
    guijiLineShow({ key, color, size, data }) {
      if (!this.scene) return;
      if (!Array.isArray(data) || data.length < 2) {
        console.warn('[guijiLineShow] 数据无效', data);
        return;
      }

      const scene = this.scene;
      const lineSource = [];

      // 生成连续的 lineSource
      for (let i = 0; i < data.length - 1; i++) {
        // ★ 增强容错：data[i] 可能是数组 [x,y] 也可能是对象 {x,y}
        let startRaw = data[i];
        let endRaw = data[i + 1];

        // 统一转为数组 [x, y]
        const [x, y] = Array.isArray(startRaw) ? startRaw : [startRaw.x, startRaw.y];
        const [x1, y1] = Array.isArray(endRaw) ? endRaw : [endRaw.x, endRaw.y];

        if (x == null || y == null || x1 == null || y1 == null) continue;

        // 坐标转换：米 -> Pixel -> L7 LngLat
        const [lng, lat] = l7ConvertCMtoL(
          l7ConvertDataToWeb({
            mapMetersPerPixel: this.mapMetersPerPixel,
            mapOriginPixelX: this.mapOriginPixelX,
            mapOriginPixelY: this.mapOriginPixelY,
            x,
            y
          }),
          this.l7MapWidth
        );

        const [lng1, lat1] = l7ConvertCMtoL(
          l7ConvertDataToWeb({
            mapMetersPerPixel: this.mapMetersPerPixel,
            mapOriginPixelX: this.mapOriginPixelX,
            mapOriginPixelY: this.mapOriginPixelY,
            x: x1,
            y: y1
          }),
          this.l7MapWidth
        );

        lineSource.push({ lng, lat, lng1, lat1 });
      }

      // 删除旧图层
      if (this.navLayers[key]) {
        try {
          scene.removeLayer(this.navLayers[key]);
        } catch (e) {}
      }

      // ★ zIndex: 20 确保显示在最上层
      const layer = new LineLayer({ zIndex: 20 })
        .source(lineSource, {
          parser: {
            type: 'json',
            x: 'lng',
            y: 'lat',
            x1: 'lng1',
            y1: 'lat1'
          }
        })
        .shape('line')
        .size(size || 3)
        .color(color || '#1E90FF')
        .style({
          lineType: 'solid',
          opacity: 1
        });

      scene.addLayer(layer);
      this.navLayers[key] = layer;
      
      // ★ 强制渲染，防止不更新
      scene.render();
    }
  }
};