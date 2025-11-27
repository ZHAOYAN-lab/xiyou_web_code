<template>
  <Modal
    v-model="visible"
    :title="isEdit ? '编辑商品区域' : '新增商品区域'"
    :width="700"
    :mask-closable="false"
  >
    <Form
      ref="formRef"
      :model="form"
      :rules="rules"
      :label-width="100"
    >
      <!-- 地图选择（复刻围栏的 sl-map-cascader 思路） -->
      <FormItem label="地图" prop="mapId">
        <div class="sl-width-300">
          <!-- 你项目里已经有的组件，围栏在用的那个 -->
          <sl-map-cascader ref="mapCascader" @onChange="mapOnChange" />
        </div>
      </FormItem>

      <FormItem label="对象名称" prop="objectName">
        <Input
          v-model="form.objectName"
          class="sl-width-300"
          placeholder="请输入对象名称"
          clearable
        />
      </FormItem>

      <FormItem label="所属类型" prop="belongType">
        <Select
          v-model="form.belongType"
          class="sl-width-300"
          placeholder="请选择所属类型"
          clearable
        >
          <!-- 这里你可以改成自己真正的枚举 -->
          <Option value="类型A">类型A</Option>
          <Option value="类型B">类型B</Option>
          <Option value="类型C">类型C</Option>
        </Select>
      </FormItem>

      <FormItem label="图标">
        <Upload
          action="/xiyou/upload"
          :format="['png','jpg']"
          :on-success="handleUploadSuccess"
        >
          <Button>上传图标</Button>
        </Upload>
        <div v-if="form.iconUrl" style="margin-top: 8px;">
          <img :src="form.iconUrl" alt="icon" style="width: 40px; height: 40px;" />
        </div>
      </FormItem>
    </Form>

    <div slot="footer">
      <Button @click="handleCancel">取消</Button>
      <Button type="primary" @click="handleOk">确定</Button>
    </div>
  </Modal>
</template>

<script>
import {
  addProductArea,
  updateProductArea
} from '@/api/path/product-area';

export default {
  name: 'AddProductArea',
  data() {
    return {
      visible: false,
      isEdit: false,
      form: {
        areaId: null,
        objectName: '',
        belongType: '',
        iconUrl: '',
        mapId: null,      // 单个地图 ID
        mapIds: []        // 发给后端用的数组（兼容你原来的设计）
      },
      rules: {
        mapId: [
          { required: true, type: 'number', message: '请选择地图', trigger: 'change' }
        ],
        objectName: [
          { required: true, message: '请输入对象名称', trigger: 'blur' }
        ],
        belongType: [
          { required: true, message: '请选择所属类型', trigger: 'change' }
        ]
      }
    };
  },
  methods: {
    // 对外暴露：新增 / 编辑 打开弹窗
    show(row) {
      if (row) {
        // 编辑
        this.isEdit = true;
        this.form.areaId = row.areaId;
        this.form.objectName = row.objectName;
        this.form.belongType = row.belongType;
        this.form.iconUrl = row.iconUrl || '';

        // 兼容你原来是 mapIds 数组的情况
        const firstMapId = row.mapIds && row.mapIds.length ? row.mapIds[0] : null;
        this.form.mapId = firstMapId;
        this.form.mapIds = row.mapIds ? [...row.mapIds] : (firstMapId ? [firstMapId] : []);

        this.$nextTick(() => {
          if (this.$refs.mapCascader && this.form.mapId) {
            // 这里根据你 sl-map-cascader 的实现，可能 setValue 需要整个 path
            this.$refs.mapCascader.setValue(this.form.mapId);
          }
        });
      } else {
        // 新增
        this.isEdit = false;
        this.form = {
          areaId: null,
          objectName: '',
          belongType: '',
          iconUrl: '',
          mapId: null,
          mapIds: []
        };
        this.$nextTick(() => {
          this.$refs.mapCascader && this.$refs.mapCascader.setValue();
        });
      }

      this.visible = true;
    },

    mapOnChange(mapId) {
      // sl-map-cascader 的 onChange，一般会传出 mapId 或 path
      // 这里按你围栏那边的用法，直接拿 value 就行
      if (Array.isArray(mapId)) {
        // 如果是 [buildingId, floorId, mapId] 这种，就取最后一个
        this.form.mapId = mapId[mapId.length - 1];
      } else {
        this.form.mapId = mapId;
      }
      this.form.mapIds = this.form.mapId ? [this.form.mapId] : [];
    },

    handleUploadSuccess(res) {
      this.form.iconUrl = res.url;
    },

    handleCancel() {
      this.visible = false;
    },

    handleOk() {
      this.$refs.formRef.validate((valid) => {
        if (!valid) return;

        const payload = {
          areaId: this.form.areaId,
          objectName: this.form.objectName,
          belongType: this.form.belongType,
          iconUrl: this.form.iconUrl,
          mapIds: this.form.mapIds
        };

        const req = this.isEdit
          ? updateProductArea(payload)
          : addProductArea(payload);

        req.then(() => {
          this.$Message.success('操作成功');
          this.visible = false;
          // 通知父组件刷新列表
          this.$emit('success');
        });
      });
    }
  }
};
</script>
