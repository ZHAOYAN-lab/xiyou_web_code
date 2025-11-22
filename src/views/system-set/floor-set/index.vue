<template>
  <div>
    <Card class="card-search" :bordered="false" dis-hover>
      <div class="sl-main-search-header">
        <div class="sl-margin-right-10">
          <Input
            v-model="search.projectName"
            maxlength="30"
            :placeholder="$t('floorSet.table.projectName')"
            class="sl-width-150"
            clearable
          />
        </div>
        <div class="sl-margin-right-10">
          <Input
            v-model="search.cpaFileName"
            maxlength="30"
            :placeholder="$t('floorSet.table.cpa')"
            class="sl-width-150"
            clearable
          />
        </div>
        <div class="sl-margin-right-15">
          <Input
            v-model="search.mac"
            maxlength="30"
            :placeholder="$t('floorSet.table.mac')"
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
      <p slot="title">{{ $t('floorSet.title') }}</p>

      <Button slot="extra" class="sl-margin-right-10" @click="backToBuilding">
        {{ $t('base.back') }}
      </Button>

      <Button slot="extra" type="primary" @click="addFloor"> {{ $t('base.add') }} </Button>

      <div>
        <sl-table
          ref="slComTable"
          :t-id="'demo-table'"
          :t-columns="table.columns"
          :t-disabledhover="true"
          :t-highlightrow="false"
        >
        </sl-table>
      </div>
    </Card>

    <!-- 添加楼层(项目) -->
    <add-floor ref="addFloor" @handleAddEditBuild="handleAddEditBuild" />

    <!-- 查看楼层 -->
    <floor-view ref="floorView" />
  </div>
</template>
<script>
import { mapState } from 'vuex';
import table from './mixins/table';

import AddFloor from './components/AddFloor';
import FloorView from './components/FloorView';
export default {
  components: { AddFloor, FloorView },
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
      this.search.buildingId = this.$route.query.buildingId;
      this.tableGetData();
    });
  },

  methods: {
    addFloor() {
      this.$refs.addFloor.show();
    },
    // 添加编辑成功回调
    handleAddEditBuild() {
      this.$refs.slComTable.handleRefreshtable();
    },
    backToBuilding() {
      this.$router.go(-1);
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
