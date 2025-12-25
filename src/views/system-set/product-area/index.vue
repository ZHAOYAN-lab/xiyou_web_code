<template>
  <div class="product-area">
    <Card :bordered="false" dis-hover>

      <div slot="title" class="header">
        <span class="title">区域管理</span>
        <Button type="primary" icon="md-add" @click="handleAdd">新增区域</Button>
      </div>

      <Table
        border
        :loading="tableLoading"
        :columns="columns"
        :data="tableData">

        <template slot="objectName" slot-scope="{ row }">
          <strong>{{ row.objectName }}</strong>
        </template>

        <template slot="belongType" slot-scope="{ row }">
          <Tag color="blue">{{ row.belongType || '未设置' }}</Tag>
        </template>

        <template slot="mapNames" slot-scope="{ row }">
          {{ row.mapNames || '未绑定' }}
        </template>

        <template slot="action" slot-scope="{ row }">
          <Button type="text" @click="handleEdit(row)">编辑</Button>
          <Button type="text" @click="handleDelete(row)">删除</Button>
        </template>

      </Table>
    </Card>

    <!-- 新增/编辑 商品区域 -->
    <AddProductArea ref="addProductArea" @success="loadTable" />
  </div>
</template>

<script>
import mixinData from './mixins/data'
import mixinTable from './mixins/table'
import mixinMethods from './mixins/methods'

import {
  deleteProductArea
} from '@/api/path/product-area'

import AddProductArea from './components/AddProductArea.vue'

export default {
  name: 'ProductArea',
  mixins: [mixinData, mixinTable, mixinMethods],
  components: { AddProductArea },

  methods: {
    /** 覆盖 mixin 里的新增 */
    handleAdd() {
      this.$refs.addProductArea.show();
    },

    /** 覆盖 mixin 里的编辑 */
    handleEdit(row) {
      this.$refs.addProductArea.show(row);
    },

    /** 删除 */
    handleDelete(row) {
      this.$Modal.confirm({
        title: "确认删除？",
        content: `确定删除【${row.objectName}】吗？`,
        onOk: () => {
          deleteProductArea({ areaId: row.areaId })
            .then(() => {
              this.$Message.success("删除成功")
              this.loadTable()
            })
            .catch(err => {
              this.$Message.error(err?.msg || "删除失败")
            })
        }
      })
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-weight: bold;
  font-size: 14px;
}
</style>
