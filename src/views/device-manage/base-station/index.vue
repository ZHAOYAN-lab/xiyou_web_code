<template>
  <div>
    <Card class="card-search" :bordered="false" dis-hover>
      <div class="sl-main-search-header">
        <div class="sl-margin-right-10">
          <Input
            v-model="search.mac"
            :placeholder="$t('baseStation.table.mac')"
            class="sl-width-150"
            clearable
          />
        </div>
        <div class="sl-margin-right-15">
          <Input
            v-model="search.ip"
            :placeholder="$t('baseStation.table.ip')"
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
      <p slot="title">{{ $t('baseStation.title') }}</p>

      <div class="a">
        <sl-table ref="slComTable" :t-id="'demo-table'" :t-columns="table.columns"> </sl-table>
      </div>
    </Card>
  </div>
</template>
<script>
import { mapState } from 'vuex';
import table from './mixins/table';
export default {
  components: {},
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

  methods: {}
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
