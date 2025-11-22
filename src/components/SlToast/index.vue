<template>
  <transition name="toast" @after-leave="onAfterLeave">
    <div v-if="isShow" class="sl-toast">
      <div class="sl-toast-overlay" :class="{ 'overlay-transparent': overlay }"></div>

      <div class="sl-toast-main">
        <div v-if="toastType === 1" class="ignore-toast sl-toast-msg">
          {{ message }}
        </div>
        <div v-if="toastType === 2" class="ignore-toast sl-toast-success">
          <i></i>
          <div v-if="message">
            {{ message }}
          </div>
        </div>
        <div v-if="toastType === 3" class="ignore-toast sl-toast-fail">
          <i></i>
          <div v-if="message">
            {{ message }}
          </div>
        </div>
        <div v-if="toastType === 4" class="ignore-toast sl-toast-loading">
          <!-- circular -->
          <span v-if="loadingType" class="sl-loading-circular">
            <svg viewBox="25 25 50 50" class="loading-circular">
              <circle cx="50" cy="50" r="20" fill="none"></circle>
            </svg>
          </span>

          <!-- spinner -->
          <span v-else class="sl-loading-spinner">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </span>

          <p>{{ message }}</p>
        </div>
      </div>
    </div>
  </transition>
</template>
<script>
export default {
  name: 'SlToast',
  components: {},
  props: {},
  data() {
    return {
      //显示文案
      message: '',
      // 展示时长(ms)
      duration: 2000,
      // 遮罩透明
      overlay: true,
      loadingType: 0,
      hide: () => {},

      timer: null,
      // 弹窗显隐控制
      isShow: false,
      // 展示类型
      toastType: 1 //1 只展示文案 2 成功 3 失败 4 loading
    };
  },

  beforeDestroy() {
    this.clearTimer();
  },
  mounted: function () {},
  methods: {
    // 显示弹窗方法
    show() {
      this.clearTimer();

      this.isShow = true;
      if (this.duration >= 0) {
        this.timer = setTimeout(() => {
          this.isShow = false;
        }, this.duration);
      }
    },
    // 只展示 文案
    msg() {
      this.toastType = 1;
      this.show();
    },
    // 成功
    success() {
      this.toastType = 2;
      this.show();
    },
    // 失败
    fail() {
      this.toastType = 3;
      this.show();
    },
    // loading
    loading(msg) {
      this.toastType = 4;
      this.isShow = true;

      if (msg) {
        this.message = msg;
      }
    },
    // 关闭
    close() {
      this.onAfterLeave();
    },
    clearTimer() {
      clearTimeout(this.timer);
    },
    // 弹窗关闭后等动画结束再调用卸载逻辑
    onAfterLeave() {
      // console.log('卸载');

      this.$destroy(true);
      this.$el.parentNode.removeChild(this.$el);
      this.hide();
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
