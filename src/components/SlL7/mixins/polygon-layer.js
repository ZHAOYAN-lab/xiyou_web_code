/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-07 11:40:36
 * @LastEditors: shenlan
 * @LastEditTime: 2023-08-21 12:00:23
 * @Description: 围栏
 */
import {
  PolygonLayer,
  l7Scale,
  l7ConvertCMtoL,
  l7ConvertLtoCM,
  l7ConvertDataToWeb,
  l7ConvertWebToData
} from './l7';
import { DrawPolygon } from '@antv/l7-draw';
export default {
  data() {
    return {
      polygonLayer: {
        source: [],
        layer: [],
        hasLayer: false //是否画到页面数据
      }
    };
  },
  computed: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {
    // 画围栏
    polygonLayerSetData(params) {
      let polygonLayer = this.polygonLayer;

      polygonLayer.source = [];
      polygonLayer.layer = [];

      params.forEach((fence) => {
        const source = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                c: fence.type === 1 ? '#95de64' : '#ffd666'
              },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  fence.points.map((item) => {
                    return l7ConvertCMtoL(
                      l7ConvertDataToWeb({
                        mapMetersPerPixel: this.mapMetersPerPixel,
                        mapOriginPixelX: this.mapOriginPixelX,
                        mapOriginPixelY: this.mapOriginPixelY,
                        x: item.x,
                        y: item.y
                      }),
                      this.l7MapWidth
                    );
                  })
                ]
              }
            }
          ]
        };

        polygonLayer.source.push(source);

        this.handlePolygonLayer(source);
      });
    },
    // 画围栏
    handlePolygonLayer(source) {
      let polygonLayerData = new PolygonLayer({
        zIndex: 4,
        active: true,
        activeColor: 'red'
      })
        .source(source)
        .shape('fill')
        .color('c')
        .style({ opacity: 0.6 });

      let polygonLayer = this.polygonLayer;

      polygonLayer.layer.push(polygonLayerData);

      if (this.switchWeilan) {
        this.scene.addLayer(polygonLayerData);
        polygonLayer.hasLayer = true;
      }
    },

    // 自定义围栏
    polygonLayerSetEdit(params) {
      let l7MapWidth = this.l7MapWidth;

      let backData = params.reduce((arr, fence) => {
        arr.push({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              fence.points.map((item) => {
                return l7ConvertCMtoL(
                  [
                    ...l7ConvertDataToWeb({
                      mapMetersPerPixel: this.mapMetersPerPixel,
                      mapOriginPixelX: this.mapOriginPixelX,
                      mapOriginPixelY: this.mapOriginPixelY,
                      x: item.x,
                      y: item.y
                    })
                  ],
                  l7MapWidth
                );
              })
            ]
          }
        });
        return arr;
      }, []);

      const drawer = new DrawPolygon(this.scene, {
        initialData: backData,
        liveUpdate: true,
        distanceOptions: {
          showTotalDistance: false,
          showDashDistance: true,
          format: (meters) => {
            if (meters >= 1000) {
              return +(meters / l7Scale / 1000).toFixed(2) + 'km';
            } else {
              return +(meters / l7Scale).toFixed(2) + 'm';
            }
          }
        },
        helper: {
          draw: this.$t('base.plugin.l7.tip1'),
          drawContinue: this.$t('base.plugin.l7.tip2'),
          drawFinish: this.$t('base.plugin.l7.tip3'),
          pointHover: this.$t('base.plugin.l7.tip4'),
          lineHover: this.$t('base.plugin.l7.tip5'),
          polygonHover: this.$t('base.plugin.l7.tip5'),
          midPointHover: this.$t('base.plugin.l7.tip6')
        }
      });

      drawer.enable();
      this.scene.drawer = drawer;
    },

    // 获取画的围栏数据
    polygonLayerGetData() {
      let l7MapWidth = this.l7MapWidth;
      let getPolygonData = this.scene.drawer.getPolygonData();

      let mapMetersPerPixel = this.mapMetersPerPixel;
      let mapOriginPixelX = this.mapOriginPixelX;
      let mapOriginPixelY = this.mapOriginPixelY;

      let points = getPolygonData.map((item) => {
        const coordinate = item.geometry.coordinates?.[0];
        return coordinate.map((v) => {
          const [lng, lat] = v ?? [];

          const [x, y] = l7ConvertLtoCM([lng, lat], l7MapWidth);

          const arr = l7ConvertWebToData({
            mapMetersPerPixel,
            mapOriginPixelX,
            mapOriginPixelY,
            x,
            y
          });
          return { x: arr[0], y: arr[1] };
        });
      });

      return points;
    },

    // 隐藏/显示 围栏
    polygonLayerToggle(value) {
      let polygonLayer = this.polygonLayer;
      if (value) {
        this.$nextTick(() => {
          polygonLayer.source.forEach((item) => {
            this.handlePolygonLayer(item);
          });
        });
      } else {
        if (polygonLayer.hasLayer) {
          polygonLayer.layer.forEach((item) => {
            this.scene.removeLayer(item);
          });

          polygonLayer.layer = [];
          polygonLayer.hasLayer = false;
        }
      }
    }
  }
};
