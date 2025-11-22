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
            :label-width="240"
          >
            <FormItem :label="$t('floorSet.uploadCPA')" prop="cpa">
              <div>{{ modal.data.cpa }}</div>
              <sl-upload
                :error-msg="modal.uploadErrorMsg"
                :format="['cpa']"
                @uploadFile="emitUpload"
              />
            </FormItem>
            <FormItem :label="$t('floorSet.localService')" prop="serviceValue">
              <Select
                v-model="modal.data.serviceValue"
                :disabled="modal.data.serviceDisabled"
                filterable
                class="sl-width-300"
                :placeholder="$t('base.select')"
                clearable
              >
                <Option
                  v-for="(item, index) in modal.data.serviceData"
                  :key="index"
                  :value="item.value"
                  >{{ item.label }}</Option
                >
              </Select>
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
  name: 'AddXinbiao',
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
          cpa: '',
          serviceValue: '',
          serviceDisabled: false,
          serviceData: [],
          upload: {
            annexFileName: '',
            annexSaveName: ''
          }
        },
        dataValidate: {
          cpa: [
            {
              required: true,
              message: i18n.messages[i18n.locale].floorSet.modal.cpaNameNotEmpty,
              trigger: 'change',
              type: 'string'
            }
          ],
          serviceValue: [
            {
              required: true,
              type: 'number',
              message: i18n.messages[i18n.locale].floorSet.modal.serviceNotEmpty,
              trigger: 'change'
            }
          ]
        },

        uploadErrorMsg: i18n.messages[i18n.locale].floorSet.modal.uploadErrorMsg
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
      this.$refs.formValidate.resetFields();
      this.getServiceList();
      let m = this.modal;
      let data = m.data;
      if (item) {
        // 编辑
        m.title.value = this.$t('floorSet.table.renew');

        data.cpa = item.localServerCpaFileName;
        data.serviceValue = item.localServerId;
        data.serviceDisabled = true;
        data.upload = {
          annexFileName: item.localServerCpaFileName,
          annexSaveName: item.localServerCpaSaveName
        };
      } else {
        // 添加
        m.title.value = this.$t('base.add');

        data.cpa = '';
        data.serviceValue = '';
        data.serviceDisabled = false;
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

      slToast.close();
    },
    modalSure() {
      console.log(JSON.stringify(this.modal.data, null, 2));
      this.$refs.formValidate.validate((valid) => {
        if (valid) {
          let data = this.modal.data;

          this.$api
            .floorSetAddEditCpa({
              data: {
                localServerId: data.serviceValue,
                localServerCpaFileName: data.upload.annexFileName,
                localServerCpaSaveName: data.upload.annexSaveName,
                localServerBuilding: {
                  buildingId: this.$route.query.buildingId
                }
              }
            })
            .then((res) => {
              slToast.loading();
              this.pollingSetCpaStatus(res);
            });
        }
      });
    },
    // 轮询更新cpa 生效状态
    pollingSetCpaStatus(res) {
      this.$api
        .floorGetUploadCpaStatus({
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
                this.pollingSetCpaStatus(res);
              }, 3000);

              break;
            case 1:
              this.$emit('handleAddEditBuild');
              this.modalCancel();
              this.$Message.success(this.$t('base.optionSuccess'));
              break;
            case -1:
              this.$Message.error(this.$t('serviceSet.modal.error1'));
              this.modalCancel();
              break;
            case 2:
              this.$Message.error(this.$t('serviceSet.modal.error2'));
              this.modalCancel();
              break;
          }
        });
    },

    // 上传文件回调
    emitUpload(data) {
      let md = this.modal.data;
      md.cpa = data.annexFileName;
      md.upload = data;
    },
    // 获取服务列表
    getServiceList() {
      this.$api
        .floorGetLocalServiceAvailable({
          loading: false
        })
        .then((res) => {
          this.modal.data.serviceData = res.reduce((arr, ele) => {
            arr.push({
              value: ele.localServerId,
              label: ele.localServerMac
            });
            return arr;
          }, []);
        });
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
