<template>
  <div class="sl-main-content">
    <Card :bordered="false" class="map-card" dis-hover>
      <p slot="title" class="title">{{ $t('realtimeLocation.title') }}</p>
      <div slot="extra" class="extra">
        <div class="switch">
          <label>{{ $t('home.card1.a') }}</label
          ><iSwitch v-model="l7.switch.jz" @on-change="l7MapToggleJiZhanLayer" />
        </div>
        <div class="switch">
          <label>{{ $t('home.card1.b') }}</label
          ><iSwitch v-model="l7.switch.xb" @on-change="l7MapToggleXinBiaoLayer" />
        </div>
        <div class="switch">
          <label>{{ $t('home.card1.c') }}</label
          ><iSwitch v-model="l7.switch.wl" @on-change="l7MapTogglePolygonLayer" />
        </div>
        <div class="sl-width-150">
          <sl-map-cascader
            ref="mapCascader"
            @onChange="mapCascaderOnChange"
            @onSetMapData="mapCascaderOnsetData"
          />
        </div>
      </div>
      <div class="for-map">
        <sl-l7
          v-if="l7.show"
          ref="sll7"
          :switch-jizhan="l7.switch.jz"
          :switch-weilan="l7.switch.wl"
        />
      </div>
    </Card>
  </div>
</template>
<script>
import { mapState } from 'vuex';

import l7 from './mixins/l7';
export default {
  components: {},
  mixins: [l7],
  data() {
    return {};
  },
  computed: mapState({}),
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
  },
  activated() {},
  methods: {}
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
