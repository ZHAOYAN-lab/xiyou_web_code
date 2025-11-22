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
            :label-width="120"
          >
            <FormItem :label="$t('serviceSet.table.file')" prop="localServerCleLicenseFileName">
              <div class="a">
                <div>{{ modal.data.localServerCleLicenseFileName }}</div>
                <sl-upload
                  :error-msg="modal.uploadErrorMsg"
                  :format="['license']"
                  @uploadFile="emitUpload"
                ></sl-upload>
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
import slToast from '@/components/SlToast/polling.js';

export default {
  name: 'ModalUpload',
  components: {},
  mixins: [],
  props: {},
  data() {
    return {
      modal: {
        show: false,
        title: {
          value: '上传授权文件'
        },
        data: {
          item: null,
          localServerCleLicenseFileName: '',
          upload: {
            annexFileName: '',
            annexSaveName: ''
          }
        },
        dataValidate: {
          localServerCleLicenseFileName: [
            {
              required: true,
              message:
                i18n.messages[i18n.locale].serviceSet.modal.localServerCleLicenseFileNameNotEmpty,
              trigger: 'blur'
            },
            {
              required: true,
              message:
                i18n.messages[i18n.locale].serviceSet.modal.localServerCleLicenseFileNameNotEmpty,
              trigger: 'change'
            }
          ]
        },
        uploadErrorMsg: i18n.messages[i18n.locale].serviceSet.modal.uploadErrorMsg
      }
    };
  },
  computed: {},
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {
      this.modal.title.value = this.$t('serviceSet.table.uploadFile');
    });
  },
  methods: {
    show(item) {
      let m = this.modal;
      let data = m.data;
      this.$refs.formValidate.resetFields();
      data.item = item;
      data.localServerCleLicenseFileName = '';
      // data.upload = {
      //   annexFileName: item.localServerCleLicenseFileName,
      //   annexSaveName: item.localServerCleLicenseSaveName
      // };

      m.show = true;
    },
    modalCancel() {
      let m = this.modal;
      m.show = false;
      slToast.close();
    },
    modalSure() {
      this.$refs.formValidate.validate((valid) => {
        if (valid) {
          // console.log('------');
          let data = this.modal.data;
          // console.log(JSON.stringify(data, null, 2));

          this.$api
            .serviceSetUploadAuthorizedFile({
              data: {
                localServerId: data.item.localServerId,
                localServerCleLicenseFileName: data.localServerCleLicenseFileName,
                localServerCleLicenseSaveName: data.upload.annexSaveName
              }
            })
            .then((res) => {
              // console.log(res);

              // let id = res;
              // todo 这里轮训一个接口 获取 授权文件是否授权成功
              slToast.loading(this.$t('serviceSet.modal.loading'));
              this.pollingUploadAuthorizedFileStatus(res);
            });
        }
      });
    },
    // 轮询上传文件生效状态
    pollingUploadAuthorizedFileStatus(res) {
      this.$api
        .serviceSetGetUploadAuthorizedFileStatus({
          loading: false,
          data: {
            key: res
          }
        })
        .then((status) => {
          // 0 执行中
          // -1 执行超时
          // 1 执行成功
          // 2 执行失败
          switch (status) {
            case 0:
              setTimeout(() => {
                this.pollingUploadAuthorizedFileStatus(res);
              }, 1000);

              break;
            case 1:
              this.$emit('handleAddEditBuild');
              this.modalCancel();
              this.$Message.success(this.$t('serviceSet.modal.loadingSuccess'));
              break;
            case -1:
              this.$Message.error(this.$t('serviceSet.modal.error2'));
              this.modalCancel();
              break;
            case 2:
              this.$Message.error(this.$t('serviceSet.modal.error2'));
              this.modalCancel();
              break;
          }
        });
    },
    // 授权文件上传完成回调
    emitUpload(data) {
      let md = this.modal.data;
      md.localServerCleLicenseFileName = data.annexFileName;
      md.upload = data;
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
