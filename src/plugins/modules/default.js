/*
 * @Author: shenlan
 * @Description: 引入自定义相关
 */

import Vue from 'vue';

import '@/lib/less/index.less';

import api from '@/api';
import pub from '@/lib/js/pub';
import config from '@/config';
import mixin_pub from '@/mixins/mixin-pub';

//装载
Vue.prototype.$api = api;
Vue.prototype.$pub = pub;
Vue.prototype.$config = config;

//装载全局 mixin
Vue.use(mixin_pub);

//测试数据
if (process.env.NODE_ENV === 'development') {
  // require('@/mock');
  // require('@/lib/js/utils/vconsole');
}
