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
        <Form ref="formValidate" :model="modal.data" :rules="modal.dataValidate" :label-width="150">
          <FormItem :label="$t('objectManage.table.name')" prop="locationObjectName">
            <Input
              v-model="modal.data.locationObjectName"
              class="sl-width-300"
              :placeholder="$t('base.input')"
              clearable
            ></Input>
          </FormItem>

          <FormItem :label="$t('objectManage.table.type')" prop="locationObjectType">
            <Select
              v-model="modal.data.locationObjectType"
              :placeholder="$t('base.select')"
              class="sl-width-300"
            >
              <Option
                v-for="(item, index) in mixinConfig.BEACON_AND_LOCATION_OBJECT_TYPE.data"
                :key="index"
                :value="item.value"
                >{{ item.label }}</Option
              >
            </Select>
          </FormItem>

          <FormItem :label="$t('objectManage.table.icon')">
            <div class="flex-start">
              <sl-upload
                :format="['png', 'jpg', 'jpeg']"
                :size-error-msg="modal.sizeErrorMsg"
                :size="10"
                @uploadFile="emitUpload"
              ></sl-upload>
              <img class="sl-preview-image" :src="modal.data.locationObjectImgViewUrl" />
            </div>
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
import mixin_map from '@/mixins/mixin-map';
import mixin_config from '@/mixins/mixin-config';
import i18n from '@/language'; // 国际化

export default {
  name: 'AddObject',
  components: {},
  mixins: [mixin_map, mixin_config],
  props: {},
  data() {
    return {
      modal: {
        show: false,
        title: {
          value: ''
        },
        data: {
          locationObjectName: '',
          locationObjectType: '',
          locationObjectImgViewUrl: '',
          upload: {
            annexFileName: '',
            annexSaveName: ''
          }
        },
        dataValidate: {
          locationObjectName: [
            {
              required: true,
              message: i18n.messages[i18n.locale].objectManage.modal.nameNotEmpty,
              trigger: 'blur'
            }
          ],
          locationObjectType: [
            {
              required: true,
              type: 'number',
              message: i18n.messages[i18n.locale].objectManage.modal.typeNotEmpty,
              trigger: 'change'
            }
          ]
        },

        sizeErrorMsg: i18n.messages[i18n.locale].objectManage.modal.sizeError
      }
    };
  },
  computed: {},
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {
      this.pubGetConfig().then(() => {});
    });
  },
  methods: {
    show(item) {
      let m = this.modal;
      let data = m.data;
      this.$refs.formValidate.resetFields();

      if (item) {
        // 编辑
        m.title.value = this.$t('base.edit');
        m.item = item;
        data.locationObjectName = item.locationObjectName;
        data.locationObjectType = item.locationObjectType;
        data.locationObjectImgViewUrl = item.locationObjectImgViewUrl;
        data.upload = {
          annexFileName: item.locationObjectImgFileName,
          annexSaveName: item.locationObjectImgSaveName
        };
      } else {
        // 添加
        m.title.value = this.$t('base.add');
        m.item = null;

        data.locationObjectName = '';
        data.locationObjectType = '';
        data.locationObjectImgViewUrl = '';
        data.upload = {
          annexFileName: '',
          annexSaveName: ''
        };
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
            locationObjectId: m.item ? m.item.locationObjectId : '',
            locationObjectName: data.locationObjectName,
            locationObjectType: data.locationObjectType,
            locationObjectImgFileName: data.upload.annexFileName,
            locationObjectImgSaveName: data.upload.annexSaveName
          };

          this.$api.objectManageAddEdit({ data: this.$pub.slDeleteEmptyField(updata) }).then(() => {
            this.$emit('handleAddEdit');
            this.modalCancel();
            this.$Message.success(this.$t('base.optionSuccess'));
          });
        }
      });
    },
    // 图片上传完成回调
    emitUpload(data) {
      let md = this.modal.data;

      md.locationObjectImgViewUrl = data.annexViewUrl;
      md.upload = data;
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
