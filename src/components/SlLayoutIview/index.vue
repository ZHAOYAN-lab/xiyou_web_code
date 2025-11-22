<template>
  <div class="sl-app-main">
    <div class="sl-app-main-content">
      <header-bar></header-bar>

      <div class="sl-app-main-content-layout">
        <side-bar :collapsed="collapsed" @on-collapsed-change="handleCollapsedChange"> </side-bar>
        <div class="main">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SideBar from './components/SideBar';
import HeaderBar from './components/HeaderBar';
import { mapState } from 'vuex';

export default {
  components: { SideBar, HeaderBar },
  mixins: [],
  data() {
    return {};
  },
  computed: mapState({
    collapsed: (state) => state.app.collapsed
  }),
  watch: {},
  beforeCreate() {},
  created() {},
  beforeMount() {},
  beforeUpdate() {},
  updated() {},
  beforeDestroy() {},
  destroyed() {},
  activated() {},
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {
    handleCollapsedChange(state) {
      // this.collapsed = state;
      this.$store.commit('setCollapsed', state);
    }
  }
};
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>
