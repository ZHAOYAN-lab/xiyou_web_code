<template>
  <Modal
    v-model="visible"
    :title="isEdit ? '编辑商品区域' : '新增商品区域'"
    :width="900"
    :mask-closable="false"
  >
    <Form
      ref="formRef"
      :model="form"
      :rules="rules"
      :label-width="100"
    >
      <FormItem label="地图" prop="mapId">
        <div class="sl-width-300">
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

    <!-- 绘制区域 -->
    <div style="margin-top: 20px; font-weight: bold;">绘制商品区域</div>
    <div style="border: 1px solid #eee; margin-top: 10px; height: 500px;">
      <sl-l7
        v-if="slMapShow"
        id="product-area-map"
        ref="sll7"
        :fullscreen="false"
      />
    </div>

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

      slMapShow: false, // 控制 sl-l7 重新渲染

      form: {
        areaId: null,
        objectName: '',
        belongType: '',
        iconUrl: '',
        mapId: null,
        mapIds: [],
        areaContent: null
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
    /** 外部调用：打开弹窗 */
    show(row) {
      if (row) {
        this.isEdit = true;
        this.form.areaId = row.areaId;
        this.form.objectName = row.objectName;
        this.form.belongType = row.belongType;
        this.form.iconUrl = row.iconUrl;
        this.form.mapIds = row.mapIds ? row.mapIds.split(',').map(x => Number(x)) : [];
        this.form.mapId = this.form.mapIds[0] || null;

        this.$nextTick(() => {
          this.$refs.mapCascader.setValue(this.form.mapId);
          this.loadMapAndDraw(row.areaContent);
        });

      } else {
        this.isEdit = false;
        this.form = {
          areaId: null,
          objectName: '',
          belongType: '',
          iconUrl: '',
          mapId: null,
          mapIds: [],
          areaContent: null
        };

        this.$nextTick(() => {
          this.$refs.mapCascader.setValue();
        });
      }

      this.visible = true;
    },

    /** 地图选择事件 */
    mapOnChange(mapId) {
      if (Array.isArray(mapId)) {
        this.form.mapId = mapId[mapId.length - 1];
      } else {
        this.form.mapId = mapId;
      }
      this.form.mapIds = this.form.mapId ? [this.form.mapId] : [];

      // 切换地图时刷新绘制区
      this.loadMapAndDraw();
    },

    /** 重新加载地图并显示绘图层 */
    loadMapAndDraw(oldWKT = null) {
      if (!this.form.mapId) return;

      this.slMapShow = false;
      this.$nextTick(() => {
        this.slMapShow = true;

        this.$nextTick(() => {
          this.$api.pubGetMapDetailByMapId({
            data: { mapId: this.form.mapId }
          }).then(res => {
            const sll7 = this.$refs.sll7;

            sll7.mapInit().then(() => {
              sll7.mapSetBackgroundImage(res);

              if (oldWKT) {
                // 编辑时从数据库恢复 polygon
                let pts = this.wktToPoints(oldWKT);
                sll7.polygonLayerSetEdit([{ points: pts }]);
              } else {
                sll7.polygonLayerSetEdit([]);
              }
            });
          });
        });
      });
    },

    /** 上传图标成功 */
    handleUploadSuccess(res) {
      this.form.iconUrl = res.url;
    },

    /** 前端点列表 → WKT */
    convertToWKT(points) {
      if (!points || !points.length) return null;
      const coordStr = points.map(p => `${p.x} ${p.y}`).join(", ");
      return `POLYGON((${coordStr}))`;
    },

    /** WKT → 点列表（用于编辑时恢复绘图） */
    wktToPoints(wkt) {
      try {
        let s = wkt.replace("POLYGON((", "").replace("))", "");
        return s.split(",").map(pair => {
          let [x, y] = pair.trim().split(" ");
          return { x: parseFloat(x), y: parseFloat(y) };
        });
      } catch (e) {
        return [];
      }
    },

    handleCancel() {
      this.visible = false;
    },

    /** 提交 */
    handleOk() {
      this.$refs.formRef.validate(valid => {
        if (!valid) return;

        const payload = {
          areaId: this.form.areaId,
          objectName: this.form.objectName,
          belongType: this.form.belongType,
          iconUrl: this.form.iconUrl,
          mapIds: this.form.mapIds
        };

        // 获取绘制数据
        const fp = this.$refs.sll7?.polygonLayerGetData() || [];
        if (fp.length > 0) {
          payload.areaContent = this.convertToWKT(fp[0]);
        } else {
          payload.areaContent = null;
        }

        const req = this.isEdit
          ? updateProductArea(payload)
          : addProductArea(payload);

        req.then(() => {
          this.$Message.success("操作成功");
          this.visible = false;
          this.$emit("success");
        });
      });
    }
  }
};
</script>
