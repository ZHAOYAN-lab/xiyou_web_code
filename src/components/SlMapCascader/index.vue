<template>
  <div>
    <Cascader
      v-model="map.value"
      trigger="hover"
      transfer
      :clearable="false"
      :data="map.data"
      :render-format="cascaderFormat"
      :placeholder="$t('base.map')"
      @on-change="onChange"
    ></Cascader>
  </div>
</template>
<script>
import mixin_map from '@/mixins/mixin-map';
export default {
  name: 'SlMapCascader',
  components: {},
  mixins: [mixin_map],
  props: {},
  data() {
    return {
      map: {
        value: [],
        data: []
      }
    };
  },
  computed: {},
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {
      this.mixinGetMapData().then((data) => {
        this.map.data = data;
        this.$emit('onSetMapData');
      });
    });
  },
  methods: {
    getValue() {
      return this.map.value;
    },
    getFirstUseMap() {
      // function findFirstItemWithValueAndId(data, resultArr) {
      //   for (let item of data) {
      //     if (item.id) {
      //       console.log(JSON.stringify(item, null, 2));
      //       resultArr.push(item.value);
      //       return resultArr;
      //     }

      //     if (item.children && item.children.length > 0) {
      //       resultArr.push(item.value);
      //       findFirstItemWithValueAndId(item.children, resultArr);
      //       if (resultArr.length > 0) {
      //         return resultArr;
      //       }
      //       resultArr.pop();
      //     }
      //   }

      //   return resultArr;
      // }

      function findThirdLevelWithId(data) {
        for (const item of data) {
          if (item.children.length > 0) {
            // 第一级有子元素，继续遍历第二级
            for (const child of item.children) {
              if (child.children.length > 0) {
                // 第二级有子元素，继续遍历第三级
                for (const grandchild of child.children) {
                  if (Object.hasOwnProperty.call(grandchild, 'id')) {
                    // 找到第三级且有id属性的元素，返回其id
                    return [null, null, grandchild.id];
                  }
                }
              }
            }
          }
        }

        // 如果没有找到满足条件的元素，返回null
        return [null, null, null];
      }

      return findThirdLevelWithId(this.map.data);
    },
    onChange(value) {
      this.$emit('onChange', value[2]);
    },
    setValue(id) {
      if (id) {
        // let value = this.findParentValue(this.map.data, id);
        let value = [];

        this.map.data.forEach((ele) => {
          if (ele.children && ele.children.length) {
            ele.children.forEach((ele2) => {
              if (ele2.children && ele2.children.length) {
                ele2.children.forEach((ele3) => {
                  if (ele3.value === id) {
                    value = [ele.value, ele2.value, ele3.value];
                  }
                });
              }
            });
          }
        });

        // console.log(JSON.stringify(value, null, 2));
        this.map.value = value;
      } else {
        this.map.value = [];
      }
    },

    cascaderFormat(labels, selectedData) {
      const index = labels.length - 1;
      const data = selectedData[index] || false;
      if (data && data.code) {
        return labels[index] + ' - ' + data.code;
      }
      return labels[index];
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
