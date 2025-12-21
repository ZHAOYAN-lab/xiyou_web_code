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
    id: { type: String, default: 'l7-map-default' },
    fullscreen: { type: Boolean, default: true },
    switchJizhan: { type: Boolean, default: true },
    switchWeilan: { type: Boolean, default: true }
  },

  mounted() {
    this.$nextTick(() => {
      /** ★★★★★ 最关键：把 Vue 实例挂到 DOM 上 ★★★★★ */
      this.$el.__vue__ = this;

      /** ★★★★★ 地图初始化 ★★★★★ */
      this.initL7();
    });
  },

  methods: {
    /* ---------------------------------------------------------
     * 初始化 L7 地图
     * --------------------------------------------------------- */
    initL7() {
      this.mapInit().then(() => {
        // 通知外部页面已经 ready
        this.$emit("ready");

        // 初始化图层开关
        this.jizhanToggle(this.switchJizhan);
        this.polygonLayerToggle(this.switchWeilan);
      });
    },

    /* ---------------------------------------------------------
     * 外部页面调用导航 API（全部走 mixin.map）
     * --------------------------------------------------------- */

    /** 开始固定路线导航：自动选上下路线 */
    navStartFixed() {
      const fn = this.$options.mixins[0].methods.navStartFixed;
      if (typeof fn === "function") return fn.call(this);
    },

    /** 普通开始导航（如果 map.js 实现了的话） */
    navStart() {
      const fn = this.$options.mixins[0].methods.navStart;
      if (typeof fn === "function") return fn.call(this);
    },

    /** 取消导航（兼容你旧逻辑） */
    navCancel() {
      const fn = this.$options.mixins[0].methods.navCancel;
      if (typeof fn === "function") return fn.call(this);
    },

    /** ★★★ 手动“已到达”按钮调用 ★★★ */
    navArrived() {
      const fn = this.$options.mixins[0].methods.navArrived;
      if (typeof fn === "function") return fn.call(this);
    },

    /* =========================================================
     * ✅ 新增：显示任务区域（转发给 map mixin）
     * ========================================================= */
    showTaskArea(area) {
      const fn = this.$options.mixins[0].methods.showTaskArea;
      if (typeof fn === "function") {
        return fn.call(this, area);
      } else {
        console.warn('[SlL7] showTaskArea 未在 map mixin 中实现');
      }
    }
  }
};
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>
