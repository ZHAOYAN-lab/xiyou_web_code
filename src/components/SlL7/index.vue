<template>
  <div class="sl-com-l7">
    <fullscreen v-model="mixinFullscreen" class="l7-full">
      <div :id="id" ref="l7Map" class="l7-map">
        <span
          v-if="fullscreen"
          class="span-full"
          :class="{ selected: mixinFullscreen }"
          @click="mixinFullscreenMethod"
        ></span>
      </div>
    </fullscreen>
  </div>
</template>
<script>
import fullscreen from './mixins/fullscreen';
import map from './mixins/map';
export default {
  name: 'SlL7',
  mixins: [map, fullscreen],
  props: {
    id: {
      type: String,
      default: 'l7-map-default'
    },
    fullscreen: {
      type: Boolean,
      default: true
    },

    switchJizhan: {
      type: Boolean,
      default: true
    },
    switchWeilan: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {};
  },
  computed: {},
  watch: {},
  beforeDestroy() {
    console.log('sll7组件销毁');
  },
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {}
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
