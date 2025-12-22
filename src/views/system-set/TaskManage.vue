<template>
  <div class="task-manage">
    <Card :bordered="false" dis-hover>
      <div slot="title" class="header">
        <span class="title">任务管理</span>
        <Button type="primary" icon="md-add" @click="handleOpenAdd">
          新增任务
        </Button>
      </div>

      <!-- ================= 表格 ================= -->
      <Table
        border
        :columns="columns"
        :data="tableData"
        :loading="tableLoading"
        :row-class-name="rowClassName"
      >
        <template slot="objectName" slot-scope="{ row }">
          <strong>{{ row.objectName }}</strong>
        </template>

        <template slot="taskType" slot-scope="{ row }">
          <Tag :color="getTypeColor(row.taskType)">
            {{ row.taskType || '-' }}
          </Tag>
        </template>

        <template slot="remark" slot-scope="{ row }">
          {{ row.remark || '-' }}
        </template>

        <!-- ✅ 路线（三段展示，最终版） -->
        <template slot="route" slot-scope="{ row }">
          <template v-if="row.startFromCurrent === 1">
            <span>当前位置</span>
            <template v-if="row.startAreaName">
              → <span>{{ row.startAreaName }}</span>
            </template>
            → <span>{{ row.endAreaName }}</span>
          </template>

          <template v-else>
            <span>{{ row.startAreaName }}</span>
            → <span>{{ row.endAreaName }}</span>
          </template>
        </template>

        <template slot="status" slot-scope="{ row }">
          <Tag :color="getStatusColor(row.status)">
            {{ row.status }}
          </Tag>
        </template>

        <template slot="action" slot-scope="{ row }">
          <Tooltip
            v-if="isLocked(row)"
            content="已派发，需先取消"
            placement="top"
          >
            <Button type="primary" size="small" disabled>派发</Button>
          </Tooltip>

          <Button
            v-else
            type="primary"
            size="small"
            @click="handleOpenDispatch(row)"
          >
            派发
          </Button>

          <Button
            type="warning"
            size="small"
            v-if="row.status === '已派发'"
            @click="handleCancelDispatch(row)"
          >
            取消
          </Button>

          <Tooltip
            v-if="row.status === '执行中'"
            content="任务执行中，禁止删除"
            placement="top"
          >
            <Button type="error" size="small" disabled>删除</Button>
          </Tooltip>

          <Button
            v-else
            type="error"
            size="small"
            @click="handleDelete(row)"
          >
            删除
          </Button>
        </template>
      </Table>

      <div style="margin-top:10px;text-align:right;">
        <Page
          :total="total"
          :current="page"
          :page-size="pageSize"
          @on-change="handlePageChange"
        />
      </div>
    </Card>

    <!-- ================= 新增任务 ================= -->
    <Modal v-model="addDialogVisible" title="新增任务">
      <Form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        :label-width="120"
      >
        <FormItem label="对象名称" prop="objectName">
          <Input v-model="addForm.objectName" />
        </FormItem>

        <FormItem label="所属类型" prop="taskType">
          <Select v-model="addForm.taskType">
            <Option value="导航">导航</Option>
            <Option value="取货">取货</Option>
            <Option value="送货">送货</Option>
          </Select>
        </FormItem>

        <FormItem label="备注" prop="remark">
          <Input v-model="addForm.remark" type="textarea" :rows="3" />
        </FormItem>

        <!-- 开始区域（仅送货） -->
        <FormItem
          v-if="showStartArea"
          label="开始区域"
          prop="startAreaId"
        >
          <Select v-model="addForm.startAreaId">
            <Option
              v-for="item in areaList"
              :key="item.areaId"
              :value="item.areaId"
            >
              {{ item.objectName }}
            </Option>
          </Select>
        </FormItem>

        <FormItem label="结束区域" prop="endAreaId">
          <Select v-model="addForm.endAreaId">
            <Option
              v-for="item in areaList"
              :key="item.areaId"
              :value="item.areaId"
            >
              {{ item.objectName }}
            </Option>
          </Select>
        </FormItem>
      </Form>

      <div slot="footer">
        <Button @click="addDialogVisible=false">取消</Button>
        <Button type="primary" @click="submitAdd">确定</Button>
      </div>
    </Modal>

    <!-- ================= 派发 ================= -->
    <Modal v-model="dispatchDialogVisible" title="派发任务">
      <Form :label-width="100">
        <FormItem label="路线">
          <Input :value="dispatchRouteText" disabled />
        </FormItem>

        <FormItem label="备注">
          <Input
            :value="currentDispatchRow?.remark"
            type="textarea"
            disabled
          />
        </FormItem>

        <FormItem label="选择员工">
          <Select v-model="dispatchForm.employees" multiple>
            <Option
              v-for="name in employeeList"
              :key="name"
              :value="name"
            >
              {{ name }}
            </Option>
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
import userApi from '@/api/path/user'

