<template>
  <div>
    <Modal
      v-model="modal.show"
      :class-name="mixinModal.class"
      :title="modal.title.value"
      :width="mixinModal.maxWidth"
      :mask-closable="false"
      :before-close="modalCancel"
    >
      <div class="modal-content">
        <div class="form">
          <Form
            ref="formValidate"
            :model="modal.data"
            :rules="modal.dataValidate"
            :label-width="180"
          >
            <FormItem :label="$t('buildingSet.table.name')" prop="buildingName">
              <Input
                v-model="modal.data.buildingName"
                class="sl-width-300"
                :placeholder="$t('base.input')"
                clearable
                maxlength="30"
              ></Input>
            </FormItem>
            <FormItem :label="$t('buildingSet.table.address')" prop="buildingAddress">
              <Input
                v-model="modal.data.buildingAddress"
                class="sl-width-300"
                :placeholder="$t('base.input')"
                clearable
                maxlength="30"
              ></Input>
            </FormItem>

            <FormItem :label="$t('buildingSet.image')">
              <div class="flex-start p-image">
                <Icon
                  v-if="modal.data.buildingImgUrl"
                  class="delete-span"
                  type="ios-close-circle-outline"
                  size="20"
                  @click="deleteImage"
                />
                <sl-upload
                  :size="2 * 1024"
                  :format="['png', 'jpg', 'jpeg']"
                  :size-error-msg="modal.sizeErrorMsg"
                  @uploadFile="emitUpload"
                ></sl-upload>
                <img class="sl-preview-image" :src="modal.data.buildingImgUrl" />
              </div>
            </FormItem>
          </Form>
        </div>
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
  name: 'AddBuild',
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
        data: {
          item: null,
          buildingName: '',
          buildingAddress: '',
          buildingImgUrl: '',
          upload: {
            annexFileName: '',
            annexSaveName: ''
          }
        },
        dataValidate: {
          buildingName: [
            {
              required: true,
              message: i18n.messages[i18n.locale].buildingSet.modal.nameNotEmpty,
              trigger: 'blur'
            }
          ],
          buildingAddress: [
            {
              required: true,
              message: i18n.messages[i18n.locale].buildingSet.modal.addressNotEmpty,
              trigger: 'blur'
            }
          ]
          // buildingImgUrl: [
          //   {
          //     required: true,
          //     message: i18n.messages[i18n.locale].buildingSet.modal.imageNotEmpty,
          //     trigger: 'blur'
          //   },
          //   {
          //     required: true,
          //     message: i18n.messages[i18n.locale].buildingSet.modal.imageNotEmpty,
          //     trigger: 'change'
          //   }
          // ]
        },
        sizeErrorMsg: i18n.messages[i18n.locale].buildingSet.modal.sizeErrorMsg
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
      let data = m.data;

      this.$refs.formValidate.resetFields();

      if (item) {
        // 编辑
        m.title.value = this.$t('base.edit');

        data.item = item;
        data.buildingName = item.buildingName;
        data.buildingAddress = item.buildingAddress;
        data.buildingImgUrl = item.buildingImgViewUrl;
        data.upload = {
          annexFileName: item.buildingImgFileName,
          annexSaveName: item.buildingImgSaveName
        };
      } else {
        // 添加
        m.title.value = this.$t('base.add');

        data.item = null;
        data.buildingName = '';
        data.buildingAddress = '';
        data.buildingImgUrl = '';
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
          let data = this.modal.data;
          let updata = {
            buildingId: data.item ? data.item.buildingId : '',
            buildingName: data.buildingName,
            buildingAddress: data.buildingAddress,
            buildingImgFileName: data.upload.annexFileName,
            buildingImgSaveName: data.upload.annexSaveName
          };

          this.$api.buildingSetAddEdit({ data: updata }).then(() => {
            this.$emit('handleAddEditBuild');
            this.modalCancel();
            this.$Message.success(this.$t('base.optionSuccess'));
          });
        }
      });
    },
    // 图片上传完成回调
    emitUpload(data) {
      let md = this.modal.data;

      md.buildingImgUrl = data.annexViewUrl;
      md.upload = data;
    },
    deleteImage() {
      let data = this.modal.data;
      data.buildingImgUrl = '';
      data.upload = {
        annexFileName: '',
        annexSaveName: ''
      };
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
