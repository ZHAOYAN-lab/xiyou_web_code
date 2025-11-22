<template>
  <div>
    <Modal
      v-model="modal.show"
      :class-name="mixinModal.class"
      :title="modal.title.value"
      :width="mixinModal.maxWidth"
      :mask-closable="false"
      :before-close="modalCancel"
      :footer-hide="true"
    >
      <div class="modal-content">
        <div class="l7-map-1">
          <sl-l7 v-if="modal.slMap.show" :id="'fence-detail-m'" ref="sll7" :fullscreen="false" />
        </div>
      </div>
    </Modal>
  </div>
</template>
<script>
export default {
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
      m.show = true;

      m.title.value = this.$t('base.see');

      this.$api
        .pubGetMapDetailByMapId({
          data: {
            mapId: item.fenceMap.mapId
          }
        })
        .then((res) => {
          this.sll7Init(res, [{ type: item.fenceType, points: item.fenceContent }]);
        });
    },

    sll7Init(data, fenceData) {
      let m = this.modal;
      m.slMap.show = false;
      this.$nextTick(() => {
        m.slMap.show = true;

        this.$nextTick(() => {
          let sll7 = this.$refs.sll7;

          sll7.mapInit().then(() => {
            // 底图
            sll7.mapSetBackgroundImage(data);

            //围栏(
            sll7.polygonLayerSetData(fenceData ? fenceData : []);
          });
        });
      });
    },

    modalCancel() {
      let m = this.modal;
      m.slMap.show = false;
      m.show = false;
    },
    modalSure() {}
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
