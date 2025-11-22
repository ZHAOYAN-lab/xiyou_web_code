<template>
  <div>
    <Modal
      v-model="modal.show"
      :class-name="mixinModal.class"
      :title="modal.title.value"
      :width="mixinModal.width"
      :mask-closable="false"
      :before-close="modalCancel"
    >
      <div class="modal-content">
        <Tree ref="tree" :data="modal.data" show-checkbox></Tree>
      </div>

      <div slot="footer">
        <Button @click="modalCancel">{{ $t('base.cancel') }}</Button>
        <Button type="primary" @click="modalSure">{{ $t('base.sure') }}</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import mixin_map from '@/mixins/mixin-map';
export default {
  name: 'AddXinbiao',
  components: {},
  mixins: [mixin_map],
  props: {},
  data() {
    return {
      modal: {
        show: false,
        title: {
          value: ''
        },
        data: [
          // {
          //   title: '楼宇名称',
          //   expand: true,
          //   children: [
          //     {
          //       title: '项目名称',
          //       expand: true,
          //       children: [
          //         {
          //           title: '地图一'
          //         },
          //         {
          //           title: '地图二'
          //         }
          //       ]
          //     },
          //     {
          //       title: 'parent 1-2',
          //       expand: true,
          //       children: [
          //         {
          //           title: 'leaf 1-2-1'
          //         },
          //         {
          //           title: 'leaf 1-2-1'
          //         }
          //       ]
          //     }
          //   ]
          // }
        ]
      }
    };
  },
  computed: {},
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {});
  },
  methods: {
    show(item) {
      this.mixinGetMapData().then((data) => {
        let m = this.modal;

        m.title.value = this.$t('objectManage.table.bindMapModalTitle');
        m.item = item;

        if (item.mapList && item.mapList.length) {
          item.mapList.forEach((item) => {
            data.forEach((ele) => {
              if (ele.children) {
                ele.children.forEach((ele2) => {
                  if (ele2.children) {
                    ele2.children.forEach((ele3) => {
                      if (ele3.id === item.mapId) {
                        ele3.checked = true;
                      }
                    });
                  }
                });
              }
            });
          });
        }

        m.data = data;

        m.show = true;
      });
    },
    modalCancel() {
      let m = this.modal;
      m.show = false;
    },
    modalSure() {
      let mapList = this.$refs.tree.getCheckedNodes().reduce((arr, ele) => {
        if (ele.id) {
          arr.push({
            mapId: ele.id
          });
        }

        return arr;
      }, []);

      // console.log(JSON.stringify(mapList, null, 2));

      this.$api
        .objectManageBindMap({
          data: {
            locationObjectId: this.modal.item.locationObjectId,
            mapList: mapList
          }
        })
        .then(() => {
          this.$emit('handleBindMap');
          this.modalCancel();
          this.$Message.success(this.$t('base.optionSuccess'));
        });
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
