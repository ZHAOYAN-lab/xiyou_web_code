/*
 * @Author: shenlan
 * @Description: 全局mixin 慎改
 */
import { catchLanguage } from '@/lib/js/cache';
import config from '@/config';

export default {
  install(Vue) {
    Vue.mixin({
      data() {
        return {
          mixinIsZHCN: catchLanguage.get() !== config.language,
          mixinModal: {
            class: 'vertical-center-modal',
            width: 800,
            maxWidth: 900
          }
        };
      },
      computed: {},
      methods: {
        mixinPageReload() {
          this.reload();
        }
      }
    });
  }
};
