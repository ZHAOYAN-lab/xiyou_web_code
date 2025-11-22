<template>
  <div>
    <Modal
      v-model="modal.show"
      :class-name="mixinModal.class"
      :title="modal.title.value"
      :width="mixinModal.maxWidth"
      :before-close="modalCancel"
      :mask-closable="false"
      :footer-hide="true"
    >
      <div class="modal-content">
        <sl-l7 v-if="modal.slMap.show" ref="sll7" :fullscreen="false" />
      </div>
    </Modal>
  </div>
</template>
<script>
export default {
  name: 'FloorView',
  components: {},
  mixins: [],
  props: {},
  data() {
    return {
      modal: {
        show: false,
        title: {
          value: ''
        },
        slMap: {
          show: false
        }
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
      let m = this.modal;
      m.title.value = this.$t('buildingSet.table.preview');
      m.show = true;
      m.item = item;

      this.$api
        .pubGetMapDetailByMapId({
          data: {
            mapId: item.mapId
          }
        })
        .then((res) => {
          this.sll7Init(res);
        });
    },

    sll7Init(data) {
      // let sll7 = this.$refs.sll7;

      // if (sll7.mapGetScene()) {
      //   sll7.mapClear();
      //   setTimeout(() => {
      //     this.handleL7Map(data);
      //   }, 1000);
      // } else {
      //   sll7.mapInit().then(() => {
      //     // console.log('获取数据后渲染');
      //     this.handleL7Map(data);
      //   });
      // }

      let m = this.modal;
      m.slMap.show = false;

      this.$nextTick(() => {
        m.slMap.show = true;
        this.$nextTick(() => {
          let sll7 = this.$refs.sll7;

          sll7.mapInit().then(() => {
            // 底图
            sll7.mapSetBackgroundImage(data);

            // 基站
            sll7.jizhanSetData(data);

            // 围栏
            this.fenceManageGetDataByMapId();
          });
        });
      });
    },

    // 按照地图ID查找围栏
    fenceManageGetDataByMapId() {
      // console.log('根据地图id获取围栏信息');

      this.$api
        .fenceManageGetDataByMapId({ data: { mapId: this.modal.item.mapId } })
        .then((res) => {
          //围栏(不可编辑)
          this.$refs.sll7.polygonLayerSetData(
            res.reduce((arr, ele) => {
              arr.push({
                fenceId: ele.fenceId,
                fenceName: ele.fenceName,
                points: ele.fenceContent,
                type: ele.fenceType
              });
              return arr;
            }, [])
          );
        });
    },

    modalCancel() {
      let m = this.modal;
      m.slMap.show = false;
      m.show = false;
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
