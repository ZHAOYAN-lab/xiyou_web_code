<template>
  <div>
    <Modal
      v-model="modal.show"
      :class-name="mixinModal.class"
      :title="modal.title"
      :width="mixinModal.width"
      :mask-closable="false"
      :before-close="modalCancel"
    >
      <div class="modal-content">
        <Table
          ref="tables"
          class="sl-table"
          highlight-row
          :border="true"
          :max-height="modal.table.maxHeight"
          :columns="modal.table.columns"
          :data="modal.table.data"
          :no-data-text="modal.table.noDataText"
          @on-row-click="tableOnRowClick"
        ></Table>
      </div>

      <div slot="footer">
        <Button @click="modalCancel">{{ $t('base.cancel') }}</Button>
        <Button type="primary" @click="modalSure">{{ $t('base.sure') }}</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import i18n from '@/language'; // 国际化

export default {
  name: 'SetObject',
  components: {},
  mixins: [],
  props: {},
  data() {
    return {
      modal: {
        show: false,
        title: i18n.messages[i18n.locale].beaconManage.table.setObject,

        table: {
          maxHeight: 300,
          noDataText: i18n.messages[i18n.locale].beaconManage.bindObjectNoDataText,
          data: [],
          columns: []
        }
      }
    };
  },
  computed: {},
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {
      this.modal.table.columns = [
        {
          align: 'center',
          key: 'checkBox',
          width: 60,
          render: (h, params) => {
            return h('div', [
              h('Checkbox', {
                props: {
                  value: params.row.checkBox
                },
                on: {
                  'on-change': (e) => {
                    this.modal.table.data.forEach((items) => {
                      this.$set(items, 'checkBox', false);
                    });
                    this.modal.table.data[params.index].checkBox = e;
                  }
                }
              })
            ]);
          }
        },

        {
          title: this.$t('beaconManage.table.objectName'),
          key: 'locationObjectName'
        }
      ];
    });
  },
  methods: {
    show(item) {
      this.objectManageGetAll(item);
    },
    modalCancel() {
      let m = this.modal;
      m.show = false;
    },
    modalSure() {
      let m = this.modal;
      let id = m.table.data.reduce((id, item) => {
        if (item.checkBox) {
          id = item.locationObjectId;
        }

        return id;
      }, '');

      console.log('被选中对象：', id);

      this.$api
        .beaconManageBindObject({
          data: {
            beaconId: m.item.beaconId,
            beaconLocationObject: {
              locationObjectId: id
            }
          }
        })
        .then(() => {
          this.$emit('handleRefreshTable');
          this.modalCancel();
          this.$Message.success(this.$t('base.optionSuccess'));
        });

      // if (id) {

      // } else {
      //   this.$Message.warning(this.$t('beaconManage.warning.bindObjNotEmpty'));
      // }
    },
    // 点击表格行
    tableOnRowClick(row, index) {
      let e = row.checkBox;

      this.modal.table.data.forEach((items) => {
        this.$set(items, 'checkBox', false);
      });
      this.modal.table.data[index].checkBox = !e;
    },

    objectManageGetAll(item) {
      this.$api.objectManageGetListByType({ data: { beaconId: item.beaconId } }).then((res) => {
        let m = this.modal;
        let table = m.table;
        m.show = true;
        m.item = item;

        console.log(JSON.stringify(item, null, 2));

        if (item.beaconLocationObject) {
          res.forEach((ele) => {
            if (ele.locationObjectId === item.beaconLocationObject.locationObjectId) {
              ele.checkBox = true;
            }
          });
        }

        table.data = res;
      });
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
