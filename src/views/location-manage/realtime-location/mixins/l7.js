export default {
  data() {
    return {
      l7: {
        // 显示隐藏开关
        switch: {
          jz: true,
          xb: true,
          wl: false
        },

        show: false
      }
    };
  },
  computed: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
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

            sll7.mapSetBackgroundImage(data);
            // 基站
            sll7.jizhanSetData(data);
            //围栏(不可编辑)
            this.fenceManageGetDataByMapId();
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
        .fenceManageGetDataByMapId({ data: { mapId: this.$refs.mapCascader.getValue()[2] } })
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

    // 隐藏/显示 基站
    l7MapToggleJiZhanLayer(value) {
      this.$refs.sll7.jizhanToggle(value);
    },

    // 隐藏/显示 信标
    l7MapToggleXinBiaoLayer(value) {
      this.$refs.sll7.xinbiaoToggle(value);
    },

    // 隐藏/显示 围栏
    l7MapTogglePolygonLayer(value) {
      this.$refs.sll7.polygonLayerToggle(value);
    }
  }
};
