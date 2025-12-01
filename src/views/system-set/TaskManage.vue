<template>
  <div class="task-manage">
    <Card :bordered="false" dis-hover>

      <div slot="title" class="header">
        <span class="title">任务管理</span>
        <Button type="primary" icon="md-add" @click="handleOpenAdd">新增任务</Button>
      </div>

      <Table 
        border
        :columns="columns"
        :data="tableData"
        :loading="tableLoading">

        <template slot="objectName" slot-scope="{ row }">
          <strong>{{ row.objectName }}</strong>
        </template>

        <template slot="taskType" slot-scope="{ row }">
          <Tag :color="row.taskType === '取货' ? 'orange' : 'blue'">
            {{ row.taskType || '-' }}
          </Tag>
        </template>

        <template slot="areaName" slot-scope="{ row }">
          {{ row.areaName || '未绑定区域' }}
        </template>

        <template slot="status" slot-scope="{ row }">
          <Tag :color="getStatusColor(row.status)">
            {{ row.status }}
          </Tag>
        </template>

        <template slot="action" slot-scope="{ row }">
          <Button type="primary" size="small" @click="handleOpenDispatch(row)">派发</Button>
          <Button type="warning" size="small" v-if="row.status==='已派发'" @click="handleCancelDispatch(row)">取消</Button>
          <Button type="error" size="small" @click="handleDelete(row)">删除</Button>
        </template>
      </Table>

      <div style="margin-top: 10px; text-align:right;">
        <Page 
          :total="total"
          :current="page"
          :page-size="pageSize"
          @on-change="handlePageChange"/>
      </div>
    </Card>

    <!-- 新增任务 -->
    <Modal v-model="addDialogVisible" title="新增任务">
      <Form ref="addFormRef" :model="addForm" :rules="addRules" :label-width="120">

        <FormItem label="对象名称" prop="objectName">
          <Input v-model="addForm.objectName" placeholder="请输入对象名称"/>
        </FormItem>

        <FormItem label="所属类型" prop="taskType">
          <Select v-model="addForm.taskType" placeholder="请选择类型">
            <Option value="取货">取货</Option>
            <Option value="送货">送货</Option>
          </Select>
        </FormItem>

        <FormItem label="商品区域" prop="areaId">
          <Select v-model="addForm.areaId" placeholder="请选择区域">
            <Option v-for="item in areaList" :key="item.areaId" :value="item.areaId">
              {{ item.objectName }}
            </Option>
          </Select>
        </FormItem>

      </Form>

      <div slot="footer">
        <Button @click="addDialogVisible=false">取消</Button>
        <Button type="primary" :loading="btnLoading" @click="submitAdd">确定</Button>
      </div>
    </Modal>

    <!-- 派发任务 -->
    <Modal v-model="dispatchDialogVisible" title="派发任务">
      <Form :model="dispatchForm" :label-width="100">

        <FormItem label="所属区域">
          <Input :value="currentDispatchRow?.areaName" disabled/>
        </FormItem>

        <FormItem label="选择员工" required>
          <Select v-model="dispatchForm.employees" multiple>
            <Option value="张三">张三</Option>
            <Option value="李四">李四</Option>
            <Option value="王五">王五</Option>
          </Select>
        </FormItem>

      </Form>

      <div slot="footer">
        <Button @click="dispatchDialogVisible=false">取消</Button>
        <Button type="primary" @click="submitDispatch">确定</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import taskApi from '@/api/path/task'
import productAreaApi from '@/api/path/product-area'

export default {
  name: "TaskManage",

  data() {
    return {
      tableLoading: false,
      tableData: [],
      page: 1,
      pageSize: 10,
      total: 0,

      // 弹窗
      addDialogVisible: false,
      dispatchDialogVisible: false,

      // 区域列表
      areaList: [],

      // 新增任务表单
      addForm: {
        objectName: "",
        taskType: "",
        areaId: null,
        areaName: ""
      },

      addRules: {
        objectName: [{ required: true, message: "请输入对象名称" }],
        taskType: [{ required: true, message: "请选择类型" }],
        areaId: [{ required: true, message: "请选择商品区域" }]
      },

      currentDispatchRow: null,
      dispatchForm: {
        employees: []
      },

      columns: [
        { type: "index", width: 70, align: "center" },
        { title: "对象名称", slot: "objectName", align: "center" },
        { title: "所属类型", slot: "taskType", align: "center" },
        { title: "商品区域", slot: "areaName", align: "center" },
        { title: "状态", slot: "status", align: "center" },
        { title: "操作", slot: "action", align: "center" }
      ]
    }
  },

  created() {
    this.fetchAreaList();
    this.fetchData();
  },

  activated() {
    this.fetchAreaList();
    this.fetchData();
  },

  methods: {
    getStatusColor(status) {
      if (status === "已派发") return "orange";
      if (status === "执行中") return "green";
      return "default";
    },

    // ⭐⭐⭐ 关键：请求商品区域列表（已经修复，不会再不发请求） ⭐⭐⭐
    fetchAreaList() {
      productAreaApi.getProductAreaList()
        .then(res => {
          if (!res) {
            this.areaList = [];
            return;
          }
          if (Array.isArray(res)) this.areaList = res;
          else if (Array.isArray(res.list)) this.areaList = res.list;
          else this.areaList = [];
        })
        .catch(err => {
          console.error("商品区域请求失败 =", err);
        });
    },

    fetchData() {
      this.tableLoading = true;
      taskApi.taskGetList({ page: this.page, size: this.pageSize })
        .then(res => {
          this.tableData = res.list || [];
          this.total = res.total || 0;
        })
        .finally(() => {
          this.tableLoading = false;
        });
    },

    handlePageChange(p) {
      this.page = p;
      this.fetchData();
    },

    handleOpenAdd() {
      this.addForm = { objectName: "", taskType: "", areaId: null };
      this.addDialogVisible = true;
    },

    submitAdd() {
      this.$refs.addFormRef.validate(valid => {
        if (!valid) return;
        this.btnLoading = true;

        const area = this.areaList.find(a => a.areaId === this.addForm.areaId);
        this.addForm.areaName = area ? area.objectName : "";

        taskApi.taskAdd(this.addForm)
          .then(() => {
            this.$Message.success("新增成功");
            this.addDialogVisible = false;
            this.fetchData();
          })
          .finally(() => this.btnLoading = false);
      });
    },

    handleOpenDispatch(row) {
      this.currentDispatchRow = row;
      this.dispatchForm.employees = [];
      this.dispatchDialogVisible = true;
    },

    submitDispatch() {
      taskApi.taskDispatch({
        taskId: this.currentDispatchRow.id,
        employees: this.dispatchForm.employees
      }).then(() => {
        this.$Message.success("派发成功");
        this.dispatchDialogVisible = false;
        this.fetchData();
      });
    },

    handleCancelDispatch(row) {
      taskApi.taskCancel({ taskId: row.id }).then(() => {
        this.$Message.success("已取消任务");
        this.fetchData();
      });
    },

    handleDelete(row) {
      this.$Modal.confirm({
        title: "确认删除？",
        content: "是否删除该任务？",
        onOk: () => {
          taskApi.taskDelete({ id: row.id }).then(() => {
            this.$Message.success("删除成功");
            this.fetchData();
          });
        }
      });
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 14px;
  font-weight: bold;
}
</style>
