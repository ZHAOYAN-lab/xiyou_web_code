/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-07 11:40:06
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-27 16:00:53
 * @Description:  信标 - 优化版（平滑移动）
 */

import { PointLayer, l7ConvertCMtoL, l7ConvertDataToWeb } from './l7';

import mixin_config from '@/mixins/mixin-config';

import iconCheliang from '../image/cheliang.png';
import iconRenyuan from '../image/renyuan.png';
import iconWupin from '../image/wupin.png';
import iconShebei from '../image/shebei.png';

export default {
  mixins: [mixin_config],
  data() {
    return {
      xinbiao: {
        // 是否显示
        switchValue: true,

        // 原始基础数据
        data: [],

        // 处理后缓存数据
        list: {
          source: null,
          layer: []
        },

        // 信标图片数组
        image: [
          {
            name: 'cheliang',
            url: iconCheliang
          },
          {
            name: 'renyuan',
            url: iconRenyuan
          },
          {
            name: 'wupin',
            url: iconWupin
          },
          {
            name: 'shebei',
            url: iconShebei
          }
        ],

        // 新增：动画配置
        animation: {
          duration: 1000, // fallback duration (ms) when interval is unknown
          useEasing: false, // true: easeOutCubic, false: linear follow
          timers: {}, // per-beacon animation frame id
          positions: {}, // per-beacon latest position
          lastUpdateAt: {} // per-beacon last update time
        }
      }
    };
  },
  computed: {},
  beforeDestroy() {
    // 清理所有动画定时器
    this.xinbiaoClearAllAnimations();
  },
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {
    // 清理所有动画
    xinbiaoClearAllAnimations() {
      const timers = this.xinbiao.animation.timers;
      Object.keys(timers).forEach(key => {
        if (timers[key]) {
          cancelAnimationFrame(timers[key]);
        }
      });
      this.xinbiao.animation.timers = {};
      this.xinbiao.animation.positions = {};
      this.xinbiao.animation.lastUpdateAt = {};
    },

    // 线性插值函数
    lerp(start, end, progress) {
      return start + (end - start) * progress;
    },

    // 缓动函数（ease-out）
    easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    },

    // 平滑更新信标位置
    xinbiaoSmoothUpdate(beaconId, layer, fromPos, toPos) {
      const now = (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now();
      const lastAt = this.xinbiao.animation.lastUpdateAt[beaconId];
      this.xinbiao.animation.lastUpdateAt[beaconId] = now;

      const duration = Math.max(
        0,
        lastAt ? (now - lastAt) : this.xinbiao.animation.duration
      );
      const startPos = this.xinbiao.animation.positions[beaconId] || fromPos;

      const setLayerPos = (lng, lat) => {
        layer.setData([{
          ...toPos.feature,
          lng,
          lat
        }]);
        // keep latest position for follow updates
        this.xinbiao.animation.positions[beaconId] = { lng, lat };
      };

      if (duration == 0) {
        setLayerPos(toPos.lng, toPos.lat);
        return;
      }

      const startTime = now;

      const animate = (ts) => {
        const currentTime = (typeof ts === 'number')
          ? ts
          : ((typeof performance !== 'undefined' && performance.now)
            ? performance.now()
            : Date.now());
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.xinbiao.animation.useEasing
          ? this.easeOutCubic(progress)
          : progress;

        const currentLng = this.lerp(startPos.lng, toPos.lng, eased);
        const currentLat = this.lerp(startPos.lat, toPos.lat, eased);

        setLayerPos(currentLng, currentLat);

        if (progress < 1) {
          this.xinbiao.animation.timers[beaconId] = requestAnimationFrame(animate);
        } else {
          delete this.xinbiao.animation.timers[beaconId];
        }
      };

      // cancel previous animation frame to prevent lag
      if (this.xinbiao.animation.timers[beaconId]) {
        cancelAnimationFrame(this.xinbiao.animation.timers[beaconId]);
      }

      animate(now);
    },

    // 画信标
    xinbiaoSetData(params) {
      let scene = this.scene;
      let layer = this.xinbiao;
      let imageArr = layer.image;
      let list = layer.list;

      layer.data = params.data;

      // 处理数据  lng 经度  lat 纬度
      let source = layer.data.reduce((arr, item) => {
        let obj = item.beaconLocationObject;
        if (obj.locationObjectImgViewUrl) {
          let inImageArr = imageArr.reduce(
            (dic, ele) => {
              if (ele.url === obj.locationObjectImgViewUrl) {
                dic.flag = true;
                dic.type = ele.name;
              }
              return dic;
            },
            { flag: false, type: '' }
          );

          if (inImageArr.flag) {
            item.name = inImageArr.type;
          } else {
            let type = `${obj.locationObjectId}tt`;
            item.name = type;
            imageArr.push({
              name: type,
              url: obj.locationObjectImgViewUrl
            });
          }
        } else {
          switch (item.beaconType) {
            case 1:
              item.name = 'renyuan';
              break;
            case 2:
              item.name = 'wupin';
              break;
            case 3:
              item.name = 'shebei';
              break;
            case 4:
              item.name = 'cheliang';
              break;
          }
        }

        const [lng, lat] = l7ConvertCMtoL(
          l7ConvertDataToWeb({
            mapMetersPerPixel: this.mapMetersPerPixel,
            mapOriginPixelX: this.mapOriginPixelX,
            mapOriginPixelY: this.mapOriginPixelY,
            x: item.beaconX,
            y: item.beaconY
          }),
          this.l7MapWidth
        );

        arr.push({ ...item, lng, lat });
        return arr;
      }, []);

      imageArr.forEach((item) => {
        let type = item.name;
        if (!scene.hasImage(type)) {
          scene.addImage(type, item.url);
        }
      });

      // 更新或创建图层
      source.forEach((item) => {
  const beaconId = item.beaconMac || item.beaconId;
  const existingLayerIndex = list.layer.findIndex(
    l => l._beaconId === beaconId
  );

  if (existingLayerIndex >= 0) {
    // 已存在的信标，执行平滑移动
    const existingLayer = list.layer[existingLayerIndex];
    const oldPos = this.xinbiao.animation.positions[beaconId] || {
      lng: item.lng,
      lat: item.lat
    };

    this.xinbiaoSmoothUpdate(
      beaconId,
      existingLayer,
      oldPos,
      { lng: item.lng, lat: item.lat, feature: item }
    );
  } else {
    // 新信标，直接创建
    this.xinbiaoHandleSetData(item);
    this.xinbiao.animation.positions[beaconId] = {
      lng: item.lng,
      lat: item.lat
    };
  }

  // =============== 新增：实时导航同步 ===============  
  try {
    // 判断是否为你的手机 beacon（你需确认 beaconType）
    if (item.beaconType === 3) {
      const x = Number(item.beaconX);
      const y = Number(item.beaconY);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        this.navUpdateByBle(x, y);
      }
    }
  } catch (e) {}
  // ==================================================
});


      // 移除不存在的信标
      const currentBeaconIds = source.map(s => s.beaconMac || s.beaconId);
      list.layer = list.layer.filter((layer, index) => {
        if (!currentBeaconIds.includes(layer._beaconId)) {
          scene.removeLayer(layer);
          delete this.xinbiao.animation.positions[layer._beaconId];
          delete this.xinbiao.animation.timers[layer._beaconId];
          delete this.xinbiao.animation.lastUpdateAt[layer._beaconId];
          return false;
        }
        return true;
      });

      this.xinbiao.list.source = source;
    },

    // 选中图标显示 详情
    xinbiaoHandleSetData(source) {
      let scene = this.scene;
      const beaconId = source.beaconMac || source.beaconId;

      const imageLayer = new PointLayer({ zIndex: 3 })
        .source([source], {
          parser: { type: 'json', x: 'lng', y: 'lat' }
        })
        .shape(source.name)
        .size(20);

      // 标记图层ID，用于后续更新
      imageLayer._beaconId = beaconId;

      imageLayer.on('mousemove', (e) => {
        let objectType = this.mixinConfig.BEACON_AND_LOCATION_OBJECT_TYPE;
        let type = [...objectType.data, objectType.none].reduce((str, ele) => {
          if (ele.value === e.feature.beaconType) {
            str = ele.label;
          }
          return str;
        }, '');

        this.mapPopup.setLnglat(e.lngLat).setHTML(
          `<span>
                <p style="text-align: left;">mac:${e.feature.beaconMac}</p>
                <p style="text-align: left;">type: ${type}</p>
                <p style="text-align: left;">X:${e.feature.beaconX}</p>
                <p style="text-align: left;">Y:${e.feature.beaconY}</p>
              </span>`
        );
        scene.addPopup(this.mapPopup);
      });

      imageLayer.on('mouseout', () => {
        this.mapPopup.hide();
      });

      this.xinbiao.list.layer.push(imageLayer);

      if (this.xinbiao.switchValue) {
        scene.addLayer(imageLayer);
      }
    },

    // 隐藏/显示  信标
    xinbiaoToggle(value) {
      let scene = this.scene;
      let xinbiao = this.xinbiao;
      let list = xinbiao.list;

      xinbiao.switchValue = value;

      if (value) {
        if (list.layer.length) {
          list.layer.forEach((item) => {
            try {
              scene.removeLayer(item);
            } catch (e) {}
          });
          list.layer = [];
        }

        if (list.source && list.source.length) {
          this.xinbiaoSetData({ data: list.source });
        }
      } else {
        if (list.layer.length) {
          list.layer.forEach((item) => {
            scene.removeLayer(item);
          });
          list.layer = [];
        }
      }
    }
  }
};
