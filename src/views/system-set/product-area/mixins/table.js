import { getProductAreaList } from '@/api/path/product-area'

export default {
  data() {
    return {
      tableLoading: false,

      // ⭐ columns 必须在这里统一定义
      columns: [
        { title: "对象名称", slot: "objectName" },
        { title: "所属类型", slot: "belongType" },
        { title: "绑定地图", slot: "mapNames" },
        { title: "操作", slot: "action", width: 220 }
      ]
    }
  },

  methods: {
    getList() {
      this.tableLoading = true;

      getProductAreaList()
        .then(res => {
          // axios 拦截器返回 detail 数组本体
          this.tableData = Array.isArray(res) ? res : [];

          // 补字段防止 undefined
          this.tableData.forEach(item => {
            item.mapNames = item.mapNames || '未绑定';
            item.belongType = item.belongType || '未设置';
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
