<template>
  <div class="task-manage">
    <Card :bordered="false" dis-hover>
      <div slot="title" class="header">
        <span class="title">{{ $t('taskManage.title') }}</span>
        <Button type="primary" icon="md-add" @click="handleOpenAdd">
          {{ $t('taskManage.addTask') }}
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
            {{ taskTypeLabel(row.taskType) }}
          </Tag>
        </template>

        <template slot="remark" slot-scope="{ row }">
          {{ row.remark || '-' }}
        </template>

        <!-- 路线 -->
        <template slot="route" slot-scope="{ row }">
          <template v-if="row.startFromCurrent === 1">
            <span>{{ $t('taskManage.route.currentPosition') }}</span>
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
            {{ statusLabel(row.status) }}
          </Tag>
        </template>

        <template slot="action" slot-scope="{ row }">
          <Tooltip v-if="isLocked(row)" :content="$t('taskManage.tips.dispatchedNeedCancel')">
            <Button type="primary" size="small" disabled>{{ $t('taskManage.action.dispatch') }}</Button>
          </Tooltip>

          <Button
            v-else
            type="primary"
            size="small"
            @click="handleOpenDispatch(row)"
          >
            {{ $t('taskManage.action.dispatch') }}
          </Button>

          <Button
            v-if="row.status === taskStatusValues.dispatched"
            type="warning"
            size="small"
            @click="handleCancelDispatch(row)"
          >
            {{ $t('base.cancel') }}
          </Button>

          <Tooltip v-if="row.status === taskStatusValues.running" :content="$t('taskManage.tips.runningNoDelete')">
            <Button type="error" size="small" disabled>{{ $t('base.delete') }}</Button>
          </Tooltip>

          <Button
            v-else
            type="error"
            size="small"
            @click="handleDelete(row)"
          >
            {{ $t('base.delete') }}
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
    <Modal v-model="addDialogVisible" :title="$t('taskManage.addTask')">
      <Form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        :label-width="120"
      >
        <FormItem :label="$t('taskManage.form.name')" prop="objectName">
          <Input v-model="addForm.objectName" />
        </FormItem>

        <FormItem :label="$t('taskManage.form.type')" prop="taskType">
          <Select v-model="addForm.taskType">
            <Option
              v-for="item in taskTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Option>
          </Select>
        </FormItem>

        <!-- 开始区域（仅送货） -->
        <FormItem v-if="showStartArea" :label="$t('taskManage.form.startArea')" prop="startAreaId">
          <Select
            v-model="addForm.startAreaId"
            :placeholder="startAreaPlaceholder"
          >
            <Option
              v-for="item in areaList"
              :key="item.areaId"
              :value="item.areaId"
            >
              {{ item.objectName }}
            </Option>
          </Select>
        </FormItem>

        <!-- 结束区域 / 点灯设备 -->
        <FormItem :label="endTargetLabel" prop="endAreaId">
          <Select
            v-model="addForm.endAreaId"
            filterable
            :loading="lightBeaconLoading"
            @on-open-change="handleEndTargetOpen"
          >
            <Option
              v-for="item in endTargetOptions"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            >
              <div>
                <span>{{ item.label }}</span>
                <span v-if="item.meta" style="color:#999;margin-left:8px;">{{ item.meta }}</span>
              </div>
            </Option>
          </Select>
        </FormItem>

        <!-- 开始时间 -->
        <FormItem :label="$t('taskManage.form.startTime')" prop="startTime">
          <DatePicker
            v-model="addForm.startTime"
            type="datetime"
            style="width: 100%;"
            :placeholder="$t('taskManage.placeholder.startTime')"
          />
        </FormItem>

        <!-- 结束时间 -->
        <FormItem :label="$t('taskManage.form.endTime')" prop="endTime">
          <DatePicker
            v-model="addForm.endTime"
            type="datetime"
            style="width: 100%;"
            :placeholder="$t('taskManage.placeholder.endTime')"
          />
        </FormItem>

        <!-- 备注（已移到最下面） -->
        <FormItem :label="$t('taskManage.form.remark')" prop="remark">
          <Input v-model="addForm.remark" type="textarea" :rows="3" />
        </FormItem>
      </Form>

      <div slot="footer">
        <Button @click="addDialogVisible=false">{{ $t('base.cancel') }}</Button>
        <Button type="primary" @click="submitAdd">{{ $t('base.sure') }}</Button>
      </div>
    </Modal>

    <!-- ================= 派发 ================= -->
    <Modal v-model="dispatchDialogVisible" :title="$t('taskManage.dispatchTask')">
      <Form :label-width="100">
        <FormItem :label="$t('taskManage.form.route')">
          <Input :value="dispatchRouteText" disabled />
        </FormItem>

        <FormItem :label="$t('taskManage.form.remark')">
          <Input :value="currentDispatchRow?.remark" type="textarea" disabled />
        </FormItem>

        <FormItem :label="$t('taskManage.form.employee')">
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
        <Button @click="dispatchDialogVisible=false">{{ $t('base.cancel') }}</Button>
        <Button type="primary" @click="submitDispatch">{{ $t('base.sure') }}</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import taskApi from '@/api/path/task'
