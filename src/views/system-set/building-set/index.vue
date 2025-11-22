<template>
  <div>
    <Card class="card-search" :bordered="false" dis-hover>
      <div class="sl-main-search-header">
        <div class="sl-margin-right-10">
          <Input
            v-model="search.buildingName"
            maxlength="30"
            :placeholder="$t('buildingSet.table.name')"
            class="sl-width-150"
            clearable
          />
        </div>

        <div>
          <Button type="primary" @click="tableGetData">{{ $t('base.search') }}</Button>
        </div>
      </div>
    </Card>

    <Card :bordered="false" class="sl-margin-top-12" dis-hover>
      <p slot="title">{{ $t('buildingSet.title') }}</p>

      <Button slot="extra" type="primary" @click="addMap"> {{ $t('base.add') }} </Button>

      <div>
        <sl-table ref="slComTable" :t-id="'demo-table'" :t-columns="table.columns"> </sl-table>
      </div>
    </Card>

    <add-build ref="addBuild" @handleAddEditBuild="handleRefreshTable" />

    <map-view ref="mapView" />
  </div>
</template>
<script>
import { mapState } from 'vuex';
import table from './mixins/table';

import AddBuild from './components/AddBuild';
import MapView from './components/MapView';
export default {
  components: { AddBuild, MapView },
  mixins: [table],
  inject: ['reload'],
  data() {
    return {};
  },
  computed: mapState({}),
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {
      this.tableGetData();
    });
  },

  methods: {
    // 添加建筑
    addMap() {
      this.$refs.addBuild.show();
    },
    // 添加编辑成功回调
    handleRefreshTable() {
      this.$refs.slComTable.handleRefreshtable();
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
