<template>
  <div id="app">
    <router-view v-if="isRouterAlive"></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {},
  provide() {
    return {
      reload: this.reload
    };
  },
  data() {
    return {
      isRouterAlive: true
    };
  },
  mounted() {
    // 解决 路由hash模式下页面不刷新的问题
    window.addEventListener(
      'hashchange',
      () => {
        let currentPath = window.location.hash.slice(1);
        if (this.$route.path !== currentPath) {
          this.$router.push(currentPath);
        }
      },
      false
    );

    this.$nextTick(() => {
      if (!this.mixinIsZHCN) {
        document.getElementsByTagName('body')[0].classList.add('body-ja-jp'); //与第一个等价
      }
    });
  },
  methods: {
    reload() {
      this.isRouterAlive = false;
      this.$nextTick(function () {
        this.isRouterAlive = true;
      });
    }
  }
};
</script>

<style lang="less">
.size {
  width: 100%;
  height: 100%;
  background: transparent;
}
html,
body {
  .size;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
#app {
  .size;
  overflow: hidden;
}
</style>
