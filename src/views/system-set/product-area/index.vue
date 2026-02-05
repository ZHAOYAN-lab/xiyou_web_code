<template>
  <div class="product-area">
    <Card :bordered="false" dis-hover>

      <div slot="title" class="header">
        <span class="title">{{ $t('productArea.title') }}</span>
        <Button type="primary" icon="md-add" @click="handleAdd">{{ $t('productArea.addArea') }}</Button>
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
          <Tag color="blue">{{ belongTypeLabel(row.belongType) }}</Tag>
        </template>

        <template slot="mapNames" slot-scope="{ row }">
          {{ row.mapNames || $t('productArea.unbound') }}
        </template>

        <template slot="action" slot-scope="{ row }">
          <Button type="text" @click="handleEdit(row)">{{ $t('base.edit') }}</Button>
          <Button type="text" @click="handleDelete(row)">{{ $t('base.delete') }}</Button>
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

const AREA_TYPE = {
  goods: '商品区域',
  passage: '通路区域'
}

export default {
  name: 'ProductArea',
  mixins: [mixinData, mixinTable, mixinMethods],
  components: { AddProductArea },
  data() {
    return {
      areaTypeValues: AREA_TYPE
    }
  },

  methods: {
    /** 覆盖 mixin 里的新增 */
    handleAdd() {
      this.$refs.addProductArea.show();
    },

    /** 覆盖 mixin 里的编辑 */
    handleEdit(row) {
      this.$refs.addProductArea.show(row);
    },

    belongTypeLabel(type) {
      if (type === this.areaTypeValues.goods) return this.$t('productArea.type.goods')
      if (type === this.areaTypeValues.passage) return this.$t('productArea.type.passage')
      return type || this.$t('productArea.unset')
    },

    /** 删除 */
    handleDelete(row) {
      const areaName = row.objectName || this.$t('productArea.defaultName')
      this.$Modal.confirm({
        title: this.$t('productArea.tips.deleteConfirmTitle'),
        content: this.$t('productArea.tips.deleteConfirmContent', { name: areaName }),
        okText: this.$t('base.sure'),
        cancelText: this.$t('base.cancel'),
        onOk: () => {
          deleteProductArea({ areaId: row.areaId })
            .then(() => {
              this.$Message.success(this.$t('productArea.messages.deleteSuccess'))
              this.loadTable()
            })
            .catch(err => {
              this.$Message.error(err?.msg || this.$t('productArea.messages.deleteFail'))
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
