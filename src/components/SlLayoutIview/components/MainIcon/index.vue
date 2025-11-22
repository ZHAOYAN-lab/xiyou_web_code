<template>
  <div class="main-icon">
    <Icon :type="type" :color="color" :size="size" />
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'MainIcon',
  props: {
    // 样式
    type: {
      type: String,
      required: true
    },
    // 颜色
    color: {
      type: String,
      default: ''
    },
    // 大小
    size: {
      type: Number,
      default: 20
    }
  },
  data() {
    return {};
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
