<template>
  <div class="header-bar">
    <div class="h-left" @click="drawerToggle">
      <span class="logo" />
      <span class="name">{{ $t('base.systemName') }}</span>
    </div>

    <div class="h-right">
      <sl-language />
    </div>
  </div>
</template>
<script>
export default {
  name: 'HeaderBar',
  props: {},
  data() {
    return {};
  },
  computed: {},
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {
    drawerToggle() {
      this.$emit('drawerToggle');
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