import productAreaApi from '@/api/path/product-area'
import userApi from '@/api/path/user'

const TASK_TYPE = {
  nav: '导航',
  pickup: '取货',
  delivery: '送货',
  light: '点灯任务'
}

const TASK_STATUS = {
  dispatched: '已派发',
  running: '执行中'
}

const CLE_BASE_URL_KEY = 'xiyou_beacon_light_cle_base_url'

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
      lightBeaconList: [],
      lightBeaconLoading: false,
      employeeList: [],
      taskTypeValues: TASK_TYPE,
      taskStatusValues: TASK_STATUS,

      addForm: {
        objectName: '',
        taskType: '',
        remark: '',
        startFromCurrent: 1,
        startAreaId: null,
        startAreaName: '',
        endAreaId: null,
        endAreaName: '',
        taskDesc: '',
        startTime: null,
        endTime: null
      },

      currentDispatchRow: null,
      dispatchForm: { employees: [] }
    }
  },

  computed: {
    columns() {
      return [
        { type: 'index', width: 60, align: 'center' },
        { title: this.$t('taskManage.table.objectName'), slot: 'objectName', align: 'center' },
        { title: this.$t('taskManage.table.type'), slot: 'taskType', align: 'center' },
        { title: this.$t('taskManage.table.remark'), slot: 'remark', align: 'center' },
        { title: this.$t('taskManage.table.route'), slot: 'route', align: 'center' },
        { title: this.$t('taskManage.table.status'), slot: 'status', align: 'center' },
        { title: this.$t('base.option'), slot: 'action', align: 'center', width: 220 }
      ]
    },
    taskTypeOptions() {
      return [
        { value: this.taskTypeValues.nav, label: this.$t('taskManage.type.nav') },
        { value: this.taskTypeValues.pickup, label: this.$t('taskManage.type.pickup') },
        { value: this.taskTypeValues.delivery, label: this.$t('taskManage.type.delivery') },
        { value: this.taskTypeValues.light, label: this.$t('taskManage.type.light') }
      ]
    },
    addRules() {
      return {
        objectName: [{ required: true, message: this.$t('taskManage.validate.name') }],
        taskType: [{ required: true, message: this.$t('taskManage.validate.type') }],
        endAreaId: [{ required: true, message: this.$t('taskManage.validate.endArea') }]
      }
    },
    showStartArea() {
      return this.addForm.taskType === this.taskTypeValues.delivery
    },
    isLightTask() {
      return this.addForm.taskType === this.taskTypeValues.light
    },
    endTargetLabel() {
      return this.isLightTask
        ? this.$t('taskManage.form.lightDevice')
        : this.$t('taskManage.form.endArea')
    },
    endTargetOptions() {
      if (this.isLightTask) {
        return this.lightBeaconList.map(item => ({
          value: item.beaconId,
          label: this.formatLightBeaconName(item),
          meta: item.beaconMac,
          raw: item
        }))
      }

      return this.areaList.map(item => ({
        value: item.areaId,
        label: item.objectName,
        raw: item
      }))
    },
    startAreaPlaceholder() {
      return this.addForm.taskType === this.taskTypeValues.delivery
        ? this.$t('taskManage.route.fromCurrent')
        : this.$t('base.select')
    },
    dispatchRouteText() {
      if (!this.currentDispatchRow) return ''
      const row = this.currentDispatchRow
      const parts = []
      if (row.startFromCurrent === 1) parts.push(this.$t('taskManage.route.currentPosition'))
      if (row.startAreaName) parts.push(row.startAreaName)
      parts.push(row.endAreaName)
      return parts.join(' → ')
    }
  },

  created() {
    this.fetchAreaList()
    this.fetchEmployeeList()
    this.fetchData()
  },

  watch: {
    'addForm.taskType'(value, oldValue) {
      if (value === oldValue) return
      this.addForm.startAreaId = null
      this.addForm.startAreaName = ''
      this.addForm.endAreaId = null
      this.addForm.endAreaName = ''
      this.addForm.taskDesc = ''
      if (value === this.taskTypeValues.light) {
        this.fetchLightBeaconList()
      }
    }
  },

  methods: {
    normalizeMac(value) {
      const mac = String(value || '')
        .replace(/[:-]/g, '')
        .trim()
        .toLowerCase()
      return /^[0-9a-f]{12}$/.test(mac) ? mac : ''
    },
    extractBeaconRows(data) {
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.content)) return data.content
      if (data && data.detail && Array.isArray(data.detail.content)) return data.detail.content
      if (data && Array.isArray(data.records)) return data.records
      return []
    },
    normalizeLightBeacon(item) {
      const locationObject = item.beaconLocationObject || item.locationObject || {}
      return {
        beaconId: item.beaconId,
        beaconMac: this.normalizeMac(item.beaconMac || item.mac),
        beaconX: item.beaconX,
        beaconY: item.beaconY,
        beaconZ: item.beaconZ,
        beaconMapId: item.beaconMapId,
        beaconProduct: item.beaconProduct || '',
        beaconRemark: item.beaconRemark || item.remark || '',
        objectName:
          item.objectName || item.locationObjectName || locationObject.locationObjectName || ''
      }
    },
    formatLightBeaconName(item) {
      const name = item.objectName || item.beaconRemark || this.$t('taskManage.form.lightDevice')
      const position = [item.beaconX, item.beaconY]
        .filter(v => v !== undefined && v !== null && `${v}` !== '')
        .join(', ')
      return position ? `${name} (${position})` : name
    },
    getDefaultCleBaseUrl() {
      if (process.env.VUE_APP_CLE_BASE_URL) {
        return process.env.VUE_APP_CLE_BASE_URL
      }

      const host = window.location.hostname || 'localhost'
      return `http://${host}:44444`
    },
    getLightTaskCleBaseUrl() {
      const stored = window.localStorage.getItem(CLE_BASE_URL_KEY)
      return String(stored || this.getDefaultCleBaseUrl())
        .replace(/^"|"$/g, '')
        .trim()
        .replace(/\/+$/, '')
    },
    fetchLightBeaconList() {
      if (this.lightBeaconLoading) return
      this.lightBeaconLoading = true
      this.$api
        .beaconManageGetTable({
          loading: false,
          data: {
            page: 0,
            size: 1000
          }
        })
        .then(res => {
          this.lightBeaconList = this.extractBeaconRows(res)
            .map(item => this.normalizeLightBeacon(item))
            .filter(item => {
              return (
                item.beaconId !== undefined &&
                item.beaconId !== null &&
                item.beaconMac &&
                Number.isFinite(Number(item.beaconX)) &&
                Number.isFinite(Number(item.beaconY))
              )
            })
        })
        .finally(() => {
          this.lightBeaconLoading = false
        })
    },
    handleEndTargetOpen(open) {
      if (open && this.isLightTask && !this.lightBeaconList.length) {
        this.fetchLightBeaconList()
      }
    },
    getTypeColor(type) {
      if (type === this.taskTypeValues.nav) return 'blue'
      if (type === this.taskTypeValues.pickup) return 'orange'
      if (type === this.taskTypeValues.delivery) return 'purple'
      if (type === this.taskTypeValues.light) return 'red'
      return 'default'
    },
    taskTypeLabel(type) {
      if (type === this.taskTypeValues.nav) return this.$t('taskManage.type.nav')
      if (type === this.taskTypeValues.pickup) return this.$t('taskManage.type.pickup')
      if (type === this.taskTypeValues.delivery) return this.$t('taskManage.type.delivery')
      if (type === this.taskTypeValues.light) return this.$t('taskManage.type.light')
      return type || '-'
    },
    isLocked(row) {
      return row.status === this.taskStatusValues.dispatched || row.status === this.taskStatusValues.running
    },
    rowClassName(row) {
      return this.isLocked(row) ? 'row-disabled' : ''
    },
    getStatusColor(status) {
      if (status === this.taskStatusValues.dispatched) return 'orange'
      if (status === this.taskStatusValues.running) return 'green'
      return 'default'
    },
    statusLabel(status) {
      if (status === this.taskStatusValues.dispatched) return this.$t('taskManage.status.dispatched')
      if (status === this.taskStatusValues.running) return this.$t('taskManage.status.running')
      return status || '-'
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
        endAreaName: '',
        taskDesc: '',
        startTime: null,
        endTime: null
      }
      this.addDialogVisible = true
    },
    submitAdd() {
      this.$refs.addFormRef.validate(valid => {
        if (!valid) return

        const startArea = this.areaList.find(a => a.areaId === this.addForm.startAreaId)
        const endTarget = this.endTargetOptions.find(item => item.value === this.addForm.endAreaId)

        this.addForm.startAreaName = startArea?.objectName || ''

        if (this.isLightTask) {
          const beacon = endTarget?.raw
          this.addForm.startFromCurrent = 1
          this.addForm.startAreaId = null
          this.addForm.startAreaName = ''
          this.addForm.endAreaName = endTarget?.label || ''
          if (!this.addForm.remark) {
            this.addForm.remark = `${this.$t('taskManage.form.lightDevice')}：${this.addForm.endAreaName}`
          }
          this.addForm.taskDesc = JSON.stringify({
            kind: 'beacon-light',
            beaconId: beacon?.beaconId,
            beaconMac: beacon?.beaconMac,
            beaconX: beacon?.beaconX,
            beaconY: beacon?.beaconY,
            beaconZ: beacon?.beaconZ,
            beaconMapId: beacon?.beaconMapId,
            beaconProduct: beacon?.beaconProduct,
            beaconRemark: beacon?.beaconRemark,
            objectName: beacon?.objectName,
            cleBaseUrl: this.getLightTaskCleBaseUrl()
          })
        } else {
          this.addForm.taskDesc = ''
          this.addForm.endAreaName = endTarget?.label || ''
        }

        taskApi.taskAdd(this.addForm).then(() => {
          this.$Message.success(this.$t('taskManage.tips.addSuccess'))
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
        this.$Message.error(this.$t('taskManage.tips.selectEmployee'))
        return
      }
      taskApi.taskDispatch({
        taskId: this.currentDispatchRow.id,
        employees: this.dispatchForm.employees
      }).then(() => {
        this.$Message.success(this.$t('taskManage.tips.dispatchSuccess'))
        this.dispatchDialogVisible = false
        this.fetchData()
      })
    },
    handleCancelDispatch(row) {
      taskApi.taskCancel({ taskId: row.id }).then(() => {
        this.$Message.success(this.$t('taskManage.tips.cancelSuccess'))
        this.fetchData()
      })
    },
    handleDelete(row) {
      this.$Modal.confirm({
        title: this.$t('taskManage.tips.deleteConfirmTitle'),
        content: this.$t('taskManage.tips.deleteConfirmContent'),
        okText: this.$t('base.sure'),
        cancelText: this.$t('base.cancel'),
        onOk: () => {
          taskApi.taskDelete({ id: row.id }).then(() => {
            this.$Message.success(this.$t('base.deleteSuccess'))
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
