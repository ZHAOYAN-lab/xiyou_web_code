export default {
  data() {
    return {
      mixinConfig: {
        LANGUAGE: {
          zh_CN: 1,
          ja_JP: 2
        },
        // (对象/信标) 类型
        BEACON_AND_LOCATION_OBJECT_TYPE: {}
      }
    };
  },
  computed: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {
      this.mixinConfigInit();
    });
  },
  methods: {
    mixinConfigInit() {
      this.mixinConfig.BEACON_AND_LOCATION_OBJECT_TYPE = {
        data: [
          {
            value: 1,
            label: this.$t('base.config.objectType.a')
          },
          {
            value: 2,
            label: this.$t('base.config.objectType.b')
          },
          {
            value: 3,
            label: this.$t('base.config.objectType.c')
          },
          {
            value: 4,
            label: this.$t('base.config.objectType.d')
          }
        ],
        none: {
          value: 0,
          label: this.$t('base.config.objectType.e')
        }
      };
    }
  }
};
