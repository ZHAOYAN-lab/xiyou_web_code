<template>
  <Modal
    v-model="visible"
    :title="isEdit ? '编辑区域' : '新增区域'"
    :width="900"
    :mask-closable="false"
  >
    <Form ref="formRef" :model="form" :rules="rules" :label-width="100">

      <FormItem label="地图" prop="mapId">
        <div class="sl-width-300">
          <sl-map-cascader ref="mapCascader" @onChange="mapOnChange" />
        </div>
      </FormItem>

      <FormItem label="对象名称" prop="objectName">
        <Input v-model="form.objectName" class="sl-width-300" clearable />
      </FormItem>

      <FormItem label="所属类型" prop="belongType">
        <Select v-model="form.belongType" class="sl-width-300" clearable @on-change="handleTypeChange">
          <Option value="商品区域">商品区域</Option>
          <Option value="通路区域">通路区域</Option>
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
        <div v-if="form.iconUrl" style="margin-top:8px">
          <img :src="form.iconUrl" style="width:40px;height:40px" />
        </div>
      </FormItem>
    </Form>

    <div style="margin-top:20px;font-weight:bold;">绘制{{ form.belongType === '通路区域' ? '通路' : '商品区域' }}</div>
    <div style="border:1px solid #eee;margin-top:10px;height:500px;">
      <sl-l7 v-if="slMapShow" id="product-area-map" ref="sll7" :fullscreen="false"/>
    </div>

    <div slot="footer">
      <Button @click="handleCancel">取消</Button>
      <Button type="primary" @click="handleOk">确定</Button>
    </div>
  </Modal>
</template>

<script>
import { addProductArea, updateProductArea } from '@/api/path/product-area';

export default {
  name: 'AddProductArea',

  data() {
    return {
      visible: false,
      isEdit: false,

      slMapShow: false,

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
        mapId: [{ required: true, message: '请选择地图', type: 'number' }],
        objectName: [{ required: true, message: '请输入名称' }],
        belongType: [{ required: true, message: '请选择类型' }]
      }
    };
  },

  methods: {
    /* 外部调用 */
    show(row) {
      if (row) {
        /* 编辑模式 */
        this.isEdit = true;
        this.form.areaId = row.areaId;
        this.form.objectName = row.objectName;
        this.form.belongType = row.belongType;
        this.form.iconUrl = row.iconUrl;

        this.form.mapIds = row.mapIds ? row.mapIds.split(',').map(x => Number(x)) : [];
        this.form.mapId = this.form.mapIds[0] || null;
        this.form.areaContent = row.areaContent || null;

        this.visible = true;

        this.$nextTick(() => {
          this.$refs.mapCascader.setValue(this.form.mapId);
          this.loadMapAndDraw(this.form.areaContent);
        });

      } else {
        /* 新增模式 */
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

        this.visible = true;
        this.$nextTick(() => this.$refs.mapCascader.setValue());
      }
    },

    /* 地图选择 */
    mapOnChange(mapId) {
      if (Array.isArray(mapId)) {
        this.form.mapId = mapId[mapId.length - 1];
      } else {
        this.form.mapId = mapId;
      }
      this.form.mapIds = this.form.mapId ? [this.form.mapId] : [];
      this.loadMapAndDraw();
    },

    /* 类型切换 */
    handleTypeChange() {
       this.loadMapAndDraw(this.form.areaContent);
    },

    /* 加载地图 + 回显 polygon/line */
    loadMapAndDraw(wkt = null) {
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

              /* 必须等待 L7 场景稳定后再绘 */
              setTimeout(() => {
                const isLine = this.form.belongType === '通路区域';
                let pts = [];
                if (wkt) {
                   pts = this.wktToPoints(wkt);
                }

                if (isLine) {
                   if (pts.length > 0) {
                      sll7.lineLayerSetEdit([{ points: pts }]);
                   } else {
                      sll7.lineLayerSetEdit([]);
                   }
                } else {
                   if (pts.length > 0) {
                      sll7.polygonLayerSetEdit([{ points: pts }]);
                   } else {
                      sll7.polygonLayerSetEdit([]);
                   }
                }
              }, 80);
            });
          });
        });
      });
    },

    handleUploadSuccess(res) {
      this.form.iconUrl = res.url;
    },

    /* WKT → points */
    wktToPoints(wkt) {
      try {
        let s = wkt;
        if (s.startsWith('POLYGON')) {
           s = s.replace("POLYGON((", "").replace("))", "");
        } else if (s.startsWith('LINESTRING')) {
           s = s.replace("LINESTRING(", "").replace(")", "");
        }
        return s.split(',').map(pair => {
          let [x, y] = pair.trim().split(' ');
          return { x: parseFloat(x), y: parseFloat(y) };
        });
      } catch {
        return [];
      }
    },

    handleCancel() {
      this.visible = false;
    },

    /* 保存 */
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

        const isLine = this.form.belongType === '通路区域';
        let fetchedData = [];

        if (isLine) {
           fetchedData = this.$refs.sll7?.lineLayerGetData() || [];
        } else {
           fetchedData = this.$refs.sll7?.polygonLayerGetData() || [];
        }

        if (fetchedData.length > 0) {
          const points = fetchedData[0];
          if (isLine) {
             payload.areaContent = this.convertToWKTLine(points);
             console.log('%c [Passage Path Coordinates] for map.js predefinedWaypoints:', 'color:blue;font-weight:bold');
             console.log(JSON.stringify(points, null, 2));
             if (this.$Message) this.$Message.info('通路坐标已打印到控制台，可用于替换 map.js');
          } else {
             payload.areaContent = this.convertToWKTPolygon(points);
          }
        }

        const req = this.isEdit ? updateProductArea(payload) : addProductArea(payload);

        req.then(() => {
          this.$Message.success('操作成功');
          this.visible = false;
          this.$emit('success');
        });
      });
    },

    /* points → WKT Polygon */
    convertToWKTPolygon(points) {
      const coordStr = points.map(p => `${p.x} ${p.y}`).join(', ');
      return `POLYGON((${coordStr}))`;
    },

    /* points → WKT LineString */
    convertToWKTLine(points) {
      const coordStr = points.map(p => `${p.x} ${p.y}`).join(', ');
      return `LINESTRING(${coordStr})`;
    }
  }
};
</script>
