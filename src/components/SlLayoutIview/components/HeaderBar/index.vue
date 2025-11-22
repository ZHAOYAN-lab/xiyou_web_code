<template>
  <div class="main-header-bar">
    <div class="h-left">
      <span class="logo" />
      <span class="name">{{ $t('base.systemName') }}</span>
    </div>
    <div class="h-right">
      <div class="date-time">{{ mixinHeader.dateTime }}</div>
      <div class="language">
        <sl-language />
      </div>
      <div class="user">
        <Dropdown @on-click="logoutMethod">
          <p class="p-user">
            <span class="icon"> </span>
            <span class="user-name">{{ userInfo.userName }}</span>
            <span class="arrow"></span>
          </p>
          <DropdownMenu slot="list">
            <DropdownItem>
              <span>{{ $t('header.logout') }}</span>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  </div>
</template>

<script>
import mixinHeader from '@/mixins/mixin-header';
export default {
  components: {},
  mixins: [mixinHeader],
  inject: ['reload'],
  props: {
    collapsed: Boolean
  },
  data() {
    return {};
  },
  computed: {
    userInfo() {
      return this.$store.state.userInfo.userMsg;
    }
  },
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
