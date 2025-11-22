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
        <Form ref="formValidate" :model="modal.data" :rules="modal.dataValidate" :label-width="180">
          <FormItem :label="$t('beaconManage.table.mac')" prop="beaconMac">
            <Input
              v-model="modal.data.beaconMac"
              class="sl-width-300"
              :placeholder="$t('base.input')"
              clearable
              maxlength="40"
            ></Input>
          </FormItem>
          <FormItem :label="$t('beaconManage.table.model')">
            <Input
              v-model="modal.data.beaconProduct"
              class="sl-width-300"
              :placeholder="$t('base.input')"
              clearable
            ></Input>
          </FormItem>
          <FormItem :label="$t('beaconManage.table.type')" prop="beaconType">
            <Select
              v-model="modal.data.beaconType"
              class="sl-width-300"
              :placeholder="$t('base.select')"
            >
              <Option
                v-for="(item, index) in modal.data.type.data"
                :key="index"
                :value="item.value"
                >{{ item.label }}</Option
              >
            </Select>
          </FormItem>

          <FormItem :label="$t('beaconManage.table.remark')">
            <Input
              v-model="modal.data.beaconRemark"
              maxlength="30"
              class="sl-width-300"
              :placeholder="$t('base.input')"
              clearable
            ></Input>
          </FormItem>
        </Form>
      </div>

      <div slot="footer">
        <Button @click="modalCancel">{{ $t('base.cancel') }}</Button>
        <Button type="primary" @click="modalSure">{{ $t('base.sure') }}</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import mixin_config from '@/mixins/mixin-config';
import i18n from '@/language'; // 国际化

export default {
  name: 'AddXinbiao',
  components: {},
  mixins: [mixin_config],
  props: {},
  data() {
    const beaconMac = (rule, value, callback) => {
      if (this.$pub.slHasChinese(value)) {
        callback(
          new Error(`${this.$t('baseStation.table.mac')}${this.$t('base.warning.chinese')}`)
        );
      } else {
        callback();
      }
    };
    return {
      modal: {
        show: false,
        title: {
          value: ''
        },
        data: {
          beaconMac: '',
          beaconProduct: '',
          beaconType: '',
          beaconRemark: '',
          type: {
            data: [],
            disabled: false
          }
        },
        dataValidate: {
          beaconMac: [
            {
              required: true,
              message: i18n.messages[i18n.locale].beaconManage.warning.macNotEmpty
            },
            { validator: beaconMac, trigger: 'blur' }
          ],
          beaconType: [
            {
              required: true,
              type: 'number',
              message: i18n.messages[i18n.locale].beaconManage.warning.typeNotEmpat,
              trigger: 'change'
            }
          ]
        }
      }
    };
  },
  computed: {},
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {
      let type = this.mixinConfig.BEACON_AND_LOCATION_OBJECT_TYPE;
      this.modal.data.type.data = [...type.data, type.none];
    });
  },
  methods: {
    show(item) {
      let m = this.modal;
      let data = m.data;

      console.log(item);
      this.$refs.formValidate.resetFields();
      if (item) {
        // 编辑
        m.title.value = this.$t('base.edit');
        m.item = item;
        // if (item.beaconLocationObject) {
        //   data.type.disabled = true;
        // }

        data.beaconMac = item.beaconMac;
        data.beaconProduct = item.beaconProduct;
        data.beaconType = item.beaconType;
        data.beaconRemark = item.beaconRemark;
      } else {
        // 添加
        m.title.value = this.$t('beaconManage.add');
        m.item = null;
        data.type.disabled = false;

        data.beaconMac = '';
        data.beaconProduct = '';
        data.beaconType = '';
        data.beaconRemark = '';
      }

      m.show = true;
    },
    modalCancel() {
      let m = this.modal;
      m.show = false;
    },
    modalSure() {
      this.$refs.formValidate.validate((valid) => {
        if (valid) {
          let m = this.modal;
          let data = m.data;

          let updata = {
            beaconId: m.item ? m.item.beaconId : '',
            beaconMac: data.beaconMac,
            beaconProduct: data.beaconProduct,
            beaconType: data.beaconType,
            beaconRemark: data.beaconRemark
          };

          this.$api.beaconManageAddBeacon({ data: updata }).then(() => {
            this.$emit('handleRefreshTable');
            this.modalCancel();
            this.$Message.success(this.$t('base.optionSuccess'));
          });
        }
      });
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
