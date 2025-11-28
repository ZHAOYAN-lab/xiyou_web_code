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
          this.tableData = Array.isArray(res) ? res : [];

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

    // ⭐⭐⭐ 删除方法 ⭐⭐⭐
    handleDelete(row) {
      console.log("🔴🔴🔴 handleDelete 开始执行");
      console.log("🔴 row =", JSON.stringify(row, null, 2));
      console.log("🔴 row.areaId =", row.areaId);
      
      // ⭐ 直接用字符串模板，避免 row 对象的问题
      const areaName = row.objectName || '该区域';
      
      this.$Modal.confirm({
        title: "确认删除？",
        content: `确定删除【${areaName}】吗？`,
        onOk: () => {
          console.log("🟢🟢🟢 用户点击确认");
          console.log("🟢 准备调用 API，参数:", { areaId: row.areaId });
          
          return deleteProductArea({ areaId: row.areaId })
            .then((res) => {
              console.log("🟢 删除成功，返回:", res);
              this.$Message.success("删除成功");
              this.loadTable();
            })
            .catch(err => {
              console.log("🔴 删除失败，错误:", err);
              console.log("🔴 错误对象:", JSON.stringify(err, null, 2));
              this.$Message.error(err?.msg || err?.message || "删除失败");
            });
        },
        onCancel: () => {
          console.log("⚪ 用户取消");
        }
      });
    }

  }
}