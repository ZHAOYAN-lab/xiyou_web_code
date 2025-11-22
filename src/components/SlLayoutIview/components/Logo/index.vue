<template>
  <div class="main-logo">
    <div v-show="!collapsed" class="sys-name">系统名称</div>
    <img v-show="collapsed" key="min-logo" :src="minLogo" />
  </div>
</template>
<script>
export default {
  props: {
    collapsed: Boolean
  },
  data() {
    return {
      minLogo: require('@/assets/images/logo_min.png')
    };
  },
  computed: {},
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {}
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
