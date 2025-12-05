<template>
  <div class="mobile-nav-container">

    <!-- 楼层选择 -->
    <div style="width:300px;margin-bottom:10px;">
      <sl-map-cascader ref="mapCascader" @onChange="mapOnChange" />
    </div>

    <!-- 地图 -->
    <div class="map-wrapper">
      <sl-l7 v-if="slMapShow"
             id="mobile-nav-map"
             ref="sll7"
             :fullscreen="false"/>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-btns">
      <Button type="primary" long @click="startNav">开始导航</Button>
      <Button type="warning" long style="margin-top:10px;" @click="pauseNav">
        {{ paused ? "继续导航" : "暂停导航" }}
      </Button>
      <Button type="error" long style="margin-top:10px;" @click="cancelNav">取消导航</Button>
    </div>

  </div>
</template>

<script>
import mqttMixin from '@/components/SlL7/mixins/mqtt';
import {
  l7ConvertCMtoL,
  l7ConvertDataToWeb
} from '@/components/SlL7/mixins/l7.js';

export default {
  name: 'MobileNavigation',

  mixins: [mqttMixin],  // ★ MQTT 自动接收实时位置

  data() {
    return {
      mapId: null,
      slMapShow: false,

      startPos: null,
      currentPos: null,
      targetPos: null,

      fullRoute: [],
      remainRoute: [],
      walkedRoute: [],

      paused: false,

      myName: null,        // ★ 当前登录用户名
      myTask: null,        // ★ 当前派发给我的任务
      targetAreaPoints: null
    };
  },

  mounted() {
    this.myName = this.$store.state.user.userName;
    this.autoLoadMyTask();
  },

  methods: {
    /* =================== 获取派发给我的任务 =================== */
    autoLoadMyTask() {
      this.$api.taskGetMyTask({
        params: { objectName: this.myName }
      }).then(res => {
        if (!res || !res.data) {
          this.$Message.error("当前没有派发的任务");
          return;
        }

        this.myTask = res.data;
        this.mapId = res.data.mapId;
        this.targetAreaPoints = res.data.areaPoints;
        this.targetPos = res.data.areaCenter;

        this.$refs.mapCascader.setValue([this.mapId]);
        this.loadMap();
      });
    },

    /* =================== 地图选择 =================== */
    mapOnChange(mapId) {
      if (Array.isArray(mapId)) {
        this.mapId = mapId[mapId.length - 1];
      } else {
        this.mapId = mapId;
      }
      this.loadMap();
    },

    /* =================== 加载地图 =================== */
    loadMap() {
      if (!this.mapId) return;

      this.slMapShow = false;

      this.$nextTick(() => {
        this.slMapShow = true;

        this.$nextTick(() => {
          this.$api.pubGetMapDetailByMapId({
            data: { mapId: this.mapId }
          }).then(res => {
            const detail = res.detail || res;
            const sll7 = this.$refs.sll7;

            sll7.mapInit().then(() => {
              sll7.mapSetBackgroundImage(detail);

              // 绘制区域 polygon
              if (this.targetAreaPoints) {
                this.drawTargetPolygon();
              }

              // 自动开始导航
              if (this.targetPos) {
                this.startNav();
              }
            });
          });
        });
      });
    },

    /* =================== 绘制商品区域 =================== */
    drawTargetPolygon() {
      this.$refs.sll7.polygonLayerSetData([
        { points: this.targetAreaPoints, type: 2 }
      ]);
    },

    /* =================== 开始导航 =================== */
    startNav() {
      if (!this.targetPos) {
        this.$Message.error("没有导航目标");
        return;
      }

      if (!this.currentPos) {
        this.$Message.error("等待定位中...");
        return;
      }

      this.startPos = [...this.currentPos];

      this.fullRoute = [this.startPos, this.targetPos];
      this.walkedRoute = [];
      this.remainRoute = [...this.fullRoute];

      this.drawRoute();
      this.$Message.success("导航开始");
    },

    /* =================== MQTT 实时位置 =================== */
    xinbiaoSmoothUpdate(obj) {
      if (!obj || obj.location_object_name !== this.myName) return;

      this.currentPos = [obj.lng, obj.lat];

      if (!this.startPos || !this.targetPos || this.paused) return;

      this.walkedRoute.push(this.currentPos);
      this.remainRoute[0] = this.currentPos;

      this.drawRoute();
      this.checkArrived();
    },

    /* =================== 到达判定 =================== */
    checkArrived() {
      const dx = this.currentPos[0] - this.targetPos[0];
      const dy = this.currentPos[1] - this.targetPos[1];
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.1) {
        this.$Message.success("到达终点（10 cm）");
        this.cancelNav();
      }
    },

    /* =================== 绘制路线 =================== */
    drawRoute() {
      const sll7 = this.$refs.sll7;

      sll7.guijiLineShow({
        key: "walked",
        color: "#999999",
        size: 4,
        data: this.walkedRoute
      });

      sll7.guijiLineShow({
        key: "remain",
        color: "#0080FF",
        size: 6,
        data: this.remainRoute
      });
    },

    pauseNav() {
      this.paused = !this.paused;
      this.$Message.info(this.paused ? "已暂停" : "继续导航");
    },

    cancelNav() {
      this.startPos = null;
      this.currentPos = null;
      this.targetPos = null;

      this.fullRoute = [];
      this.walkedRoute = [];
      this.remainRoute = [];

      try { this.$refs.sll7.guijiClear(); } catch {}

      this.$Message.warning("导航已取消");
    }
  }
};
</script>

<style scoped>
.mobile-nav-container {
  padding: 20px;
}

.map-wrapper {
  height: 600px;
  border: 1px solid #ddd;
  margin-top: 10px;
}

.bottom-btns {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 20px;
  padding: 0 20px;
}
</style>
