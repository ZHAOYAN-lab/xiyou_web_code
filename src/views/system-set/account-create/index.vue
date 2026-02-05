<template>
  <div class="account-manage">
    <Card class="card-search" :bordered="false" dis-hover>
      <div class="sl-main-search-header">
        <div class="sl-margin-right-10">
          <Select
            v-model="search.department"
            class="sl-width-200"
            :placeholder="$t('accountManage.placeholder.department')"
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
            :placeholder="$t('accountManage.placeholder.level')"
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
            :placeholder="$t('accountManage.placeholder.employeeName')"
            class="sl-width-150"
            clearable
          />
        </div>

        <div class="sl-margin-right-10">
          <Input
            v-model="search.accountName"
            maxlength="30"
            :placeholder="$t('accountManage.placeholder.account')"
            class="sl-width-150"
            clearable
          />
        </div>

        <div>
          <Button type="primary" @click="handleSearch">{{ $t('base.search') }}</Button>
          <Button class="sl-margin-left-10" @click="handleResetSearch">{{ $t('accountManage.reset') }}</Button>
        </div>
      </div>
    </Card>

    <Card :bordered="false" class="sl-margin-top-12" dis-hover>
      <div slot="title" class="header">
        <span class="title">{{ $t('accountManage.title') }}</span>
        <Button type="primary" icon="md-person-add" @click="handleOpenAdd">
          {{ $t('accountManage.addEmployee') }}
        </Button>
      </div>

      <Table
        border
        :columns="columns"
        :data="tableData"
        :loading="tableLoading"
      />
    </Card>

    <Modal v-model="addDialogVisible" :title="$t('accountManage.addEmployee')" :mask-closable="false">
      <Form
        ref="addFormRef"
        :model="form"
        :rules="rules"
        :label-width="100"
      >
        <FormItem :label="$t('accountManage.department')" prop="department">
          <Select v-model="form.department" :placeholder="$t('accountManage.placeholder.selectDepartment')">
            <Option
              v-for="item in departmentOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Option>
          </Select>
        </FormItem>

        <FormItem :label="$t('accountManage.level')" prop="level">
          <Select v-model="form.level" :placeholder="$t('accountManage.placeholder.selectLevel')">
            <Option
              v-for="item in levelOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Option>
          </Select>
        </FormItem>

        <FormItem :label="$t('accountManage.employeeName')" prop="employeeName">
          <Input
            v-model="form.employeeName"
            maxlength="20"
            :placeholder="$t('accountManage.placeholder.inputEmployeeName')"
          />
        </FormItem>

        <FormItem :label="$t('accountManage.account')" prop="accountName">
          <Input
            v-model="form.accountName"
            maxlength="30"
            :placeholder="$t('accountManage.placeholder.inputAccount')"
          />
        </FormItem>

        <FormItem :label="$t('accountManage.password')" prop="password">
          <Input
            v-model="form.password"
            type="password"
            maxlength="30"
            :placeholder="$t('accountManage.placeholder.inputPassword')"
          />
        </FormItem>

        <FormItem :label="$t('accountManage.remark')" prop="remark">
          <Input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            maxlength="100"
            :placeholder="$t('accountManage.placeholder.inputRemark')"
          />
        </FormItem>
      </Form>

      <div slot="footer">
        <Button @click="handleCancelAdd">{{ $t('base.cancel') }}</Button>
        <Button type="primary" @click="handleAdd">{{ $t('base.sure') }}</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import userApi from '@/api/path/user'

const DEPARTMENT = {
  goods: '货物管理部门',
  safety: '安全部门',
  warehouse: '仓库管理部门'
}

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
      departmentValues: DEPARTMENT,
      levelOptions: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B' },
        { label: 'C', value: 'C' }
      ]
    }
  },
  computed: {
    departmentOptions() {
      return [
        { label: this.$t('accountManage.departments.goods'), value: this.departmentValues.goods },
        { label: this.$t('accountManage.departments.safety'), value: this.departmentValues.safety },
        { label: this.$t('accountManage.departments.warehouse'), value: this.departmentValues.warehouse }
      ]
    },
    columns() {
      return [
        { title: this.$t('accountManage.department'), key: 'department', align: 'center' },
        { title: this.$t('accountManage.level'), key: 'level', align: 'center' },
        { title: this.$t('accountManage.employeeName'), key: 'employeeName', align: 'center' },
        { title: this.$t('accountManage.account'), key: 'accountName', align: 'center' },
        { title: this.$t('accountManage.remark'), key: 'remark', align: 'center' },
        { title: this.$t('accountManage.createTime'), key: 'createTime', align: 'center' }
      ]
    },
    rules() {
      return {
        department: [{ required: true, message: this.$t('accountManage.validate.department'), trigger: 'change' }],
        level: [{ required: true, message: this.$t('accountManage.validate.level'), trigger: 'change' }],
        employeeName: [{ required: true, message: this.$t('accountManage.validate.employeeName'), trigger: 'blur' }],
        accountName: [{ required: true, message: this.$t('accountManage.validate.account'), trigger: 'blur' }],
        password: [{ required: true, message: this.$t('accountManage.validate.password'), trigger: 'blur' }]
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
          this.$Message.success(this.$t('accountManage.messages.addSuccess'))
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
