import {
  getProductAreaList,
  addProductArea,
  updateProductArea,
  deleteProductArea
} from '@/api/path/product-area'

export default {
  methods: {

    // 加载列表
    loadTable() {
      this.tableLoading = true;

      getProductAreaList()
        .then(res => {
          // axios 拦截器已处理，res 就是数组 detail 本身
          this.tableData = Array.isArray(res) ? res : [];

          // 防止 undefined 渲染报错
          this.tableData.forEach(item => {
            item.mapNames = item.mapNames || '未绑定';
            item.belongType = item.belongType || '未设置';
          });
        })
        .finally(() => {
          this.tableLoading = false;
        });
    },

    // 新增
    handleAdd() {
      this.form = {
        areaId: null,
        objectName: "",
        belongType: "",
        iconUrl: "",
        mapIds: []
      }
      this.editModal = true
    },

    // 编辑
    handleEdit(row) {
      this.form = JSON.parse(JSON.stringify(row))
      this.editModal = true
    },

    // 绑定地图
    handleBind(row) {
      console.log("🔥 handleBind 执行了", row);
      this.form = JSON.parse(JSON.stringify(row))
      this.bindModal = true
    },

    // 提交表单
    submitForm() {
      const api = this.form.areaId ? updateProductArea : addProductArea;

      api(this.form).then(() => {
        this.$Message.success(this.form.areaId ? "修改成功" : "新增成功");
        this.editModal = false;
        this.loadTable();
      });
    },

    // 删除
    handleDelete(row) {

      console.log("点击删除按钮 row =", row); // ★ 调试用

      this.$Modal.confirm({
        title: "确认删除？",
        content: `确定删除【${row.objectName}】吗？`,
        onOk: () => {

          console.log("发送删除请求，areaId =", row.areaId); // ★ 调试用

          // ⭐⭐最终正确调用方式（强制用对象传参）⭐⭐
          deleteProductArea({ areaId: row.areaId }).then(() => {
            this.$Message.success("删除成功");
            this.loadTable();
          }).catch(err => {
            this.$Message.error(err.msg || "删除失败");
          });

        }
      });
    }

  }
}
