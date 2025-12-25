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
      predefinedWaypoints: [
        { x: 4.17, y: 0.7 },
        { x: 3.1, y: 0.7 },
        { x: 2.02, y: 0.67 },
        { x: 0.95, y: 0.69 },
        { x: 0.9, y: 1.77 },
        { x: 0.9, y: 2.84 },
        { x: 1.97, y: 2.84 },
        { x: 3.04, y: 2.84 },
        { x: 4.12, y: 2.84 },
        { x: 4.12, y: 1.77 },
        { x: 4.17, y: 0.7 }
      ],

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

    getAreaCenterFromPoints(points) {
      if (!Array.isArray(points) || points.length === 0) return null;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      points.forEach((p) => {
        const x = Array.isArray(p) ? p[0] : p?.x;
        const y = Array.isArray(p) ? p[1] : p?.y;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });
      if (
        !Number.isFinite(minX) ||
        !Number.isFinite(minY) ||
        !Number.isFinite(maxX) ||
        !Number.isFinite(maxY)
      ) {
        return null;
      }
      return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    },

    getAreaCenterFromWkt(areaContent) {
      const points = this.parseWktPolygonPoints(areaContent);
      return this.getAreaCenterFromPoints(points);
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

    getNearestWaypointIndex(target) {
      let nearestIndex = -1;
      let minDist = Infinity;

      this.predefinedWaypoints.forEach((wp, index) => {
        const dist = Math.hypot(target.x - wp.x, target.y - wp.y);
        if (dist < minDist) {
          minDist = dist;
          nearestIndex = index;
        }
      });
      return nearestIndex;
    },

    getShortestLoopPath(idx1, idx2) {
      const len = this.predefinedWaypoints.length;
      if (idx1 === idx2) return [this.predefinedWaypoints[idx1]];

      let start = idx1 === len - 1 ? 0 : idx1;
      let end = idx2 === len - 1 ? 0 : idx2;
      const loopLen = len - 1;

      let diff = end - start;
      if (diff < 0) diff += loopLen;
      const revDiff = loopLen - diff;

      const path = [];
      const points = this.predefinedWaypoints;

      if (diff <= revDiff) {
        let curr = start;
        while (curr !== end) {
          path.push(points[curr]);
          curr = (curr + 1) % loopLen;
        }
        path.push(points[end]);
      } else {
        let curr = start;
        while (curr !== end) {
          path.push(points[curr]);
          curr = (curr - 1 + loopLen) % loopLen;
        }
        path.push(points[end]);
      }
      return path;
    },
    buildLoopRoute(startPos, targetPos) {
      if (!startPos || !targetPos) return [];
      if (!Array.isArray(this.predefinedWaypoints) || this.predefinedWaypoints.length < 2) {
        return [startPos, targetPos];
      }
      const startIdx = this.getNearestWaypointIndex(startPos);
      const endIdx = this.getNearestWaypointIndex(targetPos);
      const loopSegment = this.getShortestLoopPath(startIdx, endIdx);
      return [startPos, ...loopSegment, targetPos];
    },

    isSamePoint(a, b) {
      if (!a || !b) return false;
      const ax = Array.isArray(a) ? a[0] : a.x;
      const ay = Array.isArray(a) ? a[1] : a.y;
      const bx = Array.isArray(b) ? b[0] : b.x;
      const by = Array.isArray(b) ? b[1] : b.y;
      if (!Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(bx) || !Number.isFinite(by)) {
        return false;
      }
      return ax === bx && ay === by;
    },
    navStartFixed(areaNameOrOptions, areaPosMaybe) {
      console.log('[navStartFixed] start navigation');

      if (!this.mapMetersPerPixel) {
        this.$Message && this.$Message.error('地图数据加载失败，无法计算路线');
        console.error('[Nav] mapMetersPerPixel is empty');
        return;
      }

      let areaName = '';
      let areaPos = null;
      let area = null;
      let areaContent = null;
      let startArea = null;
      let endArea = null;
      let startAreaPos = null;
      let endAreaPos = null;

      if (areaNameOrOptions && typeof areaNameOrOptions === 'object' && !Array.isArray(areaNameOrOptions)) {
        areaName = areaNameOrOptions.areaName || areaNameOrOptions.name || '';
        areaPos = areaNameOrOptions.areaPos || areaNameOrOptions.targetPos || null;
        area = areaNameOrOptions.area || null;
        areaContent = areaNameOrOptions.areaContent || null;
        startArea = areaNameOrOptions.startArea || null;
        endArea = areaNameOrOptions.endArea || null;
        startAreaPos = areaNameOrOptions.startAreaPos || null;
        endAreaPos = areaNameOrOptions.endAreaPos || null;
      } else {
        areaName = areaNameOrOptions || '';
        areaPos = areaPosMaybe || null;
      }

      if (Array.isArray(areaPos)) {
        areaPos = { x: areaPos[0], y: areaPos[1] };
      }
      if (Array.isArray(startAreaPos)) {
        startAreaPos = { x: startAreaPos[0], y: startAreaPos[1] };
      }
      if (Array.isArray(endAreaPos)) {
        endAreaPos = { x: endAreaPos[0], y: endAreaPos[1] };
      }

      if (!areaPos) {
        if (area?.points) areaPos = this.getAreaCenterFromPoints(area.points);
        if (!areaPos && area?.areaContent) {
          areaPos = this.getAreaCenterFromWkt(area.areaContent);
        }
        if (!areaPos && areaContent) areaPos = this.getAreaCenterFromWkt(areaContent);
      }

      if (!startAreaPos && startArea) {
        if (startArea.points) startAreaPos = this.getAreaCenterFromPoints(startArea.points);
        if (!startAreaPos && startArea.areaContent) {
          startAreaPos = this.getAreaCenterFromWkt(startArea.areaContent);
        }
      }

      if (!endAreaPos && endArea) {
        if (endArea.points) endAreaPos = this.getAreaCenterFromPoints(endArea.points);
        if (!endAreaPos && endArea.areaContent) {
          endAreaPos = this.getAreaCenterFromWkt(endArea.areaContent);
        }
      }

      let startPos = null;
      if (Array.isArray(this.currentPos)) {
        const [x, y] = this.currentPos;
        if (Number.isFinite(x) && Number.isFinite(y)) {
          startPos = { x, y };
        }
      }
      if (!startPos && Array.isArray(this.predefinedWaypoints) && this.predefinedWaypoints.length) {
        startPos = this.predefinedWaypoints[0];
      }

      let name = areaName || area?.objectName || 'Custom Route';
      if (!name) {
        name = startArea?.objectName || endArea?.objectName || 'Custom Route';
      }
      let route = [];

      if (startPos && startAreaPos && endAreaPos) {
        const firstLeg = this.buildLoopRoute(startPos, startAreaPos);
        const secondLeg = this.buildLoopRoute(startAreaPos, endAreaPos);
        if (firstLeg.length && secondLeg.length) {
          route = firstLeg.concat(secondLeg.slice(1));
        } else {
          route = firstLeg.length ? firstLeg : secondLeg;
        }
      } else if (startPos && areaPos && typeof areaPos.x === 'number' && typeof areaPos.y === 'number') {
        route = this.buildLoopRoute(startPos, areaPos);
      }

      if (!route.length) {
        if (this.areaRoutes && areaName && this.areaRoutes[areaName]) {
          route = this.areaRoutes[areaName];
        } else {
          const result = this.chooseBestRoute();
          name = result.name;
          route = result.route;
        }
      }

      if (startPos && route.length && !this.isSamePoint(route[0], startPos)) {
        route = [startPos, ...route];
      }

      if (!route || !route.length) {
        this.$Message && this.$Message.error('固定路线未配置');
        return;
      }

      const routeMetersArray = route.map((p) => [p.x, p.y]);

      console.log('[Nav] route (meters):', routeMetersArray);

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
      } else {
        console.error('[Nav] guijiLineShow missing');
      }

      if (this.$Message) {
        let msg = '已开始导航';
        if (name === 'top') msg = '已开始导航（上路）';
        if (name === 'bottom') msg = '已开始导航（下路）';
        this.$Message.success(msg);
      }
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
