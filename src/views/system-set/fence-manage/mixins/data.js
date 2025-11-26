import i18n from '@/language'; // 国际化

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
          label: i18n.messages[i18n.locale].base.undisabled //启用
        },
        {
          value: 0,
          label: i18n.messages[i18n.locale].base.disabled //禁用
        }
      ]
    };
  },
  computed: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {}
};
