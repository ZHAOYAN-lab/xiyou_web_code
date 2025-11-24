import i18n from '@/language';

export default {
  data() {
    return {
      // 围栏类型
      fenceTypeData: [
        {
          value: 1,
          label: i18n.messages[i18n.locale].fenceManage.fenceTypeData.a
        },
        {
          value: 2,
          label: i18n.messages[i18n.locale].fenceManage.fenceTypeData.b
        }
      ],
      // 围栏状态
      fenceStatusData: [
        {
          value: 1,
          label: i18n.messages[i18n.locale].base.undisabled
        },
        {
          value: 0,
          label: i18n.messages[i18n.locale].base.disabled
        }
      ],
      // 货物种类数据（所属类型）
      belongTypeData: [
        {
          value: 1,
          label: i18n.messages[i18n.locale].fenceManage.cargoType.a
        },
        {
          value: 2,
          label: i18n.messages[i18n.locale].fenceManage.cargoType.b
        }
      ]
    };
  },
  computed: {},
  methods: {
    // 新增：根据 fenceType 获取标签
    getFenceTypeLabel(value) {
      const item = this.fenceTypeData.find(d => d.value === value);
      return item ? item.label : '';
    },
    // 新增：根据 belongType 获取标签
    getBelongTypeLabel(value) {
      const item = this.belongTypeData.find(d => d.value === value);
      return item ? item.label : '';
    }
  }
};