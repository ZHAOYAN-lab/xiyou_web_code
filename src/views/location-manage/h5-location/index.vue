<template>
  <div class="sl-main">
    <header-bar @drawerToggle="drawerToggle"></header-bar>

    <div class="for-map">
      <Card :bordered="false" class="map-card" dis-hover>
        <sl-l7
          v-if="l7.show"
          ref="sll7"
          :switch-jizhan="l7.switch.jz"
          :switch-weilan="l7.switch.wl"
        />
      </Card>
    </div>

    <!-- =========================
      ★★★ 导航按钮区（新增已到达按钮）★★★
    ============================-->
    <div class="nav-btn-box">

      <!-- 开始导航 -->
      <Button type="primary" @click="handleStartNav">
        开始导航（固定路线）
      </Button>

      <!-- 已到达按钮（导航时才显示） -->
      <Button
        v-if="nav.enabled"
        type="success"
        style="margin-left: 12px"
        @click="handleArrived"
      >
        已到达
      </Button>

    </div>

    <side-drawer
      ref="sideDrawer"
      @jizhan="jizhanOnChange"
      @xinbiao="xinbiaoOnChange"
      @weilan="weilanOnchange"
      @mapCascaderOnChange="mapCascaderOnChange"
    />
  </div>
</template>

<script>
import HeaderBar from './components/HeaderBar';
import l7 from './mixins/l7';
import SideDrawer from './components/SideDrawer';

export default {
  components: { HeaderBar, SideDrawer },
  mixins: [l7],
  inject: ['reload'],

  data() {
    return {
      // 用于控制“已到达”按钮显示
      nav: {
        enabled: false
      }
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.l7.show = true;     // ★ 必须
    });
  },

  methods: {
    drawerToggle() {
      this.$refs.sideDrawer.show();
    },

    // 基站开关
    jizhanOnChange(value) {
      this.$refs.sll7.jizhanToggle(value);
    },

    // 信标开关
    xinbiaoOnChange(value) {
      this.l7.switch.jz = value;
      this.$refs.sll7.xinbiaoToggle(value);
    },

    // 围栏开关
    weilanOnchange(value) {
      this.l7.switch.wl = value;
      this.$refs.sll7.polygonLayerToggle(value);
    },

    /* ===============================
     * ★ 开始导航（固定路线）
     * =============================== */
    handleStartNav() {
      if (!this.$refs.sll7) {
        this.$Message.error('地图尚未初始化');
        return;
      }

      this.$refs.sll7.navStartFixed();  // 调用 map.js 的导航函数
      this.nav.enabled = true;         // 前端控制显示“已到达”
    },

    /* ===============================
     * ★★ 新增：已到达按钮调用 ★★
     * =============================== */
    handleArrived() {
      if (!this.$refs.sll7) return;

      this.$refs.sll7.navArrived();  // 调用地图内部清除导航
      this.nav.enabled = false;      // 隐藏“已到达”
    }
  }
};
</script>

<style lang="less" scoped>
@import url('./index.less');

/* 导航按钮区域布局 */
.nav-btn-box {
  width: 100%;
  padding: 14px;
  display: flex;
  justify-content: center;
  position: fixed;
  bottom: 20px;
  left: 0;
  z-index: 999;
}
</style>
