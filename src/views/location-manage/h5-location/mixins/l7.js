const USER_BEACON_MAC_MAP = {
  worker2: '43544d415678'
};

export default {
  data() {
    return {
      l7: {
        show: false,
        // 显示隐藏开关
        switch: {
          jz: false,
          xb: true,
          wl: false
        }
      }
    };
  },
  computed: {},
  beforeDestroy() {},
  mounted() {
    // this.$nextTick(() => {
    //   if (this.l7.mqtt) {
    //     this.$refs.sll7.createConnection();
    //     this.l7.mqtt = false;
    //   }
    // });
  },
  methods: {
    mapCascaderOnsetData() {
      let mapCascader = this.$refs.mapCascader;
      let a = mapCascader.getFirstUseMap();

      if (a[2]) {
        let mapId = a[2];
        mapCascader.setValue(mapId);

        this.mapCascaderOnChange(mapId);
      }
    },

    // 切换地图
    mapCascaderOnChange(value) {
      this.$api
        .pubGetMapDetailByMapId({
          data: {
            mapId: value
          }
        })
        .then((res) => {
          this.sll7Init(res);
        });
    },
    sll7Init(data) {
      let l7 = this.l7;
      l7.show = false;
      this.$nextTick(() => {
        l7.show = true;
        this.$nextTick(() => {
          let sll7 = this.$refs.sll7;
          sll7.mapInit().then(() => {
            console.log('获取数据后渲染');

            // 底图
            sll7.mapSetBackgroundImage(data);
            // 基站（H5 默认不显示）
            if (this.l7.switch.jz) {
              sll7.jizhanSetData(data);
            }
            //围栏(不可编辑)
            this.fenceManageGetDataByMapId();

            this.bindSelfMqttHandler(sll7);
            sll7.createConnection();
            setTimeout(() => {
              // mqtt
              sll7.handleSubscribe(data.mapId);
            }, 1000);
          });
        });
      });
    },

    // 按照地图ID查找围栏
    fenceManageGetDataByMapId() {
      // console.log('根据地图id获取围栏信息');

      this.$api
        .fenceManageGetDataByMapId({ data: { mapId: this.$refs.sideDrawer.getCascaderValue() } })
        .then((res) => {
          //围栏(不可编辑)
          this.$refs.sll7.polygonLayerSetData(
            res.reduce((arr, ele) => {
              arr.push({
                fenceId: ele.fenceId,
                fenceName: ele.fenceName,
                points: ele.fenceContent,
                type: ele.fenceType
              });
              return arr;
            }, [])
          );
        });
    },

    bindSelfMqttHandler(sll7) {
      if (!sll7) return;

      const handler = (payload) => {
        const filtered = this.filterSelfMqttPayload(payload);
        if (filtered) {
          sll7.xinbiaoSetData(filtered);
        }
      };

      sll7.mqttOnMessage = this.$pub?.slThrottle
        ? this.$pub.slThrottle(handler, 1000)
        : handler;
    },

    filterSelfMqttPayload(payload) {
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      const mac = this.getSelfBeaconMac();

      if (!mac) {
        return { data: list };
      }

      const target = this.normalizeMac(mac);
      return {
        data: list.filter((item) => {
          const itemMac = item?.beaconMac || item?.beacon_mac || item?.mac;
          if (!itemMac) return false;
          return this.normalizeMac(itemMac) === target;
        })
      };
    },

    normalizeMac(value) {
      if (!value) return '';
      return String(value)
        .toLowerCase()
        .replace(/[^0-9a-f]/g, '');
    },

    getSelfBeaconMac() {
      const user = this.$store?.state?.userInfo?.userMsg || {};
      const task = this.currentTask || {};
      const username = user.userName || user.username || '';
      return (
        USER_BEACON_MAC_MAP[username] ||
        user.beaconMac ||
        user.beacon_mac ||
        task.beaconMac ||
        task.beacon_mac ||
        ''
      );
    }
  }
};
