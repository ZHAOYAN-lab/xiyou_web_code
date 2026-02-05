import {
  getProductAreaList,
  addProductArea,
  updateProductArea,
  deleteProductArea,
  getProductAreaTypes
} from '@/api/path/product-area'

export default {
  data() {
    return {
      tableLoading: false,
      tableData: [],

      editModal: false,
      bindModal: false,

      typeList: [],

      form: {
        areaId: null,
        objectName: "",
        belongType: "",
        iconUrl: "",
        mapIds: []
      }
    }
  },

  computed: {
    rules() {
      return {
        objectName: [
          { required: true, message: this.$t('productArea.validate.objectNameFull'), trigger: 'blur' }
        ],
        belongType: [
          { required: true, message: this.$t('productArea.validate.belongTypeFull'), trigger: 'change' }
        ]
      }
    }
  },

  created() {
    this.loadTable()

    // ★★★ 唯一修复点：后端返回数组，不是 res.data
    getProductAreaTypes().then(res => {
      this.typeList = Array.isArray(res) ? res : []
    })
  }
}
