<!--
 * @Author: shenlan
 * @Company: 蜂鸟创新
 * @Date: 2021-11-22 13:58:27
 * @LastEditors: shenlan
 * @LastEditTime: 2023-08-02 16:56:59
 * @Description: 文件上传组件
-->
<template>
  <div class="sl-com-upload">
    <div class="up-wrapper">
      <Upload
        ref="upload"
        class="ivu-upload-drag"
        type="drag"
        :headers="headers"
        :action="url"
        :format="format"
        :show-upload-list="false"
        :on-format-error="handleFormatError"
        :before-upload="handleBeforeUpload"
        :on-progress="handleProgress"
        :on-success="handleSuccess"
        :on-error="handlerError"
      >
        <div class="btn">
          <Icon type="ios-cloud-upload-outline" size="20"></Icon>
        </div>
      </Upload>
    </div>

    <!-- 进度条 -->
    <Modal
      v-model="modal.show"
      class-name="vertical-center-modal"
      :title="uploadProgress"
      :width="500"
      :mask-closable="false"
      :footer-hide="true"
      :closable="false"
    >
      <div style="height: 90px; padding: 0 30px; padding-top: 20px">
        <Progress :percent="modal.percent" :stroke-width="20" status="active" text-inside />
      </div>
    </Modal>
  </div>
</template>
<script>
import config from '@/config/index';
import { catchToken } from '@/lib/js/cache.js';
export default {
  name: 'SlUpload',
  components: {},
  props: {
    format: {
      type: Array,
      default: function () {
        return [];
      }
    },
    errorMsg: {
      type: String,
      default: ''
    },
    sizeErrorMsg: {
      type: String,
      default: ''
    },

    size: {
      type: Number,
      default: 1000000000000000
    }

    // //最大上传文件数量
    // max: {
    //   type: Number,
    //   default: 1
    // }
  },
  data() {
    return {
      //配置 url 头
      headers: {},

      //文件上传url
      url: config.baseUrl + '/ifengniao/cloud/common/file/upload',

      //进度条弹窗
      modal: {
        show: false,
        percent: 0
      },
      uploadProgress: '',

      item: {}
    };
  },
  computed: {},
  watch: {},
  created: function () {},
  beforeDestroy() {},
  mounted: function () {
    this.$nextTick(() => {
      this.headers = {
        Authorization: catchToken.get()
      };
      this.uploadProgress = this.$t('base.upload.progress');
    });
  },
  methods: {
    /*******************************正常上传文件*******************************/

    //上传前
    handleBeforeUpload(file) {
      // console.log(file);
      if (file && file.size) {
        let size = file.size / 1024;

        if (size > this.size) {
          this.$Message.warning(this.sizeErrorMsg);
          return false;
        } else {
          this.progressModalShow();
        }
      } else {
        this.$Message.warning(this.$t('base.upload.emptyError'));
        return false;
      }
    },
    //上传中
    handleProgress(event) {
      // console.log('上传中========');

      let m = this.modal;

      event.target.onprogress = (event) => {
        m.percent = parseFloat(((event.loaded / event.total) * 100).toFixed(2));

        // console.log(parseFloat(((event.loaded / event.total) * 100).toFixed(2)));

        this.$forceUpdate();
      };
    },

    //显示上传进度弹窗
    progressModalShow() {
      let m = this.modal;
      m.percent = 0;
      m.show = true;
    },

    //关闭上传进度弹窗
    progressModalHide() {
      let m = this.modal;
      m.show = false;
    },

    //上传完成
    handleSuccess(res, file) {
      this.progressModalHide();
      this.$Message.success(this.$t('base.upload.success'));

      if (res.code === '0000') {
        let data = res.detail;
        // let item = this.uploadList[0];
        // item.size = res.data.fileSize;
        // item.filePath = res.data.fileName;

        // console.log(JSON.stringify(data, null, 2));

        this.item = {
          aid: '',
          annexFileName: file.name,
          annexSaveName: data.name,
          annexViewUrl: data.url
        };

        this.emitUpload();
      } else {
        this.$Message.error(res.msg);
      }
    },

    //上传失败
    handlerError() {
      this.progressModalHide();
      this.$Message.error(this.$t('base.upload.fail'));
    },
    //验证上传文件格式
    // eslint-disable-next-line no-unused-vars
    handleFormatError(error, file) {
      this.progressModalHide();

      this.$Message.warning(this.errorMsg ? this.errorMsg : this.$t('base.upload.fileTypeError'));
    },

    //向外抛出数据
    emitUpload() {
      this.$emit('uploadFile', this.item);
    },

    //获取当前上传列表数据
    getUploadData() {
      return this.item;
    }
  }
  /*******************************正常上传文件*******************************/
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
