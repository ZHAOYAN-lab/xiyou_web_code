<template>
  <div class="account-manage">
    <Card class="card-search" :bordered="false" dis-hover>
      <div class="sl-main-search-header">
        <div class="sl-margin-right-10">
          <Select
            v-model="search.department"
            class="sl-width-200"
            placeholder="所属部门"
            clearable
          >
            <Option
              v-for="item in departmentOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Option>
          </Select>
        </div>

        <div class="sl-margin-right-10">
          <Select
            v-model="search.level"
            class="sl-width-150"
            placeholder="职级"
            clearable
          >
            <Option
              v-for="item in levelOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Option>
          </Select>
        </div>

        <div class="sl-margin-right-10">
          <Input
            v-model="search.employeeName"
            maxlength="20"
            placeholder="员工名称"
            class="sl-width-150"
            clearable
          />
        </div>

        <div class="sl-margin-right-10">
          <Input
            v-model="search.accountName"
            maxlength="30"
            placeholder="账号"
            class="sl-width-150"
            clearable
          />
        </div>

        <div>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button class="sl-margin-left-10" @click="handleResetSearch">重置</Button>
        </div>
      </div>
    </Card>

    <Card :bordered="false" class="sl-margin-top-12" dis-hover>
      <div slot="title" class="header">
        <span class="title">账号管理</span>
        <Button type="primary" icon="md-person-add" @click="handleOpenAdd">
          添加员工
        </Button>
      </div>

      <Table
        border
        :columns="columns"
        :data="tableData"
        :loading="tableLoading"
      />
    </Card>

    <Modal v-model="addDialogVisible" title="添加员工" :mask-closable="false">
      <Form
        ref="addFormRef"
        :model="form"
        :rules="rules"
        :label-width="100"
      >
        <FormItem label="所属部门" prop="department">
          <Select v-model="form.department" placeholder="请选择部门">
            <Option
              v-for="item in departmentOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Option>
          </Select>
        </FormItem>

        <FormItem label="职级" prop="level">
          <Select v-model="form.level" placeholder="请选择职级">
            <Option
              v-for="item in levelOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Option>
          </Select>
        </FormItem>

        <FormItem label="员工名称" prop="employeeName">
          <Input
            v-model="form.employeeName"
            maxlength="20"
            placeholder="请输入员工名称"
          />
        </FormItem>

        <FormItem label="账号" prop="accountName">
          <Input
            v-model="form.accountName"
            maxlength="30"
            placeholder="请输入账号"
          />
        </FormItem>

        <FormItem label="密码" prop="password">
          <Input
            v-model="form.password"
            type="password"
            maxlength="30"
            placeholder="请输入密码"
          />
        </FormItem>

        <FormItem label="备注" prop="remark">
          <Input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            maxlength="100"
            placeholder="请输入备注"
          />
        </FormItem>
      </Form>

      <div slot="footer">
        <Button @click="handleCancelAdd">取消</Button>
        <Button type="primary" @click="handleAdd">确定</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import userApi from '@/api/path/user'

export default {
  name: 'AccountManage',
  data() {
    return {
      tableLoading: false,
      tableData: [],
      addDialogVisible: false,
      search: {
        department: '',
        level: '',
        employeeName: '',
        accountName: ''
      },
      form: {
        department: '',
        level: '',
        employeeName: '',
        accountName: '',
        password: '',
        remark: ''
      },
      departmentOptions: [
        { label: '货物管理部门', value: '货物管理部门' },
        { label: '安全部门', value: '安全部门' },
        { label: '仓库管理部门', value: '仓库管理部门' }
      ],
      levelOptions: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'C', value: 'C' }
      ],
      columns: [
        { title: '所属部门', key: 'department', align: 'center' },
        { title: '职级', key: 'level', align: 'center' },
        { title: '员工名称', key: 'employeeName', align: 'center' },
        { title: '账号', key: 'accountName', align: 'center' },
        { title: '备注', key: 'remark', align: 'center' },
        { title: '创建时间', key: 'createTime', align: 'center' }
      ],
      rules: {
        department: [{ required: true, message: '请选择部门', trigger: 'change' }],
        level: [{ required: true, message: '请选择职级', trigger: 'change' }],
        employeeName: [{ required: true, message: '请输入员工名称', trigger: 'blur' }],
        accountName: [{ required: true, message: '请输入账号', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.fetchTable()
  },
  methods: {
    fetchTable() {
      this.tableLoading = true
      const params = {
        department: this.search.department,
        level: this.search.level,
        employeeName: this.search.employeeName.trim(),
        accountName: this.search.accountName.trim()
      }
      userApi.getAccountList(params)
        .then(res => {
          this.tableData = res || []
        })
        .finally(() => {
          this.tableLoading = false
        })
    },
    handleSearch() {
      this.fetchTable()
    },
    handleResetSearch() {
      this.search = {
        department: '',
        level: '',
        employeeName: '',
        accountName: ''
      }
      this.fetchTable()
    },
    handleOpenAdd() {
      this.addDialogVisible = true
      this.$nextTick(() => {
        this.resetAddForm()
      })
    },
    handleCancelAdd() {
      this.addDialogVisible = false
      this.resetAddForm()
    },
    handleAdd() {
      this.$refs.addFormRef.validate(valid => {
        if (!valid) return
        userApi.addAccount({
          department: this.form.department,
          level: this.form.level,
          employeeName: this.form.employeeName,
          accountName: this.form.accountName,
          password: this.form.password,
          remark: this.form.remark
        }).then(() => {
          this.$Message.success('添加成功')
          this.addDialogVisible = false
          this.resetAddForm()
          this.fetchTable()
        })
      })
    },
    resetAddForm() {
      Object.assign(this.form, {
        department: '',
        level: '',
        employeeName: '',
        accountName: '',
        password: '',
        remark: ''
      })
      if (this.$refs.addFormRef) {
        this.$refs.addFormRef.resetFields()
      }
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
