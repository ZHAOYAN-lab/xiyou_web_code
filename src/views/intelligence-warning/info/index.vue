<template>
  <div>
    <Card class="card-search" :bordered="false" dis-hover>
      <div class="sl-main-search-header">
        <div class="sl-margin-right-10">
          <Input
            v-model="search.beaconMac"
            maxlength="30"
            :placeholder="$t('warningInfo.table.beacon')"
            class="sl-width-150"
            clearable
          />
        </div>
        <div class="sl-margin-right-10">
          <Input
            v-model="search.locationObjectName"
            maxlength="30"
            :placeholder="$t('warningInfo.table.object')"
            class="sl-width-150"
            clearable
          />
        </div>

        <div class="sl-margin-right-15">
          <Select
            v-model="search.alarmStatus"
            class="sl-width-200"
            :placeholder="$t('warningInfo.table.status')"
            clearable
          >
            <Option
              v-for="(item, index) in searchData.alarmStatus"
              :key="index"
              :value="item.value"
              >{{ item.label }}</Option
            >
          </Select>
        </div>
        <div class="sl-margin-right-15">
          <Select
            v-model="search.alarmType"
            class="sl-width-150"
            :placeholder="$t('warningInfo.table.type')"
            clearable
          >
            <Option
              v-for="(item, index) in searchData.alarmType"
              :key="index"
              :value="item.value"
              >{{ item.label }}</Option
            >
          </Select>
        </div>
        <div class="sl-margin-right-15">
          <Select
            v-model="search.order"
            clearable
            :placeholder="$t('beaconManage.sort.title')"
            class="sl-width-200"
          >
            <Option v-for="(item, index) in searchData.order" :key="index" :value="item.value">{{
              item.label
            }}</Option>
          </Select>
        </div>

        <div class="sl-margin-right-15">
          <DatePicker
            v-model="search.dateTime"
            transfer
            :editable="false"
            class="sl-width-360"
            :placeholder="$t('warningInfo.table.date')"
            type="datetimerange"
            format="yyyy-MM-dd HH:mm:ss"
            placement="bottom-end"
            :options="datePickerOption"
          ></DatePicker>
        </div>
        <div class="sl-margin-right-15">
          <Button type="primary" @click="tableGetData">{{ $t('base.search') }}</Button>
        </div>
      </div>
    </Card>

    <Card :bordered="false" class="sl-margin-top-12" dis-hover>
      <p slot="title">{{ $t('warningInfo.title') }}</p>

      <div slot="extra">
        <label>{{ $t('base.mailSwitch') }}</label
        ><iSwitch v-model="emailSwitch.value" @on-change="warningInfoSetEmailSwitch" />
      </div>

      <div>
        <sl-table ref="slComTable" :t-id="'demo-table'" :t-columns="table.columns"> </sl-table>
      </div>
    </Card>
  </div>
</template>
<script>
import { mapState } from 'vuex';
import table from './mixins/table';
export default {
  components: {},
  mixins: [table],
  inject: ['reload'],
  data() {
    return {};
  },
  computed: mapState({}),
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {
      this.tableGetData();
      this.warningInfoGetEmailSwitch();
    });
  },

  methods: {
    // 获取邮件开关
    warningInfoGetEmailSwitch() {
      this.$api.warningInfoGetEmailSwitch({ loading: false }).then((res) => {
        this.emailSwitch = {
          id: res.configId,
          value: Boolean(res.configValue)
        };
      });
    },

    // 修改邮件开关状态
    warningInfoSetEmailSwitch(value) {
      this.$api
        .warningInfoSetEmailSwitch({
          data: {
            configId: this.emailSwitch.id,
            configValue: +value
          }
        })
        .then(() => {});
    },

    // 刷新表格
    handleRefreshTable() {
      this.$refs.slComTable.handleRefreshtable();
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
