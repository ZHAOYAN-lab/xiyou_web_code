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
      l7MapWidth: 0, //转换值时的参数
      l7ImageMap: null, //底图
      mapCenter: [], //当前图的中心点

      // ========= 导航相关 ==============
      currentPos: null, // 实时位置（BLE）
      nav: {
        enabled: false,     // 是否正在导航
        startPos: null,     // 起点
        targetPos: null,    // 终点
        fullRoute: [],      // 完整路线
        walkedRoute: [],    // 已走路线
        remainRoute: []     // 未走路线
      }
      // ================================
    };
  },
  computed: {},
  beforeDestroy() {
    try {
      // this.scene.removeAllLayer();
    } catch (error) {
      // console.log(error);
    }
  },
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {
    /**************************
     * 地图初始化
     **************************/
    mapInit(zoom = 19.85) {
      return new Promise((resolve) => {
        const scene = new Scene({
          id: this.id,
          logoVisible: false,
          map: new Mapbox({
            style: 'light',
            center: [0, 0],
            pitch: 0,
            zoom: zoom
            // minZoom: 18
          })
        });

        this.scene = scene;

        scene.on('loaded', () => {
          this.mapPopup = new Popup({
            offsets: [0, 0],
            closeButton: false
          });

          resolve();
        });
      });
    },

    /**************************
     * 画底图
     **************************/
    mapSetBackgroundImage(data) {
      console.log('地图高度：', data);
      let scene = this.scene;
      const {
        mapWidthPixel,
        mapHeightPixel,
        mapImgViewUrl,
        mapMetersPerPixel,
        mapOriginPixelX,
        mapOriginPixelY
      } = data;
      const { maxRange, l7MapWidth } = l7HandleImageMaxRange(mapWidthPixel, mapHeightPixel);

      // 缓存 相关数据用于 基站/信标/围栏 数据转换
      this.l7MapWidth = l7MapWidth;
      this.mapMetersPerPixel = mapMetersPerPixel;
      this.mapOriginPixelX = mapOriginPixelX;
      this.mapOriginPixelY = mapOriginPixelY;

      let layer = new ImageLayer({
        autoFit: true
      });

      layer.source(mapImgViewUrl, {
        parser: {
          type: 'image',
          extent: [0, 0, ...maxRange]
        }
      });

      let center = [maxRange[0] / 2, maxRange[1] / 2];

      scene.setCenter(center);

      // 缓存中心点
      this.mapCenter = center;
      this.l7ImageMap = layer;

      scene.addLayer(layer);
    },

    /**************************
     * 清除所有数据
     **************************/
    mapClear() {
      try {
        let scene = this.scene;
        if (scene.drawer) {
          scene.drawer.clear();
        }
        // this.scene.removeAllLayer();

        if (this.l7ImageMap) {
          scene.removeLayer(this.l7ImageMap);
        }

        if (this.jizhan.hasLayer) {
          scene.removeLayer(this.jizhan.layer);
        }

        if (this.polygonLayer.hasLayer) {
          this.polygonLayer.layer.forEach((item) => {
            scene.removeLayer(item);
          });

          this.polygonLayer.layer = [];
        }

        if (this.xinbiao.list.layer) {
          this.xinbiao.list.layer.forEach((item) => {
            scene.removeLayer(item);
          });
        }

        // 清空导航轨迹
        try {
          this.guijiClear && this.guijiClear();
        } catch (e) {}
      } catch (error) {
        // console.log(error);
      }
    },

    mapGetScene() {
      return this.scene;
    },

    /**************************
     * 假数据（原样保留）
     **************************/
    l7DemoData() {
      return {
        // 信标
        station: [
          {
            gateway: '10030240',
            mapId: '1645334018633216001',
            groupId: '3',
            name: '中心',
            productName: 'gateway',
            systemId: '10990145',
            type: 'Gateway',
            status: 'Online',
            ip: '61.194.146.44',
            fenceIds: null,
            setX: 3.5,
            setY: 1.9,
            setZ: 2.5,
            angle: 90.0,
            hisX: 0.306456,
            hisY: -0.306456,
            hisZ: -9.65336,
            updateTime: 1687752916,
            extraInfo: null
          },
          {
            gateway: '10030241',
            mapId: '1645334018633216001',
            groupId: '3',
            name: '原点',
            productName: 'gateway',
            systemId: '10990145',
            type: 'Gateway',
            status: 'Offline',
            ip: '61.194.146.44',
            fenceIds: null,
            setX: 0.5,
            setY: 2.1,
            setZ: 2.5,
            angle: 90.0,
            hisX: 0.0,
            hisY: -0.153228,
            hisZ: -10.4195,
            updateTime: 1687752920,
            extraInfo: null
          },
          {
            gateway: '10030240',
            mapId: '1645334018633216001',
            groupId: '3',
            name: '中心',
            productName: 'gateway',
            systemId: '10990145',
            type: 'GatewayCar',
            status: 'Online',
            ip: '61.194.146.44',
            fenceIds: null,
            setX: 3.9,
            setY: 2.0,
            setZ: 2.5,
            angle: 90.0,
            hisX: 0.306456,
            hisY: -0.306456,
            hisZ: -9.65336,
            updateTime: 1687752916,
            extraInfo: null
          },
          {
            gateway: '10030241',
            mapId: '1645334018633216001',
            groupId: '3',
            name: '原点',
            productName: 'gateway',
            systemId: '10990145',
            type: 'GatewayCar',
            status: 'Offline',
            ip: '61.194.146.44',
            fenceIds: null,
            setX: 1,
            setY: 4.1,
            setZ: 2.5,
            angle: 90.0,
            hisX: 0.0,
            hisY: -0.153228,
            hisZ: -10.4195,
            updateTime: 1687752920,
            extraInfo: null
          }
        ],
        stationList: [
          {
            gateway: '10030240',
            mapId: '1645334018633216001',
            groupId: '3',
            name: '中心',
            productName: 'gateway',
            systemId: '10990145',
            type: 'Gateway',
            status: 'Online',
            ip: '61.194.146.44',
            fenceIds: null,
            posX: 3.5,
            posY: 1.9,
            setZ: 2.5,
            angle: 90.0,
            hisX: 0.306456,
            hisY: -0.306456,
            hisZ: -9.65336,
            updateTime: 1687752916,
            extraInfo: null
          },
          {
            gateway: '10030240',
            mapId: '1645334018633216001',
            groupId: '3',
            name: '中心',
            productName: 'gateway',
            systemId: '10990145',
            type: 'Gateway',
            status: 'Online',
            ip: '61.194.146.44',
            fenceIds: null,
            posX: 3.62,
            posY: 1.9,
            setZ: 2.5,
            angle: 90.0,
            hisX: 0.306456,
            hisY: -0.306456,
            hisZ: -9.65336,
            updateTime: 1687752916,
            extraInfo: null
          },
          {
            gateway: '10030240',
            mapId: '1645334018633216001',
            groupId: '3',
            name: '中心',
            productName: 'gateway',
            systemId: '10990145',
            type: 'Gateway',
            status: 'Online',
            ip: '61.194.146.44',
            fenceIds: null,
            posX: 3.73,
            posY: 2.0,
            setZ: 2.5,
            angle: 90.0,
            hisX: 0.306456,
            hisY: -0.306456,
            hisZ: -9.65336,
            updateTime: 1687752916,
            extraInfo: null
          }
        ],

        fence: [
          {
            fenceId: '1656844789678571521',
            name: '充电站',
            mapId: '1645334018633216001',
            mapName: '3F-RoomC',
            type: 'Out',
            points: [
              {
                x: 2.509223090277778,
                y: 8.81618923611111
              },
              {
                x: 11.867947048611112,
                y: 8.81618923611111
              },
              {
                x: 9.494357638888888,
                y: 1.8310546875
              },
              {
                x: 2.848307291666667,
                y: 1.8988715277777763
              },
              {
                x: 2.509223090277778,
                y: 8.81618923611111
              }
            ],
            enabled: true
          },
          {
            fenceId: '1673196278525186049',
            name: '禁止进入',
            mapId: '1645334018633216001',
            mapName: '3F-RoomC',
            type: 'In',
            points: [
              {
                x: 18.64963107638889,
                y: 10.03689236111111
              },
              {
                x: 26.92328559027778,
                y: 10.172526041666666
              },
              {
                x: 26.92328559027778,
                y: 3.3908420138888893
              },
              {
                x: 18.717447916666668,
                y: 3.4586588541666656
              },
              {
                x: 18.64963107638889,
                y: 10.03689236111111
              }
            ],
            enabled: true
          }
        ]
      };
    },

    /**************************
     * 设置中心点
     **************************/
    mapSetCenter() {
      console.log('重置地图中心点');

      this.scene.setCenter(this.mapCenter);
    },

    mapResize() {
      this.mapSetCenter();
      // this.mapSetZoom();
    },

    /**************************
     * ========= 导航部分 =========
     **************************/

    // 外部：设置导航终点（例如点击地图 / 商品区域中心）
    navSetTarget(x, y) {
      this.nav.targetPos = [x, y];
      console.log('导航目标设置为：', this.nav.targetPos);
    },

    // 内部：根据 currentPos + targetPos 初始化路线
    navInitRoute() {
      const nav = this.nav;

      if (!this.currentPos || !nav.targetPos) {
        return false;
      }

      nav.startPos = [...this.currentPos];
      nav.fullRoute = [nav.startPos, nav.targetPos];
      nav.walkedRoute = [nav.startPos];
      nav.remainRoute = [nav.startPos, nav.targetPos];

      return true;
    },

    // 外部：开始导航
    navStart() {
      const nav = this.nav;

      if (!this.currentPos) {
        this.$Message && this.$Message.error('当前无定位，无法开始导航');
        return;
      }
      if (!nav.targetPos) {
        this.$Message && this.$Message.error('未设置导航目标');
        return;
      }

      if (!this.navInitRoute()) {
        this.$Message && this.$Message.error('导航路线上下文缺失');
        return;
      }

      nav.enabled = true;
      this.navDrawRoute();

      this.$Message && this.$Message.success('导航开始');
    },

    // 外部：取消导航
    navCancel() {
      const nav = this.nav;
      nav.enabled = false;
      nav.startPos = null;
      nav.targetPos = null;
      nav.fullRoute = [];
      nav.walkedRoute = [];
      nav.remainRoute = [];

      try {
        this.guijiClear && this.guijiClear();
      } catch (e) {}

      this.$Message && this.$Message.warning('导航已取消');
    },

    // 外部：暂停 / 继续
    navPause() {
      this.nav.enabled = false;
      this.$Message && this.$Message.info('导航已暂停');
    },

    navResume() {
      if (this.nav.targetPos && this.currentPos) {
        this.nav.enabled = true;
        this.$Message && this.$Message.info('继续导航');
      }
    },

    // 内部：绘制路线（已走 + 未走）
    navDrawRoute() {
      const nav = this.nav;

      // 已走路线
      this.guijiLineShow &&
        this.guijiLineShow({
          key: 'nav_walked',
          color: '#999999',
          size: 4,
          data: nav.walkedRoute
        });

      // 未走路线
      this.guijiLineShow &&
        this.guijiLineShow({
          key: 'nav_remain',
          color: '#0080FF',
          size: 6,
          data: nav.remainRoute
        });
    },

    // 内部：导航结束
    navFinish() {
      this.nav.enabled = false;
      this.$Message && this.$Message.success('已到达导航终点（≤10cm）');
      // 这里保留轨迹，不清除
    },

    // 内部：根据 BLE 实时位置推进导航（真实导航核心）
    navUpdateByBle(x, y) {
      this.currentPos = [x, y];

      const nav = this.nav;
      if (!nav.enabled) {
        return;
      }

      // 如果路线还没初始化，这里补一手
      if (!nav.startPos || !nav.fullRoute.length) {
        if (!this.navInitRoute()) return;
      }

      const target = nav.targetPos;
      if (!target) return;

      const dx = x - target[0];
      const dy = y - target[1];
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 10cm 判定（坐标单位为米）
      if (dist <= 0.1) {
        nav.walkedRoute.push([x, y]);
        nav.remainRoute = [[x, y], target];
        this.navDrawRoute();
        this.navFinish();
        return;
      }

      // 推进路线：追加当前点为“已走”
      nav.walkedRoute.push([x, y]);
      nav.remainRoute = [[x, y], target];

      this.navDrawRoute();
    }
  }
};
