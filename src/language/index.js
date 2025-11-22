/*
 * @Author: shenlan
 * @Description: 多语言初始化
 */
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import ViewUI from 'view-design';
import '~theme/iview.less';
import { catchLanguage } from '@/lib/js/cache';
import zhLocale from './lang/zh-CN.json';
import jpLocale from './lang/ja-JP.json';
import ja from 'view-design/dist/locale/ja-JP';
import zh from 'view-design/dist/locale/zh-CN';

ja.i.datepicker.selectTime = '時刻選択';
ja.i.datepicker.startTime = '開始時間';

// ja.i.select.placeholder = '開始時間';
ja.i.select.noMatch = '選択可能サービスがありません';

Vue.locale = () => {};

Vue.use(VueI18n);

const messages = {
  zh_CN: Object.assign(zhLocale, zh),
  ja_JP: Object.assign(jpLocale, ja)
};

const i18n = new VueI18n({
  // 设置语言环境
  locale: catchLanguage.get(),

  messages
});

Vue.use(ViewUI, {
  i18n: function (path, options) {
    let value = i18n.t(path, options);
    if (value !== null && value !== undefined) return value;

    return '';
  }
});

export default i18n;
