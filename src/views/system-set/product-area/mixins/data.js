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
      },

      rules: {
        objectName: [{ required: true, message: "请输入对象名称", trigger: "blur" }],
        belongType: [{ required: true, message: "请选择所属类型", trigger: "change" }]
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
