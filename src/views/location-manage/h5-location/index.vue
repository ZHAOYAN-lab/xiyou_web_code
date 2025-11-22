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
    return {};
  },
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
  },
  activated() {},
  methods: {
    drawerToggle() {
      this.$refs.sideDrawer.show();
    },
    jizhanOnChange(value) {
      this.$refs.sll7.jizhanToggle(value);
    },
    xinbiaoOnChange(value) {
      this.l7.switch.jz = value;
      this.$refs.sll7.xinbiaoToggle(value);
    },
    weilanOnchange(value) {
      console.log('围栏：', value);

      this.l7.switch.wl = value;

      this.$refs.sll7.polygonLayerToggle(value);
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
