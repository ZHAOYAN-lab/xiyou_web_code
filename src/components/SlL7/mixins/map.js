/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @LastEditors: shenlan（修复版：修正导航坐标传递逻辑 + 任务区域支持多块同时显示）
 * @Description: L7 地图核心逻辑（导航 + 商品区域显示）
 */

import { ImageLayer, Mapbox, Scene, Popup, l7HandleImageMaxRange } from './l7';
import { getProductAreaList } from '@/api/path/product-area';

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
      mapId: null,

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
      predefinedWaypoints: [],

      /* --------------------- 固定路线定义（米坐标） --------------------- */
      fixedRoutes: {
        top: [],
        bottom: []
      },

      passageRouteLoaded: false,
      passageRouteLoading: false,
      passageRouteLoadingMapId: null,
      passageRouteMapId: null,
      passageRoutePromise: null,
      passageRoutes: [],
      activePassageRouteIndex: -1,

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
      const rawMapId = data?.mapId ?? data?.map_id ?? data?.id ?? null;
      const nextMapId = Number.isFinite(Number(rawMapId)) ? Number(rawMapId) : rawMapId;
      if (nextMapId !== this.mapId) {
        this.mapId = nextMapId;
        this.resetPassageRoute();
      }

      const layer = new ImageLayer({ autoFit: true });
      layer.source(mapImgViewUrl, {
        parser: { type: 'image', extent: [0, 0, ...maxRange] }
      });

      const center = [maxRange[0] / 2, maxRange[1] / 2];
      this.mapCenter = center;

      scene.setCenter(center);
      this.l7ImageMap = layer;
      scene.addLayer(layer);
      this.loadPassageRouteFromDb(this.mapId);

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
        this.resetPassageRoute();
        this.mapId = null;
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

    parseWktLinePoints(areaContent) {
      const raw = String(areaContent || '').trim();
      if (!raw) return [];

      let cleaned = raw;
      if (/^LINESTRING/i.test(cleaned)) {
        cleaned = cleaned.replace(/^LINESTRING\s*\(/i, '').replace(/\)\s*$/i, '');
      } else if (/^POLYGON/i.test(cleaned)) {
        cleaned = cleaned.replace(/^POLYGON\s*\(\(/i, '').replace(/\)\)\s*$/i, '');
      } else {
        return [];
      }

      const pts = cleaned
        .split(',')
        .map((p) => {
          const [x, y] = p.trim().split(/\s+/).map(Number);
          return { x, y };
        })
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

      return pts;
    },

    normalizePathPoints(points) {
      const cleaned = [];
      (points || []).forEach((p) => {
        const x = Number(Array.isArray(p) ? p[0] : p?.x);
        const y = Number(Array.isArray(p) ? p[1] : p?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const last = cleaned[cleaned.length - 1];
        if (last && last.x === x && last.y === y) return;
        cleaned.push({ x, y });
      });

      if (cleaned.length < 2) return cleaned;
      return cleaned;
    },

    isClosedPath(points) {
      if (!Array.isArray(points) || points.length < 3) return false;
      return this.isSamePoint(points[0], points[points.length - 1]);
    },


    setActivePassageRoute(route, index = -1) {
      if (!route || !Array.isArray(route.waypoints) || route.waypoints.length < 2) {
        this.predefinedWaypoints = [];
        this.fixedRoutes = { top: [], bottom: [] };
        this.activePassageRouteIndex = -1;
        return;
      }

      this.predefinedWaypoints = route.waypoints;
      this.fixedRoutes = { top: [], bottom: [] };
      this.activePassageRouteIndex = Number.isFinite(index) ? index : -1;
    },

    selectPassageRouteByPosition(pos) {
      if (!Array.isArray(this.passageRoutes) || this.passageRoutes.length === 0) {
        this.setActivePassageRoute(null);
        return null;
      }

      const px = Array.isArray(pos) ? pos[0] : pos?.x;
      const py = Array.isArray(pos) ? pos[1] : pos?.y;
      const obstacles = this.getObstaclePolygons();
      const hasObstacles = obstacles.length > 0;

      const candidates = this.passageRoutes
        .map((route, idx) => {
          const points = route?.waypoints || [];
          if (points.length < 2) return null;
          const dist = Number.isFinite(px) && Number.isFinite(py)
            ? this.distanceToRoute(px, py, points, route?.isClosed)
            : Infinity;
          const blocked = hasObstacles ? this.routeIntersectsObstacles(route, obstacles) : false;
          return { route, idx, dist, blocked };
        })
        .filter(Boolean);

      if (!candidates.length) {
        this.setActivePassageRoute(null);
        return null;
      }

      const available = candidates.filter((item) => !item.blocked);
      let chosen = null;

      if (!Number.isFinite(px) || !Number.isFinite(py)) {
        chosen = available[0] || candidates[0];
      } else {
        const pool = available.length ? available : candidates;
        chosen = pool.reduce((best, item) => (item.dist < best.dist ? item : best), pool[0]);
      }

      if (hasObstacles && chosen?.blocked) {
        console.warn('[Map] all passage routes intersect obstacles, fallback to nearest');
      }

      this.setActivePassageRoute(chosen.route, chosen.idx);
      return chosen.route;
    },

    getAreaMapIds(area) {
      const raw = area?.mapIds ?? area?.map_ids ?? area?.mapId ?? area?.map_id;
      if (Array.isArray(raw)) {
        return raw.map((v) => Number(v)).filter((v) => Number.isFinite(v));
      }
      if (typeof raw === 'string') {
        return raw
          .split(',')
          .map((v) => Number(v.trim()))
          .filter((v) => Number.isFinite(v));
      }
      const num = Number(raw);
      if (Number.isFinite(num)) return [num];
      return [];
    },

    areaMatchesMap(area, mapId) {
      const ids = this.getAreaMapIds(area);
      const target = Number(mapId);
      if (!ids.length || !Number.isFinite(target)) return false;
      return ids.includes(target);
    },

    resetPassageRoute() {
      this.predefinedWaypoints = [];
      this.fixedRoutes = { top: [], bottom: [] };
      this.passageRouteLoaded = false;
      this.passageRouteLoadingMapId = null;
      this.passageRouteMapId = null;
      this.passageRoutes = [];
      this.activePassageRouteIndex = -1;
    },

    async loadPassageRouteFromDb(mapId) {
      const targetMapId = Number.isFinite(Number(mapId)) ? Number(mapId) : mapId;
      if (this.passageRouteLoading) {
        if (this.passageRouteLoadingMapId === targetMapId) {
          return this.passageRoutePromise;
        }
        return this.passageRoutePromise?.finally(() => this.loadPassageRouteFromDb(targetMapId));
      }
      if (this.passageRouteLoaded && this.passageRouteMapId === targetMapId) {
        return this.passageRoutePromise;
      }

      this.passageRouteLoading = true;
      this.passageRouteLoadingMapId = targetMapId;
      const activeMapId = targetMapId;

      this.passageRoutePromise = getProductAreaList()
        .then((res) => {
          if (activeMapId !== this.mapId) return;

          const list = res?.list || res?.data || res || [];
          if (!Array.isArray(list)) {
            this.predefinedWaypoints = [];
            this.fixedRoutes = { top: [], bottom: [] };
            this.passageRoutes = [];
            this.activePassageRouteIndex = -1;
            this.passageRouteLoaded = true;
            this.passageRouteMapId = activeMapId ?? null;
            return;
          }

          const passageType = '\u901a\u8def\u533a\u57df';
          const candidates = list.filter((item) => {
            const type =
              item?.belongType ??
              item?.belong_type ??
              item?.belongTypeName ??
              item?.belong_type_name;
            return type === passageType;
          });

          let pickList = candidates;
          if (activeMapId != null) {
            const byMap = candidates.filter((item) => this.areaMatchesMap(item, activeMapId));
            if (byMap.length) pickList = byMap;
          }

          const parsed = pickList
            .map((item) => {
              const content = item?.areaContent ?? item?.area_content;
              return {
                area: item,
                points: this.parseWktLinePoints(content)
              };
            })
            .filter((item) => item.points.length >= 2);

          const routes = parsed
            .map((item) => {
              const pathPoints = this.normalizePathPoints(item.points);
              if (pathPoints.length < 2) return null;
              return {
                area: item.area,
                waypoints: pathPoints,
                isClosed: this.isClosedPath(pathPoints)
              };
            })
            .filter(Boolean);

          this.passageRoutes = routes;

          if (!routes.length) {
            this.predefinedWaypoints = [];
            this.fixedRoutes = { top: [], bottom: [] };
            this.activePassageRouteIndex = -1;
            this.passageRouteLoaded = true;
            this.passageRouteMapId = activeMapId ?? null;
            return;
          }

          this.selectPassageRouteByPosition(this.currentPos);
          if (!this.predefinedWaypoints.length) {
            this.setActivePassageRoute(routes[0], 0);
          }
          this.passageRouteLoaded = true;
          this.passageRouteMapId = activeMapId ?? null;
        })
        .catch((error) => {
          console.warn('[Map] load passage route failed', error);
          if (activeMapId !== this.mapId) return;
          this.passageRouteLoaded = false;
        })
        .finally(() => {
          this.passageRouteLoading = false;
          this.passageRouteLoadingMapId = null;
          this.passageRoutePromise = null;
        });

      return this.passageRoutePromise;
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

    distanceToRoute(px, py, route, isClosed = false) {
      if (!route || route.length < 2) return Infinity;
      let points = route;
      const closed = Boolean(isClosed);
      if (closed && this.isSamePoint(points[0], points[points.length - 1])) {
        points = points.slice(0, -1);
      }
      const len = points.length;
      if (len < 2) return Infinity;

      const segmentCount = closed ? len : len - 1;
      let min = Infinity;
      for (let i = 0; i < segmentCount; i++) {
        const a = points[i];
        const b = points[(i + 1) % len];
        const proj = this.projectPointToSegment(px, py, a.x, a.y, b.x, b.y);
        if (proj.dist < min) min = proj.dist;
      }
      return min;
    },

    convertMetersPointToLngLat(point) {
      if (!point || !this.mapMetersPerPixel || !this.l7MapWidth) return null;
      const x = Array.isArray(point) ? point[0] : point?.x;
      const y = Array.isArray(point) ? point[1] : point?.y;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

      const web = l7ConvertDataToWeb({
        mapMetersPerPixel: this.mapMetersPerPixel,
        mapOriginPixelX: this.mapOriginPixelX,
        mapOriginPixelY: this.mapOriginPixelY,
        x,
        y
      });
      return l7ConvertCMtoL(web, this.l7MapWidth);
    },

    getObstaclePolygons() {
      const sources = this.polygonLayer?.source || [];
      const polygons = [];

      sources.forEach((source) => {
        const coords = source?.features?.[0]?.geometry?.coordinates;
        if (!Array.isArray(coords) || !coords.length) return;
        const ring = coords[0];
        if (!Array.isArray(ring) || ring.length < 3) return;

        const cleaned = ring
          .map((p) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] : null))
          .filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));

        if (cleaned.length < 3) return;
        const first = cleaned[0];
        const last = cleaned[cleaned.length - 1];
        if (cleaned.length > 3 && first[0] === last[0] && first[1] === last[1]) {
          cleaned.pop();
        }
        if (cleaned.length >= 3) polygons.push(cleaned);
      });

      return polygons;
    },

    pointInPolygon(point, polygon) {
      const x = point[0];
      const y = point[1];
      let inside = false;

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];
        const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }

      return inside;
    },

    segmentsIntersect(a, b, c, d) {
      const eps = 1e-9;
      const orient = (p, q, r) =>
        (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      const onSegment = (p, q, r) =>
        Math.min(p[0], r[0]) - eps <= q[0] &&
        q[0] <= Math.max(p[0], r[0]) + eps &&
        Math.min(p[1], r[1]) - eps <= q[1] &&
        q[1] <= Math.max(p[1], r[1]) + eps;

      const o1 = orient(a, b, c);
      const o2 = orient(a, b, d);
      const o3 = orient(c, d, a);
      const o4 = orient(c, d, b);

      if (Math.abs(o1) < eps && onSegment(a, c, b)) return true;
      if (Math.abs(o2) < eps && onSegment(a, d, b)) return true;
      if (Math.abs(o3) < eps && onSegment(c, a, d)) return true;
      if (Math.abs(o4) < eps && onSegment(c, b, d)) return true;

      return (o1 > 0 && o2 < 0 || o1 < 0 && o2 > 0) && (o3 > 0 && o4 < 0 || o3 < 0 && o4 > 0);
    },

    polylineIntersectsPolygon(line, polygon) {
      if (!Array.isArray(line) || line.length < 2) return false;
      if (!Array.isArray(polygon) || polygon.length < 3) return false;

      for (let i = 0; i < line.length; i++) {
        if (this.pointInPolygon(line[i], polygon)) return true;
      }

      for (let i = 0; i < line.length - 1; i++) {
        const a = line[i];
        const b = line[i + 1];
        for (let j = 0; j < polygon.length; j++) {
          const c = polygon[j];
          const d = polygon[(j + 1) % polygon.length];
          if (this.segmentsIntersect(a, b, c, d)) return true;
        }
      }

      return false;
    },

    routeIntersectsObstacles(route, obstacles) {
      if (!route || !Array.isArray(route.waypoints) || route.waypoints.length < 2) return false;
      const polygons = Array.isArray(obstacles) ? obstacles : this.getObstaclePolygons();
      if (!polygons.length) return false;

      const line = route.waypoints
        .map((p) => this.convertMetersPointToLngLat(p))
        .filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));

      if (line.length < 2) return false;
      return polygons.some((poly) => this.polylineIntersectsPolygon(line, poly));
    },

    chooseBestRoute() {
      const active =
        (Array.isArray(this.passageRoutes) && this.passageRoutes[this.activePassageRouteIndex]) ||
        (Array.isArray(this.passageRoutes) && this.passageRoutes[0]) ||
        null;
      const route = Array.isArray(active?.waypoints)
        ? active.waypoints
        : Array.isArray(this.predefinedWaypoints)
        ? this.predefinedWaypoints
        : [];
      return { name: active?.area?.objectName || 'route', route };
    },

    pathLength(points) {
      if (!Array.isArray(points) || points.length < 2) return 0;
      let total = 0;
      for (let i = 0; i < points.length - 1; i++) {
        total += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
      }
      return total;
    },

    getNearestPointOnPath(pos, points, isClosed = false) {
      if (!Array.isArray(points) || points.length < 2) return null;
      const px = Array.isArray(pos) ? pos[0] : pos?.x;
      const py = Array.isArray(pos) ? pos[1] : pos?.y;
      if (!Number.isFinite(px) || !Number.isFinite(py)) return null;

      let basePoints = points;
      const closed = Boolean(isClosed);
      if (closed && this.isSamePoint(points[0], points[points.length - 1])) {
        basePoints = points.slice(0, -1);
      }

      const len = basePoints.length;
      if (len < 2) return null;

      const segmentCount = closed ? len : len - 1;
      let best = null;
      let min = Infinity;

      for (let i = 0; i < segmentCount; i++) {
        const a = basePoints[i];
        const b = basePoints[(i + 1) % len];
        const proj = this.projectPointToSegment(px, py, a.x, a.y, b.x, b.y);
        if (proj.dist < min) {
          min = proj.dist;
          best = {
            point: { x: proj.x, y: proj.y },
            segmentIndex: i,
            t: proj.t,
            dist: proj.dist
          };
        }
      }

      return best;
    },

    getShortestRingPath(points, startIdx, endIdx) {
      const len = points.length;
      if (len === 0) return [];
      if (startIdx === endIdx) return [points[startIdx]];

      const forward = [];
      let curr = startIdx;
      while (curr !== endIdx) {
        forward.push(points[curr]);
        curr = (curr + 1) % len;
      }
      forward.push(points[endIdx]);

      const backward = [];
      curr = startIdx;
      while (curr !== endIdx) {
        backward.push(points[curr]);
        curr = (curr - 1 + len) % len;
      }
      backward.push(points[endIdx]);

      return this.pathLength(forward) <= this.pathLength(backward) ? forward : backward;
    },

    buildRouteOnPath(startPos, targetPos, route) {
      if (!startPos || !targetPos) return [];
      if (!route || !Array.isArray(route.waypoints) || route.waypoints.length < 2) return [];

      const closed = Boolean(route.isClosed);
      let basePoints = route.waypoints;
      if (closed && this.isSamePoint(basePoints[0], basePoints[basePoints.length - 1])) {
        basePoints = basePoints.slice(0, -1);
      }
      if (basePoints.length < 2) return [];

      const startProj = this.getNearestPointOnPath(startPos, basePoints, closed);
      const endProj = this.getNearestPointOnPath(targetPos, basePoints, closed);
      if (!startProj || !endProj) return [];

      const insertions = [
        {
          key: 'start',
          segmentIndex: startProj.segmentIndex,
          t: startProj.t,
          point: startProj.point
        },
        {
          key: 'end',
          segmentIndex: endProj.segmentIndex,
          t: endProj.t,
          point: endProj.point
        }
      ];

      const augmented = basePoints.slice();
      const indices = {};
      insertions
        .sort((a, b) => {
          if (a.segmentIndex === b.segmentIndex) return a.t - b.t;
          return a.segmentIndex - b.segmentIndex;
        })
        .forEach((ins, offset) => {
          const insertAt = ins.segmentIndex + 1 + offset;
          augmented.splice(insertAt, 0, ins.point);
          indices[ins.key] = insertAt;
        });

      const startIdx = indices.start;
      const endIdx = indices.end;
      if (!Number.isFinite(startIdx) || !Number.isFinite(endIdx)) return [];

      let rawPath = [];
      if (closed) {
        rawPath = this.getShortestRingPath(augmented, startIdx, endIdx);
      } else if (startIdx <= endIdx) {
        rawPath = augmented.slice(startIdx, endIdx + 1);
      } else {
        rawPath = augmented.slice(endIdx, startIdx + 1).reverse();
      }

      const cleaned = [];
      rawPath.forEach((p) => {
        if (!cleaned.length || !this.isSamePoint(cleaned[cleaned.length - 1], p)) {
          cleaned.push(p);
        }
      });
      return cleaned;
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
    async navStartFixed(areaNameOrOptions, areaPosMaybe) {
      console.log('[navStartFixed] start navigation');

      if (!this.passageRouteLoaded) {
        await this.loadPassageRouteFromDb(this.mapId);
      }
      this.selectPassageRouteByPosition(this.currentPos);

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
      const activeRoute =
        (Array.isArray(this.passageRoutes) && this.passageRoutes[this.activePassageRouteIndex]) ||
        (Array.isArray(this.passageRoutes) && this.passageRoutes[0]) ||
        null;

      if (!activeRoute || !Array.isArray(activeRoute.waypoints) || activeRoute.waypoints.length < 2) {
        this.$Message && this.$Message.error('未配置通路区域');
        return;
      }

      const buildRoute = (from, to) => this.buildRouteOnPath(from, to, activeRoute);

      if (startPos && startAreaPos && endAreaPos) {
        const firstLeg = buildRoute(startPos, startAreaPos);
        const secondLeg = buildRoute(startAreaPos, endAreaPos);
        if (firstLeg.length && secondLeg.length) {
          route = this.isSamePoint(firstLeg[firstLeg.length - 1], secondLeg[0])
            ? firstLeg.concat(secondLeg.slice(1))
            : firstLeg.concat(secondLeg);
        } else {
          route = firstLeg.length ? firstLeg : secondLeg;
        }
      } else if (startPos && areaPos && typeof areaPos.x === 'number' && typeof areaPos.y === 'number') {
        route = buildRoute(startPos, areaPos);
      }

      if (!route.length) {
        const result = this.chooseBestRoute();
        name = result.name;
        route = result.route;
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
