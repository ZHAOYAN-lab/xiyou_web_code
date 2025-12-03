/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-07 11:40:36
 * @LastEditors: shenlan（修复商品区域 / 围栏新增、编辑、回显兼容问题 + 导航点击支持）
 * @LastEditTime: 2025-12-02
 * @Description: 围栏 & 商品区域编辑层（稳定版 + 导航点击事件）
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
        hasLayer: false
      }
    };
  },

  methods: {

    /***************************************
     * 一：静态显示（仅展示，不可编辑）
     ***************************************/
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

    /***************************************
     * 新增：polygon 点击事件支持导航
     ***************************************/
    bindPolygonClick(layer, source) {
      layer.on('click', (e) => {
        if (!this.$parent || !this.$parent.onPolygonSelected) return;

        const rawPoints = source.features[0].geometry.coordinates[0];

        const cmPoints = rawPoints.map((p) => {
          const [x, y] = l7ConvertLtoCM(p, this.l7MapWidth);
          return l7ConvertWebToData({
            mapMetersPerPixel: this.mapMetersPerPixel,
            mapOriginPixelX: this.mapOriginPixelX,
            mapOriginPixelY: this.mapOriginPixelY,
            x,
            y
          });
        });

        e.feature.points = cmPoints;
        this.$parent.onPolygonSelected(e.feature);
      });
    },

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

      // 绑定导航点击事件（新增）
      this.bindPolygonClick(polygonLayerData, source);

      let polygonLayer = this.polygonLayer;

      polygonLayer.layer.push(polygonLayerData);

      if (this.switchWeilan) {
        this.scene.addLayer(polygonLayerData);
        polygonLayer.hasLayer = true;
      }
    },

    /***************************************
     * 二：编辑模式（新增、编辑）
     ***************************************/
    polygonLayerSetEdit(params = []) {

      const validFences = (params || []).filter(f =>
        Array.isArray(f.points) && f.points.length >= 3
      );

      let backData = validFences.map((fence) => ({
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
                this.l7MapWidth
              );
            })
          ]
        }
      }));

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

    /***************************************
     * 三：获取绘制后的 polygon（存数据库）
     ***************************************/
    polygonLayerGetData() {

      if (!this.scene || !this.scene.drawer || typeof this.scene.drawer.getPolygonData !== 'function') {
        return [];
      }

      let getPolygonData = this.scene.drawer.getPolygonData();
      if (!Array.isArray(getPolygonData) || getPolygonData.length === 0) {
        return [];
      }

      let l7MapWidth = this.l7MapWidth;
      let mapMetersPerPixel = this.mapMetersPerPixel;
      let mapOriginPixelX = this.mapOriginPixelX;
      let mapOriginPixelY = this.mapOriginPixelY;

      const points = getPolygonData.map((item) => {
        const coordinate = item?.geometry?.coordinates?.[0] || [];

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

    /***************************************
     * 四：隐藏/显示
     ***************************************/
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
