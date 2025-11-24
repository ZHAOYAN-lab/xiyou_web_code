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
            :label-width="130"
          >
            <FormItem :label="$t('fenceManage.modal.map')" prop="mapId">
              <div class="cascader-wrapper sl-width-300">
                <sl-map-cascader ref="mapCascader" @onChange="mapOnChange" />
              </div>
            </FormItem>

            <FormItem :label="$t('fenceManage.fenceName')" prop="fenceName">
              <Input
                v-model="modal.data.fenceName"
                class="sl-width-300"
                :placeholder="$t('base.input')"
                clearable
              ></Input>
            </FormItem>

            <FormItem :label="$t('fenceManage.fenceType')" prop="fenceType">
              <Select
                v-model="modal.data.fenceType"
                :placeholder="$t('base.select')"
                class="sl-width-300"
              >
                <Option v-for="(item, index) in fenceTypeData" :key="index" :value="item.value">{{
                  item.label
                }}</Option>
              </Select>
            </FormItem>
            
            <FormItem :label="$t('fenceManage.objectName')" prop="objectName">
              <Input
                v-model="modal.data.objectName"
                class="sl-width-300"
                :placeholder="$t('base.input')"
                clearable
              ></Input>
            </FormItem>

            <FormItem :label="$t('fenceManage.belongType')" prop="belongType">
              <Select
                v-model="modal.data.belongType"
                :placeholder="$t('base.select')"
                class="sl-width-300"
              >
                <Option v-for="(item, index) in belongTypeData" :key="index" :value="item.value">{{
                  item.label
                }}</Option>
              </Select>
            </FormItem>

            <FormItem :label="$t('fenceManage.icon')" prop="iconUrl">
              <SlUpload 
                v-model="modal.data.iconUrl" 
                :target-key="'iconUrl'" 
                :limit-size="10" 
                :limit-unit="'kb'" 
                :limit-count="1"
                :hint="$t('fenceManage.uploadHint')"
              />
            </FormItem>
          </Form>
        </div>

        <div class="map-content">
          <div class="l7-map-1">
            <sl-l7
              v-if="modal.slMap.show"
              :id="'l7-map-add-fence'"
              ref="sll7"
              :fullscreen="false"
            />
          </div>
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
import pubData from '../../mixins/data';
import i18n from '@/language';

export default {
  name: 'AddXinbiao',
  components: {},
  mixins: [pubData],
  props: {},
  data() {
    return {
      modal: {
        show: false,
        title: {
          value: ''
        },
        data: {
          mapId: '',
          fenceName: '',
          fenceType: '',
          objectName: '',
          belongType: '',
          iconUrl: ''
        },
        dataValidate: {
          mapId: [
            {
              required: true,
              type: 'number',
              message: i18n.messages[i18n.locale].fenceManage.modal.mapIdNotEmpty,
              trigger: 'change'
            }
          ],
          fenceName: [
            {
              required: true,
              message: i18n.messages[i18n.locale].fenceManage.modal.fenceNameNotEmpty,
              trigger: 'blur'
            }
          ],
          fenceType: [
            {
              required: true,
              type: 'number',
              message: i18n.messages[i18n.locale].fenceManage.modal.fenceTypeNotEmpty,
              trigger: 'change'
            }
          ],
          objectName: [
            {
              required: true,
              message: i18n.messages[i18n.locale].base.objectNameNotEmpty,
              trigger: 'blur'
            }
          ],
          belongType: [
            {
              required: true,
              type: 'number', 
              message: i18n.messages[i18n.locale].base.belongTypeNotEmpty,
              trigger: 'change'
            }
          ]
        },
        slMap: {
          show: false
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
    show(item) {
      let m = this.modal;
      let data = m.data;

      this.$refs.formValidate.resetFields();

      if (item) {
        // 编辑模式
        let mapId = item.fenceMap.mapId;
        m.title.value = this.$t('fenceManage.edit');
        m.item = item;
        
        // 设置地图级联选择器
        this.$refs.mapCascader.setValue(mapId);
        
        // 填充表单数据
        data.fenceName = item.fenceName || '';
        data.fenceType = item.fenceType || '';
        data.objectName = item.objectName || '';
        data.belongType = item.belongType || '';
        data.iconUrl = item.iconUrl || '';

        this.$nextTick(() => {
          this.mapOnChange(mapId, [
            {
              fenceId: item.fenceId,
              type: item.fenceType,
              points: item.fenceContent
            }
          ]);
        });
      } else {
        // 新增模式
        m.title.value = this.$t('fenceManage.add');
        m.item = null;
        
        // 重置表单数据
        data.fenceName = '';
        data.fenceType = '';
        data.objectName = '';
        data.belongType = '';
        data.iconUrl = '';

        this.$refs.mapCascader.setValue();
      }

      m.show = true;
    },

    // 切换地图
    mapOnChange(value, fenceData) {
      let m = this.modal;
      m.data.mapId = value;

      this.$api
        .pubGetMapDetailByMapId({
          data: {
            mapId: value
          }
        })
        .then((res) => {
          this.sll7Init(res, fenceData);
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
            // 设置底图
            sll7.mapSetBackgroundImage(data);
            // 设置围栏（可编辑）
            sll7.polygonLayerSetEdit(fenceData ? fenceData : []);
          });
        });
      });
    },

    modalCancel() {
      let m = this.modal;
      m.slMap.show = false;
      m.show = false;
    },

    modalSure() {
      this.$refs.formValidate.validate((valid) => {
        if (valid) {
          let m = this.modal;
          let data = m.data;
          let fp = this.$refs.sll7.polygonLayerGetData();

          let warning = '';

          if (!fp.length) {
            warning = this.$t('fenceManage.modal.w1');
          } else if (fp.length > 1) {
            warning = this.$t('fenceManage.modal.w2');
          }

          if (!warning) {
            let updata = {
              fenceMap: {
                mapId: this.$refs.mapCascader.getValue()[2]
              },
              fenceId: m.item ? m.item.fenceId : '',
              fenceName: data.fenceName,
              fenceType: data.fenceType,
              fenceContent: fp[0],
              objectName: data.objectName,
              belongType: data.belongType,
              iconUrl: data.iconUrl
            };

            this.$api.fenceManageAddEdit({ data: updata }).then(() => {
              this.$emit('handleRefreshTable');
              this.modalCancel();
              this.$Message.success(this.$t('base.optionSuccess'));
            });
          } else {
            this.$Message.warning(warning);
          }
        }
      });
    }
  }
};
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>