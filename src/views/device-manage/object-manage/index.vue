<template>
  <div>
    <Card class="card-search" :bordered="false" dis-hover>
      <div class="sl-main-search-header">
        <div class="sl-margin-right-15">
          <Input
            v-model="search.locationObjectName"
            :placeholder="$t('objectManage.table.name')"
            class="sl-width-150"
            clearable
          />
        </div>

        <div class="sl-margin-right-15">
          <Select
            v-model="search.locationObjectType"
            multiple
            :placeholder="$t('objectManage.table.type')"
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
      <p slot="title">{{ $t('objectManage.title') }}</p>

      <Button slot="extra" type="primary" @click="addObject"> {{ $t('base.add') }} </Button>

      <div>
        <sl-table ref="slComTable" :t-id="'demo-table'" :t-columns="table.columns"> </sl-table>
      </div>
    </Card>

    <bind-map ref="bindMap" @handleBindMap="handleRefreshTable" />

    <add-object ref="addObject" @handleAddEdit="handleRefreshTable" />
  </div>
</template>
<script>
import { mapState } from 'vuex';
import table from './mixins/table';
import BindMap from './components/BindMap';
import AddObject from './components/AddObject';
export default {
  components: { BindMap, AddObject },
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
    addObject() {
      this.$refs.addObject.show();
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
