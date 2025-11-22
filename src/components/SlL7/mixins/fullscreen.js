import VueFullscreen from 'vue-fullscreen';
import Vue from 'vue';
Vue.use(VueFullscreen);

export default {
  data() {
    return {
      mixinFullscreen: false
    };
  },
  computed: {},
  beforeDestroy() {},
  watch: {
    mixinFullscreen: function (newValue) {
      console.log('newValue:', newValue);

      this.mixinHandleFullscreeChange();
    }
  },
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {
    mixinFullscreenMethod() {
      this.mixinFullscreen = !this.mixinFullscreen;
    },
    mixinHandleFullscreeChange() {
      console.log('1');

      this.$nextTick(() => {
        this.mapResize();
        setTimeout(() => {
          this.scene.removeLayer(this.l7ImageMap);
          this.scene.addLayer(this.l7ImageMap);
        }, 200);
      });
    }
  }
};
