/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-07 11:40:06
 * @LastEditors: shenlan
 * @LastEditTime: 2023-07-27 15:45:34
 * @Description:  基站
 */

import { PointLayer, l7ConvertCMtoL, l7ConvertDataToWeb } from './l7';

// import l7IconStation from '@/assets/images/l7/number.svg';
import iconJizhan from '../image/jizhan.png';

export default {
  data() {
    return {
      jizhan: {
        source: [],
        layer: null,
        hasLayer: false, //是否画到页面数据
        switchValue: true
      }
    };
  },
  computed: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {
    // 画基站
    jizhanSetData(params) {
      let scene = this.scene;
      let layer = this.jizhan;

      layer.data = params.baseStationList || [];
      const show = typeof this.switchJizhan === 'boolean' ? this.switchJizhan : layer.switchValue;
      layer.switchValue = show;

      // 装载组件图片---type1
      if (!scene.hasImage('CL-GA25-P2')) {
        scene.addImage('CL-GA25-P2', iconJizhan);
      }

      // 处理数据  lng 经度  lat 纬度
      let source = layer.data.reduce((arr, item) => {
        // console.log(JSON.stringify(item, null, 2));

        const [lng, lat] = l7ConvertCMtoL(
          l7ConvertDataToWeb({
            mapMetersPerPixel: this.mapMetersPerPixel,
            mapOriginPixelX: this.mapOriginPixelX,
            mapOriginPixelY: this.mapOriginPixelY,
            x: item.baseStationX,
            y: item.baseStationY
          }),
          this.l7MapWidth
        );

        arr.push({ ...item, lng, lat });

        return arr;
      }, []);

      this.jizhanHandleSetData(source, show);
    },

    // 选中图标显示 详情
    jizhanHandleSetData(source, forceShow) {
      let scene = this.scene;
      let jizhan = this.jizhan;
      const show =
        typeof forceShow === 'boolean'
          ? forceShow
          : typeof this.switchJizhan === 'boolean'
          ? this.switchJizhan
          : jizhan.switchValue;
      jizhan.switchValue = show;

      if (jizhan.layer) {
        try {
          scene.removeLayer(jizhan.layer);
        } catch (e) {}
        jizhan.layer = null;
        jizhan.hasLayer = false;
      }

      if (!source || !source.length) {
        jizhan.source = source || [];
        return;
      }

      const imageLayer = new PointLayer({ zIndex: 3 })
        .source(source, {
          parser: { type: 'json', x: 'lng', y: 'lat' }
        })
        .shape('baseStationProduct', ['CL-GA25-P2'])
        .size(20);

      imageLayer.on('mousemove', (e) => {
        let onlineStatus = [this.$t('base.online'), this.$t('base.outline')];

        let status = e.feature.baseStationOnline ? onlineStatus[0] : onlineStatus[1];
        this.mapPopup.setLnglat(e.lngLat).setHTML(
          `<span>
                <p style="text-align: left;">mac:${e.feature.baseStationMac}</p>
                <p style="text-align: left;">type: ${e.feature.baseStationProduct}</p>
                <p style="text-align: left;">X:${e.feature.baseStationX}</p>
                <p style="text-align: left;">Y:${e.feature.baseStationY}</p>
                <p style="text-align: left;">online:${status}</p>
              </span>`
        );
        scene.addPopup(this.mapPopup);
      });

      imageLayer.on('mouseout', () => {
        this.mapPopup.hide();
      });

      jizhan.layer = imageLayer;
      jizhan.source = source;

      // console.log('基站开关:', this.switchJizhan);

      if (show) {
        scene.addLayer(imageLayer);
        jizhan.hasLayer = true;
      }
    },

    // 隐藏/显示  基站
    jizhanToggle(value) {
      let jizhan = this.jizhan;
      jizhan.switchValue = value;

      if (value) {
        if (jizhan.source && jizhan.source.length) {
          this.$nextTick(() => {
            this.jizhanHandleSetData(jizhan.source, true);
          });
        }
      } else {
        if (jizhan.layer) {
          try {
            this.scene.removeLayer(jizhan.layer);
          } catch (e) {}
          jizhan.layer = null;
        }
        jizhan.hasLayer = false;
      }
    }
  }
};
