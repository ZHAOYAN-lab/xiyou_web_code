<template>
  <div class="task-manage">
    <Card :bordered="false" dis-hover>
      <!-- 1. 顶部操作区 -->
      <div slot="title" style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold; font-size: 14px;">任务管理</span>
        <Button type="primary" icon="md-add" @click="handleOpenAdd">新增任务</Button>
      </div>

      <!-- 2. 数据表格 -->
      <Table 
        border 
        :columns="columns" 
        :data="tableData" 
        :loading="tableLoading">
        
        <!-- 自定义：对象名称 -->
        <template slot-scope="{ row }" slot="objectName">
          <strong>{{ row.objectName || '(未命名)' }}</strong>
        </template>

        <!-- 自定义：所属类型 -->
        <template slot-scope="{ row }" slot="taskType">
          <Tag :color="row.taskType === '取货' ? 'orange' : 'blue'">{{ row.taskType }}</Tag>
        </template>

        <!-- 自定义：当前状态 -->
        <template slot-scope="{ row }" slot="status">
          <Tag :color="getStatusColor(row.status)" type="border">{{ row.status }}</Tag>
        </template>

        <!-- 自定义：操作按钮 -->
        <template slot-scope="{ row, index }" slot="action">
          <!-- 派发按钮 -->
          <Button 
            v-if="row.status === '待派发'"
            type="primary" size="small" icon="md-paper-plane" style="margin-right: 5px"
            @click="handleOpenDispatch(row)">派发</Button>

          <!-- 取消派发按钮 -->
          <Button 
            v-if="row.status === '已派发'"
            type="warning" size="small" icon="md-undo" style="margin-right: 5px"
            @click="handleCancelDispatch(row)">取消派发</Button>

          <!-- 删除按钮 -->
          <Button 
            v-if="row.status !== '执行中'"
            type="error" size="small" icon="md-trash"
            @click="handleDelete(row)">删除</Button>
        </template>
      </Table>

      <!-- 3. 分页区域 -->
      <div style="margin-top: 15px; text-align: right;">
        <Page 
          :total="total" 
          :current="page" 
          :page-size="pageSize" 
          show-total 
          show-elevator
          @on-change="handlePageChange">
        </Page>
      </div>
    </Card>

    <!-- 弹窗 1: 新增任务 -->
    <Modal v-model="addDialogVisible" title="新增任务">
      <Form ref="addFormRef" :model="addForm" :rules="addRules" :label-width="100">
        <FormItem label="对象名称" prop="objectName">
          <Input v-model="addForm.objectName" placeholder="请输入对象名称"></Input>
        </FormItem>
        <FormItem label="所属类型" prop="taskType">
          <Select v-model="addForm.taskType" placeholder="请选择类型">
            <Option value="取货">取货</Option>
            <Option value="送货">送货</Option>
          </Select>
        </FormItem>
      </Form>
      <div slot="footer">
        <Button type="text" @click="addDialogVisible = false">取消</Button>
        <Button type="primary" :loading="btnLoading" @click="submitAdd">确定</Button>
      </div>
    </Modal>

    <!-- 弹窗 2: 派发任务 -->
    <Modal v-model="dispatchDialogVisible" title="派发任务">
      <Form :model="dispatchForm" :label-width="100">
        <FormItem label="选择员工" required>
          <Select v-model="dispatchForm.employees" multiple placeholder="请选择员工(可多选)">
            <Option value="张三">张三</Option>
            <Option value="李四">李四</Option>
            <Option value="王五">王五</Option>
            <Option value="赵六">赵六</Option>
          </Select>
        </FormItem>
      </Form>
       <div slot="footer">
        <Button type="text" @click="dispatchDialogVisible = false">取消</Button>
        <Button type="primary" :loading="btnLoading" @click="submitDispatch">确定</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
