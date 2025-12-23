/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @LastEditors: shenlan（修复版：修正导航坐标传递逻辑 + 任务区域支持多块同时显示）
 * @Description: L7 地图核心逻辑（导航 + 商品区域显示）
 */

import { ImageLayer, Mapbox, Scene, Popup, l7HandleImageMaxRange } from './l7';

// ✅ 任务区域用（保留，不乱删）
import { PolygonLayer, l7ConvertCMtoL, l7ConvertDataToWeb } from './l7';

import { metersToLngLat } from '@antv/l7'; // ✅ 保留，不乱删（即使不再使用）
import jizhan from './jizhan';
import xinbiao from './xinbiao';
import guiji from './guiji';
import mixinPolygonLayer from './polygon-layer';
import mqtt from './mqtt';

export default {
  mixins: [jizhan, xinbiao, guiji, mixinPolygonLayer, mqtt],

  data() {
    return {
      scene: null,
      l7MapWidth: 0,
      l7ImageMap: null,
      mapCenter: [],

      // 坐标换算参数（背景图加载后赋值）
      mapMetersPerPixel: null,
      mapOriginPixelX: 0,
      mapOriginPixelY: 0,

      // 实时定位（坐标：米）
      currentPos: null,

      // 导航状态
      nav: {
        enabled: false,
        route: [],
        routeName: '',
        startPoint: null,
        targetPoint: null,
        guideReached: false
      },

      /* --------------------- 固定路线定义（米坐标） --------------------- */
      fixedRoutes: {
        top: [
          { x: 1.0, y: 3.2 },
          { x: 3.8, y: 3.2 }
        ],
        bottom: [
          { x: 1.0, y: 1.5 },
          { x: 3.8, y: 1.5 }
        ]
      },

      // ✅ 兼容字段：保留不删（你原来是单层）
      taskAreaLayer: null,

      // ✅ 新增：支持多块区域同时显示
      taskAreaLayers: [],          // 存所有任务区域 layer
      taskAreaLayerMap: {},        // areaId -> layer（用于去重覆盖）

      // ✅ 字段保留：不删
      taskAreaPolygonIdxList: []
    };
  },

  methods: {
    /********************
     * 地图初始化
     ********************/
    mapInit(zoom = 19.85) {
      return new Promise((resolve) => {
        const scene = new Scene({
          id: this.id,
          logoVisible: false,
          map: new Mapbox({
            style: 'light',
            center: [0, 0],
            pitch: 0,
            zoom
          })
        });

        this.scene = scene;

        scene.on('loaded', () => {
          this.mapPopup = new Popup({ offsets: [0, 0], closeButton: false });
          resolve();
        });
      });
    },

    /********************
     * 背景图
     ********************/
    mapSetBackgroundImage(data) {
      let scene = this.scene;

      const {
        mapWidthPixel,
        mapHeightPixel,
        mapImgViewUrl,
        mapMetersPerPixel,
        mapOriginPixelX,
        mapOriginPixelY
      } = data;

      console.log('[Map] Loading Background:', { mapWidthPixel, mapMetersPerPixel });

      const { maxRange, l7MapWidth } = l7HandleImageMaxRange(mapWidthPixel, mapHeightPixel);

      this.l7MapWidth = l7MapWidth;
      this.mapMetersPerPixel = mapMetersPerPixel;
      this.mapOriginPixelX = mapOriginPixelX;
      this.mapOriginPixelY = mapOriginPixelY;

      const layer = new ImageLayer({ autoFit: true });
      layer.source(mapImgViewUrl, {
        parser: { type: 'image', extent: [0, 0, ...maxRange] }
      });

      const center = [maxRange[0] / 2, maxRange[1] / 2];
      this.mapCenter = center;

      scene.setCenter(center);
      this.l7ImageMap = layer;
      scene.addLayer(layer);

      if (this.xinbiao?.data?.length) {
        try {
          this.xinbiaoSetData({ data: this.xinbiao.data });
        } catch (e) {}
      }
    },

    /********************
     * 清除所有图层
     ********************/
    mapClear() {
      let scene = this.scene;
      if (!scene) return;

      try {
        if (scene.drawer) scene.drawer.clear();
        if (this.l7ImageMap) scene.removeLayer(this.l7ImageMap);

        if (this.jizhan?.hasLayer) scene.removeLayer(this.jizhan.layer);

        if (this.polygonLayer.hasLayer) {
          this.polygonLayer.layer.forEach((item) => scene.removeLayer(item));
          this.polygonLayer.layer = [];
        }

        if (this.xinbiao.list.layer) {
          this.xinbiao.list.layer.forEach((item) => {
            try {
              scene.removeLayer(item);
            } catch (e) {}
          });
        }

        // ✅ 清除任务区域（多块）
        this.clearTaskArea();

        this.guijiClear && this.guijiClear();

        this.nav.enabled = false;
        this.nav.route = [];
        this.nav.routeName = '';
        this.nav.startPoint = null;
        this.nav.targetPoint = null;
        this.nav.guideReached = false;
      } catch (error) {}
    },

    /* =========================================================
     * WKT 解析工具：POLYGON((x y, x y, ...))
     * 只取第一圈点
     * ========================================================= */
    parseWktPolygonPoints(areaContent) {
      const raw = String(areaContent || '').trim();
      if (!raw) return [];

      // 仅支持 POLYGON((...))，其他格式直接返回空
      const cleaned = raw
        .replace(/^POLYGON\s*\(\(/i, '')
        .replace(/\)\)\s*$/i, '');

      const pts = cleaned
        .split(',')
        .map((p) => {
          const [x, y] = p.trim().split(/\s+/).map(Number);
          return { x, y };
        })
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

      return pts;
    },

    /* =========================================================
     * ✅ 显示任务区域（支持多块同时显示）
     *
     * 默认：不清理旧区域（append = true）
     * 若你想“只显示一个区域”，外部先调用 clearTaskArea()
     * 或调用 showTaskArea(area, { append:false })
     * ========================================================= */
    showTaskArea(area, options = {}) {
      if (!area || !area.areaContent || !this.scene) return;

      const { append = true } = options;

      // 1) 地图参数必须就绪
      if (!this.mapMetersPerPixel || !this.l7MapWidth) {
        console.warn('[showTaskArea] 地图参数未就绪，先加载地图背景再显示区域', {
          mapMetersPerPixel: this.mapMetersPerPixel,
          l7MapWidth: this.l7MapWidth
        });
        return;
      }

      // 2) append=false 时，先清空所有任务区域
      if (!append) {
        this.clearTaskArea();
      }

      // 3) 解析 WKT
      const points = this.parseWktPolygonPoints(area.areaContent);

      if (!points || points.length < 3) {
        console.warn('[showTaskArea] WKT 解析点不足，无法绘制', area.areaContent);
        return;
      }

      // 4) 映射：DB坐标 -> Web -> L7
      const lngLatPoints = points.map((p) => {
        const webXY = l7ConvertDataToWeb({
          mapMetersPerPixel: this.mapMetersPerPixel,
          mapOriginPixelX: this.mapOriginPixelX,
          mapOriginPixelY: this.mapOriginPixelY,
          x: p.x,
          y: p.y
        });
        return l7ConvertCMtoL(webXY, this.l7MapWidth);
      });

      // 5) 闭合 polygon
      if (
        lngLatPoints[0][0] !== lngLatPoints[lngLatPoints.length - 1][0] ||
        lngLatPoints[0][1] !== lngLatPoints[lngLatPoints.length - 1][1]
      ) {
        lngLatPoints.push(lngLatPoints[0]);
      }

      const source = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              c: '#95de64',
              name: area.objectName || '任务区域'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [lngLatPoints]
            }
          }
        ]
      };

      // 6) ✅ 去重覆盖：同 areaId 先删旧 layer
      const key = area.areaId ?? area.id ?? area.objectName ?? JSON.stringify(lngLatPoints[0]);
      const old = this.taskAreaLayerMap[key];
      if (old && this.scene) {
        try {
          this.scene.removeLayer(old);
        } catch (e) {}
        this.taskAreaLayers = this.taskAreaLayers.filter((l) => l !== old);
        delete this.taskAreaLayerMap[key];
      }

      // 7) 新建 layer
      const layer = new PolygonLayer({
        zIndex: 6,
        active: false
      })
        .source(source)
        .shape('fill')
        .color('c')
        .style({ opacity: 0.45 });

      this.scene.addLayer(layer);

      // 8) 存起来（支持多块）
      this.taskAreaLayers.push(layer);
      this.taskAreaLayerMap[key] = layer;

      // 9) 兼容字段：保留最新一次
      this.taskAreaLayer = layer;

      // 10) 字段保留：不删
      this.taskAreaPolygonIdxList = [];

      console.log('[showTaskArea] ✅ 任务区域绘制完成（支持多块）', {
        key,
        areaId: area.areaId,
        objectName: area.objectName,
        pointsCount: points.length,
        totalLayers: this.taskAreaLayers.length
      });
    },

    /* =========================================================
     * ✅ 清除任务区域（清空所有任务区域 layer）
     * ========================================================= */
    clearTaskArea() {
      // 保留字段，不删
      this.taskAreaPolygonIdxList = [];

      if (this.scene && Array.isArray(this.taskAreaLayers) && this.taskAreaLayers.length) {
        this.taskAreaLayers.forEach((layer) => {
          try {
            this.scene.removeLayer(layer);
          } catch (e) {}
        });
      }

      this.taskAreaLayers = [];
      this.taskAreaLayerMap = {};
      this.taskAreaLayer = null;
    },

    /********************
     * 以下为你原有导航逻辑（完全未动）
     ********************/
    metersToWeb(x, y) {
      if (!this.mapMetersPerPixel || this.mapMetersPerPixel === 0) {
        console.warn('[Map] mapMetersPerPixel 未设置，坐标转换可能错误！');
        return [x, y];
      }

      const px = x / this.mapMetersPerPixel;
      const py = y / this.mapMetersPerPixel;

      return [px + (this.mapOriginPixelX || 0), py + (this.mapOriginPixelY || 0)];
    },

    distance2D(p, q) {
      return Math.hypot(p[0] - q[0], p[1] - q[1]);
    },

    projectPointToSegment(px, py, ax, ay, bx, by) {
      const abx = bx - ax;
      const aby = by - ay;
      const apx = px - ax;
      const apy = py - ay;
      const abLen2 = abx * abx + aby * aby;
      if (abLen2 === 0) return { x: ax, y: ay, dist: Math.hypot(px - ax, py - ay), t: 0 };

      let t = (apx * abx + apy * aby) / abLen2;
      t = Math.max(0, Math.min(1, t));

      const x = ax + t * abx;
      const y = ay + t * aby;
      return { x, y, dist: Math.hypot(px - x, py - y), t };
    },

    distanceToRoute(px, py, route) {
      if (!route || route.length < 2) return Infinity;
      let min = Infinity;
      for (let i = 0; i < route.length - 1; i++) {
        const a = route[i];
        const b = route[i + 1];
        const proj = this.projectPointToSegment(px, py, a.x, a.y, b.x, b.y);
        if (proj.dist < min) min = proj.dist;
      }
      return min;
    },

    chooseBestRoute() {
      const { top, bottom } = this.fixedRoutes;
      if (!this.currentPos) return { name: 'top', route: top };
      const [px, py] = this.currentPos;
      const dTop = this.distanceToRoute(px, py, top);
      const dBottom = this.distanceToRoute(px, py, bottom);
      return dTop <= dBottom ? { name: 'top', route: top } : { name: 'bottom', route: bottom };
    },

    navStartFixed() {
      console.log('[navStartFixed] 点击开始导航');

      if (!this.mapMetersPerPixel) {
        this.$Message && this.$Message.error('地图数据加载失败，无法计算路线');
        return;
      }

      const { name, route } = this.chooseBestRoute();
      if (!route || !route.length) {
        this.$Message && this.$Message.error('固定路线未配置');
        return;
      }

      const routeMetersArray = route.map((p) => [p.x, p.y]);

      this.nav.enabled = true;
      this.nav.route = routeMetersArray.map(([x, y]) => this.metersToWeb(x, y));
      this.nav.routeName = name;
      this.nav.startPoint = this.nav.route[0];
      this.nav.targetPoint = this.nav.route[this.nav.route.length - 1];
      this.nav.guideReached = false;

      this.guijiClear && this.guijiClear();

      if (this.guijiLineShow) {
        this.guijiLineShow({
          key: 'route',
          data: routeMetersArray,
          color: '#1E90FF',
          size: 4
        });
      }

      this.$Message &&
        this.$Message.success(name === 'top' ? '已开始导航（上路）' : '已开始导航（下路）');
    },

    navUpdateByBle(x, y) {
      this.currentPos = [x, y];
    },

    navArrived() {
      this.guijiClear && this.guijiClear();
      this.nav.enabled = false;
      this.nav.route = [];
      this.nav.routeName = '';
      this.nav.startPoint = null;
      this.nav.targetPoint = null;
      this.nav.guideReached = false;
      this.$Message && this.$Message.success('已到达');
    },

    navFinish() {
      this.navArrived();
    }
  }
};
