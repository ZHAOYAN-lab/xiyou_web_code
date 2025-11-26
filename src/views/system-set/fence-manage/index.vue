<template>
  <div>
    <Card class="card-search" :bordered="false" dis-hover>
      <div class="sl-main-search-header">
        <div class="sl-margin-right-10">
          <Input
            v-model="search.mapCpaName"
            maxlength="30"
            :placeholder="$t('fenceManage.mapName')"
            class="sl-width-150"
            clearable
          />
        </div>
        <div class="sl-margin-right-10">
          <Input
            v-model="search.fenceName"
            maxlength="30"
            :placeholder="$t('fenceManage.fenceName')"
            class="sl-width-200"
            clearable
          />
        </div>

        <div class="sl-margin-right-15">
          <Select
            v-model="search.fenceType"
            class="sl-width-200"
            :placeholder="$t('fenceManage.fenceType')"
            clearable
          >
            <Option v-for="(item, index) in fenceTypeData" :key="index" :value="item.value">{{
              item.label
            }}</Option>
          </Select>
        </div>

        <div class="sl-margin-right-15">
          <Select
            v-model="search.fenceStatus"
            class="sl-width-220"
            :placeholder="$t('fenceManage.fenceStatus')"
            clearable
          >
            <Option v-for="(item, index) in fenceStatusData" :key="index" :value="item.value">{{
              item.label
            }}</Option>
          </Select>
        </div>

        <div>
          <Button type="primary" @click="tableGetData">{{ $t('base.search') }}</Button>
        </div>
      </div>
    </Card>

    <Card :bordered="false" class="sl-margin-top-12" dis-hover>
      <p slot="title">{{ $t('fenceManage.title') }}</p>

      <Button slot="extra" type="primary" @click="addMethod"> {{ $t('base.add') }} </Button>
      <div>
        <sl-table ref="slComTable" :t-id="'demo-table'" :t-columns="table.columns"> </sl-table>
      </div>
    </Card>

    <!-- 添加/编辑 -->
    <add-fence ref="addFence" @handleRefreshTable="handleRefreshTable" />

    <!-- 查看 -->
    <fence-detail ref="fenceDetail" />
  </div>
</template>
<script>
import { mapState } from 'vuex';
import pubData from './mixins/data';
import table from './mixins/table';

import AddFence from './components/AddFence';
import FenceDetail from './components/FenceDetail';

export default {
  components: { AddFence, FenceDetail },
  mixins: [pubData, table],
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
    addMethod() {
      this.$refs.addFence.show();
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
