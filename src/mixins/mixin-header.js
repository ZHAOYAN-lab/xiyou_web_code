/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-07 15:12:20
 * @LastEditors: shenlan
 * @LastEditTime: 2023-08-23 10:45:12
 * @Description: 时间 - 退出登录
 */

import { catchToken } from '@/lib/js/cache';

export default {
  data() {
    return {
      mixinHeader: {
        timer: null,
        dateTime: ''
      }
    };
  },
  computed: {},
  beforeDestroy() {
    clearTimeout(this.mixinHeader.timer);
  },
  mounted() {
    this.$nextTick(() => {
      this.setDateTime();
    });
  },
  methods: {
    clearAllAppCache() {
      catchToken.remove();
      try {
        window.localStorage && window.localStorage.clear();
      } catch (e) {}
      try {
        window.sessionStorage && window.sessionStorage.clear();
      } catch (e) {}
      try {
        if (document && document.cookie) {
          document.cookie.split(';').forEach((item) => {
            const key = item.split('=')[0].trim();
            if (!key) return;
            document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          });
        }
      } catch (e) {}

      if (this.$store && this.$store.commit) {
        if (this.$store._mutations?.resetUserInfo) {
          this.$store.commit('resetUserInfo');
        } else {
          this.$store.commit('setHasGetInfo', {
            status: false,
            userInfo: { userName: '', username: '' }
          });
          this.$store.commit('setAccess', []);
        }
      }
    },
    setDateTime() {
      // console.log('123123123');

      let mh = this.mixinHeader;
      mh.dateTime =
        this.$i18n.locale !== this.$config.language
          ? this.$pub.slTimeFormat()
          : this.$pub.slTimeFormat(this.slConvertBeijingToTokyo());

      mh.timer = setTimeout(() => {
        this.setDateTime();
      }, 1000);
    },
    // 北京时间转换成 日本时间
    slConvertBeijingToTokyo() {
      // 将北京时间转换为当地时间
      var beijingDate = new Date();
      // 获取北京时间的小时数
      var beijingHours = beijingDate.getUTCHours();

      // 将北京时间的小时数转换为日本时间的小时数
      var tokyoHours = beijingHours + 1;

      // 如果日本时间的小时数超过了 23 小时，则表示已经跨天，需要调整日期
      if (tokyoHours > 23) {
        beijingDate.setUTCDate(beijingDate.getUTCDate() + 1);
        tokyoHours -= 24;
      }

      // 设置日本时间的小时数
      beijingDate.setUTCHours(tokyoHours);

      // 返回转换后的日本时间
      return beijingDate;
    },
    logoutMethod() {
      // 跳转到登录页

      this.clearAllAppCache();
      const loginHref = this.$router?.resolve({ name: 'login' })?.href || '/login';
      window.location.replace(loginHref);
    }
  }
};
