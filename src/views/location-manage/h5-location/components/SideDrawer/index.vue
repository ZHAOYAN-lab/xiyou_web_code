<template>
  <div>
    <div v-show="drawer.show" class="mask"></div>
    <Drawer
      v-model="drawer.show"
      :title="userInfo.userName"
      placement="left"
      :closable="false"
      lock-scroll
      class="sl-drawer"
    >
      <div>
        <CellGroup>
          <Cell :title="$t('base.date')">
            <p slot="extra">{{ mixinHeader.dateTime }}</p>
          </Cell>



          

          <Cell :title="$t('base.map')">
            <div slot="extra" class="sl-width-100">
              <sl-map-cascader
                ref="mapCascader"
                @onChange="mapCascaderOnChange"
                @onSetMapData="mapCascaderOnsetData"
              />
            </div>
          </Cell>
        </CellGroup>
        <div class="log-out">
          <Button slot="extra" type="primary" @click="logoutMethod">{{
            $t('header.logout')
          }}</Button>
        </div>
      </div>
    </Drawer>
  </div>
</template>
<script>
import mixinHeader from '@/mixins/mixin-header';

export default {
  name: 'SideDrawer',
  components: {},
  mixins: [mixinHeader],
  props: {},
  data() {
    return {
      drawer: {
        show: false,
        // 显示隐藏开关
        switch: {
          jz: true,
          xb: true,
          wl: false
        }
      }
    };
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
  methods: {
    show() {
      this.drawer.show = true;
    },
    mapCascaderOnsetData() {
      let mapCascader = this.$refs.mapCascader;
      let a = mapCascader.getFirstUseMap();

      mapCascader.setValue(a[2]);

      this.mapCascaderOnChange(a[2]);
    },
    mapCascaderOnChange(value) {
      this.$emit('mapCascaderOnChange', value);
    },
    getCascaderValue() {
      return this.$refs.mapCascader.getValue()[2];
    },

    l7MapToggleJiZhanLayer(value) {
      this.$emit('jizhan', value);
    },
    l7MapToggleXinBiaoLayer(value) {
      this.$emit('xinbiao', value);
    },
    l7MapTogglePolygonLayer(value) {
      this.$emit('weilan', value);
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
