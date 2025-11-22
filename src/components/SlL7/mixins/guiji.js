/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-07 11:40:06
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-25 14:04:02
 * @Description:  轨迹
 */

import { PointLayer, l7ConvertCMtoL, LineLayer, l7ConvertDataToWeb } from './l7';

// import l7IconStation from '@/assets/images/l7/number.svg';
// import l7IconCar from '@/assets/images/l7/car.png';

export default {
  data() {
    return {
      guiji: {
        pointLayer: [],
        lineLayer: []
      }
    };
  },
  computed: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {
    // 轨迹点
    guijiSetData(params) {
      let data = params;
      let colors = this.guijiColors(Object.keys(data).length);
      let index = 0;

      for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          const ele = data[key];

          const color = colors[index];

          this.guijiSetPoint(ele, color);
          this.guijiSetLine(ele, color);

          index += 1;
        }
      }
    },

    // 轨迹点
    guijiSetPoint(data, color) {
      let scene = this.scene;
      // 点轨迹
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
        .color('mag', () => {
          return color;
        });
      scene.addLayer(pointLayer);
      this.guiji.pointLayer.push(pointLayer);
    },
    // 轨迹线
    guijiSetLine(data, color) {
      let scene = this.scene;
      // 线轨迹
      let lineSource = [];
      for (let index = 0; index < data.length; index++) {
        const start = data[index];
        const end = data[index + 1];

        if (end) {
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
      }

      const lineLayer = new LineLayer({ zIndex: 3 })
        .source(lineSource, {
          parser: { type: 'json', x: 'lng', y: 'lat', x1: 'lng1', y1: 'lat1' }
        })
        .shape('line')
        .size(2)
        // .texture('arrow')
        .color(color)
        .animate({
          interval: 0.4, // 间隔
          duration: 1, // 持续时间，延时
          trailLength: 0.8 // 流线长度
        })
        .style({
          lineTexture: true, // 开启线的贴图功能
          iconStep: 20 // 设置贴图纹理的间距
        });

      scene.addLayer(lineLayer);

      this.guiji.lineLayer.push(lineLayer);
    },

    // 清除 轨迹点
    guijiClear() {
      let scene = this.scene;
      let guiji = this.guiji;
      if (guiji.pointLayer.length) {
        guiji.pointLayer.forEach((ele) => {
          scene.removeLayer(ele);
        });
        guiji.lineLayer.forEach((ele) => {
          scene.removeLayer(ele);
        });

        guiji.pointLayer = [];
        guiji.lineLayer = [];
      }
    },

    guijiColors(desiredColorCount) {
      let colors = [];

      // 轨迹随机颜色
      function randomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

      function isAdjacent(color1, color2) {
        var r1 = parseInt(color1.substr(1, 2), 16);
        var g1 = parseInt(color1.substr(3, 2), 16);
        var b1 = parseInt(color1.substr(5, 2), 16);
        var r2 = parseInt(color2.substr(1, 2), 16);
        var g2 = parseInt(color2.substr(3, 2), 16);
        var b2 = parseInt(color2.substr(5, 2), 16);
        var distance = Math.sqrt(
          Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
        );
        return distance < 128;
      }

      while (colors.length < desiredColorCount) {
        var newColor = randomColor();
        var isAdjacentToExistingColor = false;
        for (var i = 0; i < colors.length; i++) {
          if (isAdjacent(newColor, colors[i])) {
            isAdjacentToExistingColor = true;
            break;
          }
        }
        if (!isAdjacentToExistingColor && colors.indexOf(newColor) === -1) {
          colors.push(newColor);
        }
      }

      return colors;
    }
  }
};
