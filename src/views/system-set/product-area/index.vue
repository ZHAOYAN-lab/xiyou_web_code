<template>
  <div class="product-area">
    <Card :bordered="false" dis-hover>

      <div slot="title" class="header">
        <span class="title">商品区域设置</span>
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
          <!-- 绑定地图的功能合并到编辑弹窗里，不再单独出一个按钮 -->
          <Button type="text" @click="handleDelete(row)">删除</Button>
        </template>

      </Table>
    </Card>

    <!-- 新增/编辑 商品区域（复刻围栏 AddFence 的思路） -->
    <AddProductArea ref="addProductArea" @success="loadTable" />
  </div>
</template>

<script>
import mixinData from './mixins/data'
import mixinTable from './mixins/table'
import mixinMethods from './mixins/methods'

import AddProductArea from './components/AddProductArea.vue'

export default {
  name: 'ProductArea',
  mixins: [mixinData, mixinTable, mixinMethods],
  components: { AddProductArea },

  methods: {
    // 覆盖掉 mixin 里的 handleAdd / handleEdit，让它们走新的弹窗
    handleAdd() {
      this.$refs.addProductArea.show();
    },
    handleEdit(row) {
      this.$refs.addProductArea.show(row);
    }
    // handleDelete 依然用你 mixinMethods 里的，不用改
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