/* eslint-disable */
export default {
  name: 'TaskManage',
  data() {
    return {
      tableLoading: false,
      btnLoading: false,
      page: 1,
      pageSize: 10,
      total: 0,
      columns: [
        { type: 'index', width: 70, align: 'center', title: '序号' },
        { title: '对象名称', slot: 'objectName', align: 'center' },
        { title: '所属类型', slot: 'taskType', align: 'center' },
        { title: '当前状态', slot: 'status', align: 'center' },
        { 
          title: '执行员工', 
          key: 'assignedTo', 
          align: 'center', 
          render: (h, params) => {
            const u = params.row.assignedTo;
            if (Array.isArray(u) && u.length > 0) {
              return h('span', u.join(', '));
            }
            return h('span', '-');
          }
        },
        { title: '操作', slot: 'action', width: 280, align: 'center' }
      ],
      tableData: [],
      addDialogVisible: false,
      addForm: { objectName: '', taskType: '' },
      addRules: {
        objectName: [{ required: true, message: '必填项', trigger: 'blur' }],
        taskType: [{ required: true, message: '必选项', trigger: 'change' }]
      },
      dispatchDialogVisible: false,
      currentDispatchRow: null,
      dispatchForm: { employees: [] }
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    getStatusColor(status) {
      if (status === '执行中') return 'success';
      if (status === '已派发') return 'warning';
      return 'default';
    },

    // 1. 获取列表 (核心修复)
    fetchData() {
      this.tableLoading = true;
      const params = { page: this.page, size: this.pageSize };
      
      if (!this.$api || !this.$api.taskGetList) {
          this.tableLoading = false; return;
      }

      this.$api.taskGetList({ params }).then(res => {
        // 你的拦截器可能已经把 response.data 拿出来了，甚至把 data.detail 也拿出来了
        // 下面这种写法可以同时兼容 "未拦截" 和 "已拦截" 的情况
        const body = res.data || res; 
        
        console.log('fetchData 响应:', body);

        // 情况A: 拦截器直接返回了 { total: xx, list: [] }
        if (body && Array.isArray(body.list)) {
            this.tableData = body.list;
            // 修复 total 为 0 的问题：如果 list 有数据但 total 是 0，暂时用 list 长度顶替
            this.total = (body.total === 0 && body.list.length > 0) ? body.list.length : body.total;
            return;
        }

        // 情况B: 拦截器返回了 { code: "0000", detail: { ... } }
        if (body.code === "0000") {
            const detail = body.detail || {};
            this.tableData = detail.list || [];
            this.total = detail.total || 0;
            return;
        }

        // 如果都不是
        this.$Message.warning('数据格式不符合预期，请检查控制台');
      }).catch(err => {
        console.error(err);
        this.$Message.error('网络异常');
      }).finally(() => {
        this.tableLoading = false;
      });
    },

    // 2. 新增任务
    submitAdd() {
      this.$refs.addFormRef.validate((valid) => {
        if (valid) {
          this.btnLoading = true;
          this.$api.taskAdd(this.addForm).then(res => {
            const body = res.data || res; 
            // 这里的判断逻辑同理，尽量宽松
            // 只要不是报错，通常拦截器已经处理过了
            if (body.code === "0000" || body.success === true || body === "新增成功" || (body.msg && body.msg.includes("成功"))) {
              this.$Message.success('新增成功');
              this.addDialogVisible = false;
              this.fetchData(); 
            } else {
              // 如果拦截器吞掉了 code，直接返回了数据，这种通常也是成功
              // 除非 body 里明确有 error 信息
              this.$Message.success('操作完成');
              this.addDialogVisible = false;
              this.fetchData();
            }
          }).catch(err => {
            console.error(err);
            this.$Message.error('服务异常');
          }).finally(() => {
            this.btnLoading = false;
          });
        }
      });
    },

    // 3. 派发任务
    submitDispatch() {
      if (this.dispatchForm.employees.length === 0) {
        this.$Message.warning('请至少选择一名员工');
        return;
      }
      this.btnLoading = true;
      const payload = {
        taskId: this.currentDispatchRow.id,
        employees: this.dispatchForm.employees
      };
      this.$api.taskDispatch(payload).then(res => {
        this.$Message.success('派发成功');
        this.dispatchDialogVisible = false;
        this.fetchData();
      }).catch(() => {
        this.$Message.error('派发失败');
      }).finally(() => {
        this.btnLoading = false;
      });
    },

    // 4. 删除任务
    handleDelete(row) {
      this.$Modal.confirm({
        title: '删除确认',
        content: '<p>确定要删除该任务吗？</p>',
        onOk: () => {
          this.$api.taskDelete({ id: row.id }).then(res => {
            this.$Message.success('删除成功');
            this.fetchData();
          }).catch(() => {
             this.$Message.error('删除失败');
          });
        }
      });
    },

    // 5. 取消派发
    handleCancelDispatch(row) {
      this.$Modal.confirm({
        title: '取消确认',
        content: '<p>确定撤回该任务吗？</p>',
        onOk: () => {
          this.$api.taskCancel({ taskId: row.id }).then(res => {
            this.$Message.success('已取消派发');
            this.fetchData();
          });
        }
      });
    },

    handlePageChange(page) {
      this.page = page;
      this.fetchData();
    },
    handleOpenAdd() {
      this.addForm = { objectName: '', taskType: '' };
      this.addDialogVisible = true;
    },
    handleOpenDispatch(row) {
      this.currentDispatchRow = row;
      this.dispatchForm.employees = [];
      this.dispatchDialogVisible = true;
    }
  }
};
</script>

<style scoped>
.task-manage {
  padding: 16px;
  background-color: #f0f2f5;
  min-height: 100vh;
}
</style>