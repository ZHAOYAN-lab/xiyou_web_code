/*
 * @Author: shenlan
 * @Description: 引入全局自定义组件
 */

import Vue from 'vue';
import SlLanguage from '@/components/SlLanguage';
import SlTable from '@/components/SlTable';
import SlEmpty from '@/components/SlEmpty';
import SlL7 from '@/components/SlL7';
import SlMapCascader from '@/components/SlMapCascader';
import SlUpload from '@/components/SlUpload';

Vue.component(SlLanguage.name, SlLanguage);
Vue.component(SlTable.name, SlTable);
Vue.component(SlEmpty.name, SlEmpty);
Vue.component(SlL7.name, SlL7);

Vue.component(SlMapCascader.name, SlMapCascader);
Vue.component(SlUpload.name, SlUpload);
