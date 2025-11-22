<template>
  <div>
    <Card class="card-search" :bordered="false" dis-hover>
      <div class="sl-main-search-header">
        <div class="sl-margin-right-15">
          <Input
            v-model="search.beaconMac"
            :placeholder="$t('beaconManage.table.mac')"
            class="sl-width-150"
            maxlength="30"
            clearable
          />
        </div>
        <div class="sl-margin-right-15">
          <Input
            v-model="search.locationObjectName"
            :placeholder="$t('objectManage.table.name')"
            class="sl-width-150"
            maxlength="30"
            clearable
          />
        </div>
        <div class="sl-margin-right-15">
          <Select
            v-model="search.beaconOnline"
            clearable
            :placeholder="$t('beaconManage.table.status')"
            class="sl-width-150"
          >
            <Option
              v-for="(item, index) in searchData.beaconOnline"
              :key="index"
              :value="item.value"
              >{{ item.label }}</Option
            >
          </Select>
        </div>

        <div class="sl-margin-right-15">
          <Select
            v-model="search.beaconAllow"
            clearable
            :placeholder="$t('beaconManage.table.whetherAdd')"
            class="sl-width-150"
          >
            <Option
              v-for="(item, index) in searchData.beaconAllow"
              :key="index"
              :value="item.value"
              >{{ item.label }}</Option
            >
          </Select>
        </div>

        <div class="sl-margin-right-15">
          <Select
            v-model="search.beaconType"
            multiple
            :placeholder="$t('beaconManage.table.type')"
            class="sl-width-200"
          >
            <Option
              v-for="(item, index) in mixinConfig.BEACON_AND_LOCATION_OBJECT_TYPE.data"
              :key="index"
              :value="item.value"
              >{{ item.label }}</Option
            >
          </Select>
        </div>

        <div class="sl-margin-right-15">
          <Select
            v-model="search.beaconProduct"
            clearable
            :placeholder="$t('beaconManage.table.model')"
            class="sl-width-150"
          >
            <Option
              v-for="(item, index) in searchData.beaconProduct"
              :key="index"
              :value="item.value"
              >{{ item.label }}</Option
            >
          </Select>
        </div>

        <div class="sl-margin-right-15">
          <Select
            v-model="search.order"
            clearable
            :placeholder="$t('beaconManage.sort.title')"
            class="sl-width-220"
          >
            <Option v-for="(item, index) in searchData.order" :key="index" :value="item.value">{{
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
      <p slot="title">{{ $t('beaconManage.title') }}</p>

      <div slot="extra">
        <Button class="sl-margin-right-15" type="primary" @click="addXinbiao">
          {{ $t('beaconManage.add') }}
        </Button>
        <Button type="primary" @click="batchAddXinbiao"> {{ $t('beaconManage.batchAdd') }} </Button>
      </div>

      <div class="a">
        <sl-table ref="slComTable" :t-id="'demo-table'" :t-columns="table.columns"> </sl-table>
      </div>
    </Card>

    <!-- 配置对象 -->
    <set-object ref="setObject" @handleRefreshTable="handleRefreshTable" />

    <!-- 录入信标 -->
    <add-xinbiao ref="addXinbiao" @handleRefreshTable="handleRefreshTable" />

    <!-- 批量录入信标 -->
    <batch-add-xinbiao ref="batchAddXinbiao" @handleRefreshTable="handleRefreshTable" />
  </div>
</template>
<script>
import { mapState } from 'vuex';
import table from './mixins/table';

import SetObject from './components/SetObject';
import AddXinbiao from './components/AddXinbiao';
import batchAddXinbiao from './components/BatchAddXinbiao';
export default {
  components: { SetObject, AddXinbiao, batchAddXinbiao },
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
    addXinbiao() {
      this.$refs.addXinbiao.show();
    },
    batchAddXinbiao() {
      this.$refs.batchAddXinbiao.show();
    },
    // 绑定地图成功回调
    handleRefreshTable() {
      this.$refs.slComTable.handleRefreshtable();
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
