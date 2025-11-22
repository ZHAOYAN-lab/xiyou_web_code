<template>
  <div :class="classes" :style="styles" @click="back">
    <slot>
      <div :class="innerClasses">
        <i class="ivu-icon ivu-icon-ios-arrow-up"></i>
      </div>
    </slot>
  </div>
</template>
<script>
const prefixCls = 'ivu-back-top';

/**
 * @description 绑定事件 on(element, event, handler)
 */
const fnPubOn = (function () {
  if (document.addEventListener) {
    return function (element, event, handler) {
      if (element && event && handler) {
        element.addEventListener(event, handler, false);
      }
    };
  } else {
    return function (element, event, handler) {
      if (element && event && handler) {
        element.attachEvent('on' + event, handler);
      }
    };
  }
})();
/**
 * @description 解绑事件 off(element, event, handler)
 */
const fnPubOff = (function () {
  if (document.removeEventListener) {
    return function (element, event, handler) {
      if (element && event) {
        element.removeEventListener(event, handler, false);
      }
    };
  } else {
    return function (element, event, handler) {
      if (element && event) {
        element.detachEvent('on' + event, handler);
      }
    };
  }
})();
const fnPubScrollTop = (el, from = 0, to, duration = 500, endCallback) => {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame =
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        return window.setTimeout(callback, 1000 / 60);
      };
  }
  const difference = Math.abs(from - to);
  const step = Math.ceil((difference / duration) * 50);

  const scroll = (start, end, step) => {
    if (start === end) {
      endCallback && endCallback();
      return;
    }

    let d = start + step > end ? end : start + step;
    if (start > end) {
      d = start - step < end ? end : start - step;
    }

    if (el === window) {
      window.scrollTo(d, d);
    } else {
      el.scrollTop = d;
    }
    window.requestAnimationFrame(() => scroll(d, end, step));
  };
  scroll(from, to, step);
};

export default {
  name: 'SlBackTop',
  props: {
    height: {
      type: Number,
      default: 400
    },
    bottom: {
      type: Number,
      default: 30
    },
    right: {
      type: Number,
      default: 30
    },
    duration: {
      type: Number,
      default: 1000
    },
    container: {
      type: null,
      default: window
    }
  },
  data() {
    return {
      backTop: false
    };
  },
  computed: {
    classes() {
      return [
        `${prefixCls}`,
        {
          [`${prefixCls}-show`]: this.backTop
        }
      ];
    },
    styles() {
      return {
        bottom: `${this.bottom}px`,
        right: `${this.right}px`
      };
    },
    innerClasses() {
      return `${prefixCls}-inner`;
    },
    containerEle() {
      return this.container === window ? window : document.querySelector(this.container);
    }
  },
  mounted() {
    // window.addEventListener('scroll', this.handleScroll, false)
    // window.addEventListener('resize', this.handleScroll, false)
    fnPubOn(this.containerEle, 'scroll', this.handleScroll);
    fnPubOn(this.containerEle, 'resize', this.handleScroll);
  },
  beforeDestroy() {
    // window.removeEventListener('scroll', this.handleScroll, false)
    // window.removeEventListener('resize', this.handleScroll, false)
    fnPubOff(this.containerEle, 'scroll', this.handleScroll);
    fnPubOff(this.containerEle, 'resize', this.handleScroll);
  },
  methods: {
    handleScroll() {
      this.backTop = this.containerEle.scrollTop >= this.height;
    },
    back() {
      let target =
        typeof this.container === 'string'
          ? this.containerEle
          : document.documentElement || document.body;
      const sTop = target.scrollTop;
      fnPubScrollTop(this.containerEle, sTop, 0, this.duration);
      this.$emit('on-click');
    }
  }
};
</script>
