/*
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2023-07-18 09:32:11
 * @LastEditors: shenlan
 * @LastEditTime: 2023-08-24 11:01:51
 * @Description: 地图-相关
 */
export default {
  data() {
    return {};
  },
  computed: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {
    // 获取配置项
    pubGetConfig() {
      return new Promise((resolve) => {
        this.$api.pubGetConfig({}).then((res) => {
          resolve(res);
        });
      });
    },

    // 获取全部地图树
    mixinGetMapData() {
      return new Promise((resolve) => {
        this.$api.pubGetMapData({}).then((res) => {
          function transformData(data) {
            return data.map((item, index) => {
              const newItem = {};

              // 用于树状选择器展开全部
              newItem.title = item.title;
              newItem.expand = true;

              newItem.label = item.title;

              if (item.children) {
                newItem.children = transformData(item.children);
              }

              if (item.mapId) {
                newItem.value = item.mapId;
                newItem.id = item.mapId;
              } else {
                newItem.value = item.title + '_' + index;
              }

              return newItem;
            });
          }

          let d = transformData(res);

          d.forEach((ele) => {
            if (ele.children && ele.children.length) {
              let flag = true;
              ele.children.forEach((ele2) => {
                if (!(ele2.children && ele2.children.length)) {
                  ele2.disabled = true;
                } else {
                  flag = false;
                }
              });

              ele.disabled = flag;
            } else {
              ele.disabled = true;
            }
          });

          // console.log(JSON.stringify(d, null, 2));

          resolve(d);
        });
      });
    }
  }
};
