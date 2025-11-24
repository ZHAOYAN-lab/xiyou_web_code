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

      <Button slot="extra" type="primary" @click="addMethod">{{ $t('base.add') }}</Button>
      
      <!-- 添加调试信息 -->
      <div style="margin: 10px; padding: 10px; background: #f0f0f0; border: 1px solid #ccc;">
        <p><strong>调试信息：</strong></p>
        <p>table.columns 长度: {{ table.columns.length }}</p>
        <p>fenceTypeData 长度: {{ fenceTypeData.length }}</p>
        <p>belongTypeData 长度: {{ belongTypeData.length }}</p>
        <Button size="small" @click="manualInit">手动初始化表格</Button>
        <Button size="small" @click="manualGetData" style="margin-left: 10px;">手动获取数据</Button>
      </div>

      <div>
        <sl-table 
          ref="slComTable" 
          :t-id="'demo-table'" 
          :t-columns="table.columns"
        ></sl-table>
      </div>
    </Card>

    <add-fence ref="addFence" @handleRefreshTable="handleRefreshTable" />
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
  watch: {
    'table.columns': {
      handler(newVal) {
        console.log('✅ table.columns 发生变化:', newVal.length, '列');
      },
      deep: true
    }
  },
  mounted() {
    console.log('🚀 页面 mounted');
    console.log('📊 fenceTypeData:', this.fenceTypeData);
    console.log('📊 belongTypeData:', this.belongTypeData);
    console.log('📊 初始 table.columns:', this.table.columns);
    
    this.$nextTick(() => {
      console.log('⏰ nextTick 执行');
      console.log('📋 准备调用 tableGetData');
      this.tableGetData();
    });
  },
  methods: {
    addMethod() {
      this.$refs.addFence.show();
    },

    handleRefreshTable() {
      this.$refs.slComTable.handleRefreshtable();
    },

    // 手动初始化
    manualInit() {
      console.log('🔧 手动调用 tableInit');
      this.tableInit();
      console.log('✅ tableInit 执行完毕，columns:', this.table.columns);
    },

    // 手动获取数据
    manualGetData() {
      console.log('🔧 手动调用 tableGetData');
      this.tableGetData();
    }
  }
};
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>