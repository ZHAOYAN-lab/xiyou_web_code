<template>
  <div>
    <Card :bordered="false" dis-hover>
      <p slot="title">{{ $t('serviceSet.title') }}</p>

      <div>
        <sl-table ref="slComTable" :t-id="'demo-table'" :t-columns="table.columns"> </sl-table>
      </div>
    </Card>
    <modal-upload ref="modalUpload" @handleAddEditBuild="handleAddEditBuild" />
  </div>
</template>
<script>
import { mapState } from 'vuex';
import table from './mixins/table';
import ModalUpload from './components/modalUpload';

export default {
  components: { ModalUpload },
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
    // 添加编辑成功回调
    handleAddEditBuild() {
      this.$refs.slComTable.handleRefreshtable();
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
