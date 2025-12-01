/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-07 11:40:36
 * @LastEditors: shenlan（修复商品区域 / 围栏新增、编辑、回显兼容问题）
 * @LastEditTime: 2025-12-01
 * @Description: 围栏 & 商品区域编辑层（稳定版）
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

    /***************************************
     * 二：编辑模式（可新增、编辑 polygon）
     ***************************************/
    polygonLayerSetEdit(params = []) {

      // 过滤非法数据，必须是 points 数组且至少 3 个点
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

      // 初始化 DrawPolygon（即使 backData 空，也要初始化，不然后续 getPolygonData 会 undefined）
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
     * 三：获取绘制后的 polygon（存数据库用）
     ***************************************/
    polygonLayerGetData() {

      // drawer 未初始化 → 安全返回空数组
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
     * 四：隐藏/显示 围栏
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
