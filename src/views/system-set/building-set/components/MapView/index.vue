<template>
  <div>
    <Modal
      v-model="modal.show"
      :class-name="mixinModal.class"
      :title="modal.title.value"
      :width="mixinModal.maxWidth"
      :mask-closable="false"
      :footer-hide="true"
    >
      <div class="modal-content">
        <img :src="modal.image" alt="" />
      </div>
    </Modal>
  </div>
</template>
<script>
export default {
  name: 'MapView',
  components: {},

  props: {},
  data() {
    return {
      modal: {
        show: false,
        title: {
          value: '预览'
        },
        image: 'https://www.ifengniao.com/upload/ybimg/room.png'
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
      m.image = item.buildingImgViewUrl;
      m.show = true;
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
