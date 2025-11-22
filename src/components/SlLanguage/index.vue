<template>
  <div class="sl-language">
    <Dropdown transfer transfer-class-name="language-dropdown" @on-click="changeLanguage">
      <p class="l-p" :class="{ jp: isJP }"></p>
      <DropdownMenu slot="list">
        <DropdownItem v-for="(item, index) in language" :key="index" :name="item.lang">
          <p class="l-detail">
            <span>{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </p>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  </div>
</template>
<script>
import { catchLanguage } from '@/lib/js/cache';
import config from '@/config';
export default {
  name: 'SlLanguage',
  components: {},
  mixins: [],
  props: {},
  data() {
    return {
      language: [
        {
          lang: 'ja_JP',
          label: '日本語',
          icon: '🇯🇵'
        },
        {
          lang: 'zh_CN',
          label: '简体中文',
          icon: '🇨🇳'
        }
      ]
    };
  },
  computed: {
    isJP: () => {
      return catchLanguage.get() === config.language;
    }
  },
  watch: {},
  beforeDestroy() {},
  mounted() {},
  methods: {
    changeLanguage(name) {
      if (name !== catchLanguage.get()) {
        catchLanguage.set(name);
        window.location.reload();
      }
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