export default {
  name: 'TaskManage',

  data() {
    return {
      tableLoading: false,
      tableData: [],
      page: 1,
      pageSize: 10,
      total: 0,

      addDialogVisible: false,
      dispatchDialogVisible: false,

      areaList: [],
      employeeList: [],

      addForm: {
        objectName: '',
        taskType: '',
        remark: '',
        startFromCurrent: 1,
        startAreaId: null,
        startAreaName: '',
        endAreaId: null,
        endAreaName: ''
      },

      addRules: {
        objectName: [{ required: true, message: '请输入对象名称' }],
        taskType: [{ required: true, message: '请选择类型' }],
        remark: [{ required: true, message: '请输入备注' }],
        endAreaId: [{ required: true, message: '请选择结束区域' }]
      },

      currentDispatchRow: null,
      dispatchForm: {
        employees: []
      },

      columns: [
        { type: 'index', width: 60, align: 'center' },
        { title: '对象名称', slot: 'objectName', align: 'center' },
        { title: '类型', slot: 'taskType', align: 'center' },
        { title: '备注', slot: 'remark', align: 'center' },
        { title: '路线', slot: 'route', align: 'center' },
        { title: '状态', slot: 'status', align: 'center' },
        { title: '操作', slot: 'action', align: 'center', width: 220 }
      ]
    }
  },

  computed: {
    showStartArea() {
      return this.addForm.taskType === '送货'
    },

    dispatchRouteText() {
      if (!this.currentDispatchRow) return ''

      const row = this.currentDispatchRow
      const parts = []

      if (row.startFromCurrent === 1) {
        parts.push('当前位置')
      }

      if (row.startAreaName) {
        parts.push(row.startAreaName)
      }

      parts.push(row.endAreaName)

      return parts.join(' → ')
    }
  },

  created() {
    this.fetchAreaList()
    this.fetchEmployeeList()
    this.fetchData()
  },

  methods: {
    getTypeColor(type) {
      if (type === '导航') return 'blue'
      if (type === '取货') return 'orange'
      if (type === '送货') return 'purple'
      return 'default'
    },

    isLocked(row) {
      return row.status === '已派发' || row.status === '执行中'
    },

    rowClassName(row) {
      return this.isLocked(row) ? 'row-disabled' : ''
    },

    getStatusColor(status) {
      if (status === '已派发') return 'orange'
      if (status === '执行中') return 'green'
      return 'default'
    },

    fetchAreaList() {
      productAreaApi.getProductAreaList().then(res => {
        this.areaList = res?.list || res || []
      })
    },

    fetchEmployeeList() {
      userApi.getUserSimpleList().then(res => {
        this.employeeList = res?.detail || res || []
      })
    },

    fetchData() {
      this.tableLoading = true
      taskApi.taskGetList({ page: this.page, size: this.pageSize })
        .then(res => {
          this.tableData = res.list || []
          this.total = res.total || 0
        })
        .finally(() => {
          this.tableLoading = false
        })
    },

    handlePageChange(p) {
      this.page = p
      this.fetchData()
    },

    handleOpenAdd() {
      this.addForm = {
        objectName: '',
        taskType: '',
        remark: '',
        startFromCurrent: 1,
        startAreaId: null,
        startAreaName: '',
        endAreaId: null,
        endAreaName: ''
      }
      this.addDialogVisible = true
    },

    submitAdd() {
      this.$refs.addFormRef.validate(valid => {
        if (!valid) return

        const startArea = this.areaList.find(
          a => a.areaId === this.addForm.startAreaId
        )
        const endArea = this.areaList.find(
          a => a.areaId === this.addForm.endAreaId
        )

        this.addForm.startAreaName = startArea?.objectName || ''
        this.addForm.endAreaName = endArea?.objectName || ''

        taskApi.taskAdd(this.addForm).then(() => {
          this.$Message.success('新增成功')
          this.addDialogVisible = false
          this.fetchData()
        })
      })
    },

    handleOpenDispatch(row) {
      this.currentDispatchRow = row
      this.dispatchForm.employees = []
      this.dispatchDialogVisible = true
    },

    submitDispatch() {
      if (!this.dispatchForm.employees.length) {
        this.$Message.error('请至少选择一名员工')
        return
      }

      taskApi.taskDispatch({
        taskId: this.currentDispatchRow.id,
        employees: this.dispatchForm.employees
      }).then(() => {
        this.$Message.success('派发成功')
        this.dispatchDialogVisible = false
        this.fetchData()
      })
    },

    handleCancelDispatch(row) {
      taskApi.taskCancel({ taskId: row.id }).then(() => {
        this.$Message.success('已取消任务')
        this.fetchData()
      })
    },

    handleDelete(row) {
      this.$Modal.confirm({
        title: '确认删除？',
        content: '是否删除该任务？',
        onOk: () => {
          taskApi.taskDelete({ id: row.id }).then(() => {
            this.$Message.success('删除成功')
            this.fetchData()
          })
        }
      })
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
.row-disabled td {
  background-color: #f5f7fa !important;
  color: #999;
}
</style>
