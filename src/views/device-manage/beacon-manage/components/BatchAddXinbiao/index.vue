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
        <Form ref="formValidate" :model="modal.data" :rules="modal.dataValidate" :label-width="250">
          <FormItem :label="$t('beaconManage.downloadscv')">
            <Button type="primary" @click="downloadFile">{{ $t('base.download') }}</Button>
          </FormItem>
          <FormItem :label="$t('beaconManage.uploadFile')" prop="saveName">
            <div class="flex-start">
              <sl-upload :format="modal.format" @uploadFile="emitUpload" />
              <p>{{ modal.data.upload.annexFileName }}</p>
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
import i18n from '@/language'; // 国际化
import mixin_config from '@/mixins/mixin-config';
export default {
  name: 'BatchAddXinbiao',
  components: {},
  mixins: [mixin_config],
  props: {},
  data() {
    return {
      modal: {
        show: false,
        title: {
          value: ''
        },
        format: ['csv'], //上传文件格式

        data: {
          saveName: '',
          upload: {
            annexFileName: '',
            annexSaveName: ''
          }
        },
        dataValidate: {
          saveName: [
            {
              required: true,
              message: i18n.messages[i18n.locale].beaconManage.warning.fileNotEmpty,
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
    this.$nextTick(() => {});
  },
  methods: {
    show() {
      let m = this.modal;

      let data = m.data;

      this.$refs.formValidate.resetFields();
      m.title.value = this.$t('beaconManage.batchAdd');

      data.saveName = '';
      data.upload = {
        annexFileName: '',
        annexSaveName: ''
      };

      m.show = true;
    },
    modalCancel() {
      let m = this.modal;
      m.show = false;
    },
    modalSure() {
      this.$refs.formValidate.validate((valid) => {
        if (valid) {
          this.$api
            .beaconManageBatchAddBeacon({
              data: {
                langType: this.mixinConfig.LANGUAGE[i18n.locale],
                saveName: this.modal.data.upload.annexSaveName
              }
            })
            .then(() => {
              this.$emit('handleRefreshTable');
              this.modalCancel();
              this.$Message.success(this.$t('base.optionSuccess'));
            });
        }
      });
    },

    // 下载通用文件
    downloadFile() {
      this.$api.beaconManageDownloadExampleFile();
    },
    // 图片上传完成回调
    emitUpload(data) {
      let md = this.modal.data;

      md.saveName = data.annexFileName;
      md.upload = data;
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
