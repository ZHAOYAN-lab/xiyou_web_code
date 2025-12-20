/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @LastEditors: shenlan（修复版：修正导航坐标传递逻辑）
 * @Description: L7 地图核心逻辑（导航 + 商品区域显示）
 */

import { ImageLayer, Mapbox, Scene, Popup, l7HandleImageMaxRange } from './l7';

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
      // 地图实际长度约 4.05米，终点设为 3.8 确保在范围内
      fixedRoutes: {
        top: [
          { x: 1.0, y: 3.2 },
          { x: 3.8, y: 3.2 }
        ],
        bottom: [
          { x: 1.0, y: 1.5 },
          { x: 3.8, y: 1.5 }
        ]
      }
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
            style: 'light', // 这里的 style 加载失败可能会导致 401 错误
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

      // 打印一下接收到的地图参数，确保数据正常
      console.log('[Map] Loading Background:', { mapWidthPixel, mapMetersPerPixel });

      const { maxRange, l7MapWidth } = l7HandleImageMaxRange(
        mapWidthPixel,
        mapHeightPixel
      );

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

      // 避免切图后定位消失
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

        this.guijiClear && this.guijiClear();

        this.nav.enabled = false;
        this.nav.route = [];
        this.nav.routeName = '';
        this.nav.startPoint = null;
        this.nav.targetPoint = null;
        this.nav.guideReached = false;
      } catch (error) {}
    },

    mapSetCenter() {
      if (!this.scene || !this.mapCenter.length) return;
      this.scene.setCenter(this.mapCenter);
    },

    mapResize() {
      this.mapSetCenter();
    },

    /********************
     * 坐标转换：米 → Web（L7 图片坐标系）
     ********************/
    metersToWeb(x, y) {
      // ★★★ 关键检查：如果比例尺未加载，返回原值并在控制台警告 ★★★
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

    /********************
     * 开始导航（固定路线）
     ********************/
    navStartFixed() {
      console.log('[navStartFixed] 点击开始导航');

      // 1. 检查地图参数是否就绪
      if (!this.mapMetersPerPixel) {
        this.$Message && this.$Message.error('地图数据加载失败，无法计算路线');
        console.error('[Nav] mapMetersPerPixel 为空，请检查网络或地图接口');
        return;
      }

      // 2. 获取最佳路线 (格式为对象数组 [{x:1, y:1}, {x:2, y:2}])
      const { name, route } = this.chooseBestRoute();
      if (!route || !route.length) {
        this.$Message && this.$Message.error('固定路线未配置');
        return;
      }

      // 3. ★★★ 关键修复：转换为 guiji.js 期望的数组格式，但保留米坐标（不转像素） ★★★
      // guijiLineShow 内部会调用 l7ConvertDataToWeb，所以这里必须传入【米】
      const routeMetersArray = route.map((p) => [p.x, p.y]);
      
      console.log('[Nav] 路线坐标(米):', routeMetersArray);

      // 4. 更新 Vue 状态 (nav.route 保留像素坐标用于逻辑判断，可选)
      this.nav.enabled = true;
      this.nav.route = routeMetersArray.map(([x,y]) => this.metersToWeb(x,y)); 
      this.nav.routeName = name;
      this.nav.startPoint = this.nav.route[0];
      this.nav.targetPoint = this.nav.route[this.nav.route.length - 1];
      this.nav.guideReached = false;

      // 5. 绘制路线
      this.guijiClear && this.guijiClear();

      if (this.guijiLineShow) {
        this.guijiLineShow({
          key: 'route',
          data: routeMetersArray, // ★ 传米坐标数组
          color: '#1E90FF',
          size: 4
        });
      } else {
        console.error('[Nav] guijiLineShow 方法不存在，请检查 mixin 引入');
      }

      this.$Message &&
        this.$Message.success(
          name === 'top' ? '已开始导航（上路）' : '已开始导航（下路）'
        );
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