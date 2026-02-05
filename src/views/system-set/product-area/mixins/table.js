import { getProductAreaList } from '@/api/path/product-area'

export default {
  data() {
    return {
      tableLoading: false,

      columns: []
    }
  },

  created() {
    this.setColumns();
  },

  watch: {
    '$i18n.locale'() {
      this.setColumns();
    }
  },

  methods: {
    setColumns() {
      this.columns = [
        { title: this.$t('productArea.table.objectName'), slot: 'objectName' },
        { title: this.$t('productArea.table.belongType'), slot: 'belongType' },
        { title: this.$t('productArea.table.mapNames'), slot: 'mapNames' },
        { title: this.$t('productArea.table.action'), slot: 'action', width: 220 }
      ];
    },
    getList() {
      this.tableLoading = true;

      getProductAreaList()
        .then(res => {
          // axios 拦截器返回 detail 数组本体
          this.tableData = Array.isArray(res) ? res : [];

          // 补字段防止 undefined
          this.tableData.forEach(item => {
            item.mapNames = item.mapNames || '';
            item.belongType = item.belongType || '';
          });
        })
        .finally(() => {
          this.tableLoading = false;
        });
    }
  },

  mounted() {
    this.getList();
  }
}
