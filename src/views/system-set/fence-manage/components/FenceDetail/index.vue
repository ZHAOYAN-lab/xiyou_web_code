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
        <div class="info-card">
          <h4>{{ $t('fenceManage.infoTitle') }}</h4>
          <div class="info-item">
            <p>{{ $t('fenceManage.objectName') }}:</p>
            <span>{{ fenceInfo.objectName }}</span>
          </div>
          <div class="info-item">
            <p>{{ $t('fenceManage.belongType') }}:</p>
            <span>{{ fenceInfo.belongTypeLabel }}</span>
          </div>
          <div class="info-item">
            <p>{{ $t('fenceManage.icon') }}:</p>
            <img v-if="fenceInfo.iconUrl" :src="fenceInfo.iconUrl" class="icon-preview" alt="Icon" />
            <span v-else>{{ $t('base.none') }}</span>
          </div>
          <div class="info-item">
            <p>{{ $t('fenceManage.fenceName') }}:</p>
            <span>{{ fenceInfo.fenceName }}</span>
          </div>
          <div class="info-item">
            <p>{{ $t('fenceManage.fenceType') }}:</p>
            <span>{{ fenceInfo.fenceTypeLabel }}</span>
          </div>
        </div>
        <div class="l7-map-1">
          <sl-l7 v-if="modal.slMap.show" :id="'fence-detail-m'" ref="sll7" :fullscreen="false" />
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import pubData from '../../mixins/data'; 

export default {
  mixins: [pubData],
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
      },
      fenceInfo: {
        fenceName: '',
        fenceTypeLabel: '',
        objectName: '',
        belongTypeLabel: '',
        iconUrl: ''
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
    getFenceTypeLabel(value) {
        return '围栏类型' + value; 
    },
    getBelongTypeLabel(value) {
        return '货物种类' + value;
    },
    
    show(item) {
      let m = this.modal;
      m.show = true;
      m.title.value = this.$t('base.see');

      // 映射数据到 fenceInfo
      this.fenceInfo.fenceName = item.fenceName;
      this.fenceInfo.fenceTypeLabel = this.getFenceTypeLabel(item.fenceType);
      this.fenceInfo.objectName = item.objectName;
      this.fenceInfo.belongTypeLabel = this.getBelongTypeLabel(item.belongType); 
      this.fenceInfo.iconUrl = item.iconUrl;
      
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
            sll7.mapSetBackgroundImage(data);
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
.modal-content {
  display: flex;
  justify-content: space-between;
  height: 500px; 
}
.l7-map-1 {
  flex: 3;
  height: 100%;
}
.info-card {
  flex: 1.5;
  padding: 15px;
  border-right: 1px solid #eee;
  overflow-y: auto;
  h4 {
    margin-bottom: 15px;
    font-weight: bold;
    font-size: 16px;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
  }
}
.info-item {
  margin-bottom: 12px;
  p {
    font-weight: 500;
    color: #444;
    margin-right: 5px;
    display: inline-block;
    min-width: 65px;
  }
  span {
    color: #333;
    word-break: break-all;
  }
}
.icon-preview {
  width: 32px;
  height: 32px;
  vertical-align: middle;
  border: 1px solid #ccc;
  object-fit: contain;
}
</style>