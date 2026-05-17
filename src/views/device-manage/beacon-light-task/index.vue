<template>
  <div class="beacon-light-task">
    <Card class="card-search" :bordered="false" dis-hover>
      <div class="sl-main-search-header config-row">
        <div class="sl-margin-right-15">
          <Input
            v-model="cleBaseUrl"
            class="config-input"
            :placeholder="$t('beaconLightTask.cleBaseUrl')"
            clearable
          />
        </div>
        <div class="sl-margin-right-15">
          <Button type="primary" :loading="testLoading" @click="handleTestCle">
            {{ $t('beaconLightTask.connectTest') }}
          </Button>
        </div>
        <div class="sl-margin-right-15">
          <Button @click="handleSaveCleUrl">{{ $t('beaconLightTask.saveAddress') }}</Button>
        </div>
        <Tag v-if="connectionState === 'success'" color="success">
          {{ $t('beaconLightTask.status.cleConnected') }}
        </Tag>
        <Tag v-if="connectionState === 'error'" color="error">
          {{ $t('beaconLightTask.status.cleFailed') }}
        </Tag>
      </div>
    </Card>

    <div class="task-layout sl-margin-top-12">
      <Card class="form-panel" :bordered="false" dis-hover>
        <p slot="title" class="section-title">{{ $t('beaconLightTask.sections.customTask') }}</p>

        <Form ref="taskForm" :model="form" :rules="rules" :label-width="118">
          <FormItem :label="$t('beaconLightTask.fields.taskName')" prop="taskName">
            <Input
              v-model="form.taskName"
              maxlength="40"
              :placeholder="$t('beaconLightTask.placeholders.taskName')"
              clearable
            />
          </FormItem>

          <FormItem :label="$t('beaconLightTask.fields.beaconSelect')" prop="macs">
            <div class="beacon-select-row">
              <Select
                v-model="form.macs"
                multiple
                filterable
                clearable
                transfer
                :loading="beaconLoading"
                :placeholder="$t('beaconLightTask.placeholders.selectBeacon')"
                @on-open-change="handleBeaconSelectOpen"
              >
                <Option
                  v-for="item in beaconOptions"
                  :key="item.beaconMac"
                  :value="item.beaconMac"
                  :label="formatBeaconSelectLabel(item)"
                >
                  <div class="beacon-option">
                    <span class="beacon-option-name">{{ getBeaconDisplayName(item) }}</span>
                    <span class="beacon-option-meta">{{ item.beaconMac }}</span>
                  </div>
                </Option>
              </Select>
              <Button :loading="beaconLoading" @click="fetchBeacons">
                {{ $t('beaconLightTask.refreshBeacons') }}
              </Button>
            </div>
            <div v-if="selectedBeaconDetails.length" class="selected-beacons">
              <Tag v-for="item in selectedBeaconDetails" :key="item.beaconMac">
                {{ formatBeaconSelectLabel(item) }}
              </Tag>
            </div>
          </FormItem>

          <FormItem :label="$t('beaconLightTask.fields.color')" prop="color">
            <RadioGroup v-model="form.color">
              <Radio v-for="item in colorOptions" :key="item.value" :label="item.value">
                <span class="color-option">
                  <span class="color-dot" :class="item.className"></span>
                  {{ getColorLabel(item.value) }}
                </span>
              </Radio>
            </RadioGroup>
          </FormItem>

          <FormItem :label="$t('beaconLightTask.fields.taskDuration')" prop="durationMinutes">
            <Select v-model="form.durationMinutes" style="width: 160px">
              <Option v-for="item in durationOptions" :key="item.value" :value="item.value">
                {{ getDurationOptionLabel(item.value) }}
              </Option>
            </Select>
          </FormItem>

          <FormItem :label="$t('beaconLightTask.fields.remark')">
            <Input
              v-model="form.remark"
              type="textarea"
              :rows="2"
              maxlength="120"
              :placeholder="$t('beaconLightTask.placeholders.remark')"
            />
          </FormItem>
        </Form>

        <div class="action-row">
          <Button :disabled="requestLoading" @click="handleResetForm">
            {{ $t('beaconLightTask.actions.reset') }}
          </Button>
          <Button :disabled="requestLoading" @click="handleSaveTemplate">
            {{ $t('beaconLightTask.actions.saveTemplate') }}
          </Button>
          <Button type="primary" :loading="requestLoading" @click="handleExecute">
            {{ $t('beaconLightTask.actions.execute') }}
          </Button>
        </div>
      </Card>

      <Card class="preview-panel" :bordered="false" dis-hover>
        <p slot="title" class="section-title">{{ $t('beaconLightTask.sections.preview') }}</p>

        <div class="preview-box">
          <div class="preview-status">
            <div class="light-sample">
              <span class="sample-lamp" :style="{ background: currentColor.hex }"></span>
              <div class="sample-text">
                <strong>{{ currentColor.label }}</strong>
                <div>{{ selectedCountText }}</div>
              </div>
            </div>
            <Tag :color="durationValid ? 'success' : 'warning'">
              {{
                durationValid
                  ? $t('beaconLightTask.status.executable')
                  : $t('beaconLightTask.status.adjustDuration')
              }}
            </Tag>
          </div>

          <ul class="preview-list">
            <li>
              <span>{{ $t('beaconLightTask.preview.totalDuration') }}</span>
              <span>{{ durationSecondsText }}</span>
            </li>
            <li>
              <span>{{ $t('beaconLightTask.preview.interval') }}</span>
              <span>{{ intervalSecondsText }}</span>
            </li>
            <li>
              <span>{{ $t('beaconLightTask.preview.singleOn') }}</span>
              <span>{{ onSecondsText }}</span>
            </li>
          </ul>

          <Divider orientation="left">{{ $t('beaconLightTask.preview.selectedTags') }}</Divider>
          <div class="preview-beacon-list">
            <div
              v-for="item in selectedBeaconDetails"
              :key="item.beaconMac"
              class="preview-beacon-item"
            >
              <span>{{ getBeaconDisplayName(item) }}</span>
              <strong>{{ item.beaconMac }}</strong>
            </div>
            <div v-if="!selectedBeaconDetails.length" class="preview-empty">
              {{ $t('beaconLightTask.status.noBeaconSelected') }}
            </div>
          </div>
        </div>
      </Card>
    </div>

    <Card class="sl-margin-top-12" :bordered="false" dis-hover>
      <p slot="title" class="section-title">{{ $t('beaconLightTask.sections.templates') }}</p>
      <Table :columns="templateColumns" :data="templates" border>
        <template slot="templateColor" slot-scope="{ row }">
          <span class="color-option">
            <span class="color-dot" :class="getColor(row.color).className"></span>
            {{ getColor(row.color).label }}
          </span>
        </template>

        <template slot="templateMacs" slot-scope="{ row }">
          <div class="table-macs">{{ formatTemplateBeacons(row) }}</div>
        </template>

        <template slot="templateAction" slot-scope="{ row }">
          <div class="table-option">
            <span @click="handleUseTemplate(row)">{{ $t('beaconLightTask.actions.use') }}</span>
            <span @click="handleExecuteTemplate(row)">
              {{ $t('beaconLightTask.actions.execute') }}
            </span>
            <span class="delete" @click="handleDeleteTemplate(row)">
              {{ $t('beaconLightTask.actions.delete') }}
            </span>
          </div>
        </template>
      </Table>
    </Card>

    <Card class="sl-margin-top-12" :bordered="false" dis-hover>
      <p slot="title" class="section-title">{{ $t('beaconLightTask.sections.records') }}</p>
      <div slot="extra">
        <Button size="small" @click="handleClearRecords">
          {{ $t('beaconLightTask.actions.clearRecords') }}
        </Button>
      </div>

      <Table :columns="recordColumns" :data="records" border>
        <template slot="recordStatus" slot-scope="{ row }">
          <span :class="row.status === 'success' ? 'record-success' : 'record-error'">
            {{
              row.status === 'success'
                ? $t('beaconLightTask.status.success')
                : $t('beaconLightTask.status.failed')
            }}
          </span>
        </template>

        <template slot="recordMacs" slot-scope="{ row }">
          <div class="table-macs">{{ formatRecordBeacons(row) }}</div>
        </template>

        <template slot="recordValue" slot-scope="{ row }">[{{ row.value.join(', ') }}]</template>
      </Table>
    </Card>
  </div>
</template>

<script>
import beaconLightTaskApi from '@/api/path/beacon-light-task';

const CLE_BASE_URL_KEY = 'xiyou_beacon_light_cle_base_url';
const TEMPLATE_KEY = 'xiyou_beacon_light_templates';
const RECORD_KEY = 'xiyou_beacon_light_records';
const BEACON_PAGE_SIZE = 1000;
const DEFAULT_BUFFER_SIZE = 5;
const LIGHT_ON_SECONDS = 1;
const LIGHT_FLASH_INTERVAL_SECONDS = 0.4;
const LIGHT_LOOP_DELAY_MS = LIGHT_ON_SECONDS * 1000;
const LIGHT_INTERVAL_UNITS = Math.round(LIGHT_FLASH_INTERVAL_SECONDS * 10);
const LIGHT_DUTY = 100;
const LIGHT_MODE = 0;
const LIGHT_DELIVERY_TIMEOUT_SECONDS = 3;
const LIGHT_HTTP_TIMEOUT_MS = 8000;
const DEFAULT_DURATION_MINUTES = 1;
const EXECUTION_MODE_SIMULTANEOUS = 'simultaneous';

const COLOR_OPTIONS = [
  { value: 1, labelKey: 'red', className: 'red', hex: '#f5222d' },
  { value: 2, labelKey: 'yellow', className: 'yellow', hex: '#fadb14' },
  { value: 3, labelKey: 'green', className: 'green', hex: '#52c41a' }
];

const DURATION_OPTIONS = [{ value: 1 }, { value: 2 }, { value: 3 }];

export default {
  name: 'BeaconLightTask',
  data() {
    return {
      cleBaseUrl: '',
      connectionState: '',
      testLoading: false,
      requestLoading: false,
      beaconLoading: false,
      beaconOptions: [],
      templates: [],
      records: [],
      colorOptions: COLOR_OPTIONS,
      durationOptions: DURATION_OPTIONS,
      form: this.getDefaultForm()
    };
  },
  computed: {
    rules() {
      return {
        taskName: [
          {
            required: true,
            message: this.$t('beaconLightTask.validation.taskNameRequired'),
            trigger: 'blur'
          }
        ],
        macs: [
          {
            required: true,
            type: 'array',
            validator: this.validateBeaconSelection,
            trigger: 'change'
          }
        ],
        color: [
          {
            required: true,
            type: 'number',
            message: this.$t('beaconLightTask.validation.colorRequired'),
            trigger: 'change'
          }
        ],
        durationMinutes: [
          {
            required: true,
            type: 'number',
            message: this.$t('beaconLightTask.validation.taskDurationRequired'),
            trigger: 'change'
          }
        ]
      };
    },
    templateColumns() {
      return [
        {
          title: this.$t('beaconLightTask.table.taskName'),
          key: 'taskName',
          minWidth: 150,
          align: 'center'
        },
        {
          title: this.$t('beaconLightTask.table.color'),
          slot: 'templateColor',
          width: 120,
          align: 'center'
        },
        {
          title: this.$t('beaconLightTask.table.tags'),
          slot: 'templateMacs',
          minWidth: 260,
          align: 'center'
        },
        {
          title: this.$t('beaconLightTask.table.taskDuration'),
          key: 'durationText',
          width: 130,
          align: 'center'
        },
        {
          title: this.$t('beaconLightTask.table.action'),
          slot: 'templateAction',
          width: 170,
          align: 'center'
        }
      ];
    },
    recordColumns() {
      return [
        {
          title: this.$t('beaconLightTask.table.executedAt'),
          key: 'timeText',
          width: 170,
          align: 'center'
        },
        {
          title: this.$t('beaconLightTask.table.taskName'),
          key: 'taskName',
          minWidth: 140,
          align: 'center'
        },
        {
          title: this.$t('beaconLightTask.table.status'),
          slot: 'recordStatus',
          width: 90,
          align: 'center'
        },
        {
          title: this.$t('beaconLightTask.table.tags'),
          slot: 'recordMacs',
          minWidth: 260,
          align: 'center'
        },
        { title: 'value', slot: 'recordValue', minWidth: 190, align: 'center' },
        {
          title: this.$t('beaconLightTask.table.cleBaseUrl'),
          key: 'cleBaseUrl',
          minWidth: 220,
          align: 'center'
        },
        {
          title: this.$t('beaconLightTask.table.result'),
          key: 'message',
          minWidth: 220,
          align: 'center'
        }
      ];
    },
    normalizedMacs() {
      return (this.form.macs || [])
        .map((item) => this.normalizeMac(item))
        .filter((item, index, arr) => item && arr.indexOf(item) === index);
    },
    beaconMap() {
      return this.beaconOptions.reduce((map, item) => {
        map[item.beaconMac] = item;
        return map;
      }, {});
    },
    selectedBeaconDetails() {
      return this.normalizedMacs.map((mac) => {
        return (
          this.beaconMap[mac] || {
            beaconMac: mac,
            beaconRemark: '',
            beaconProduct: '',
            beaconOnline: null
          }
        );
      });
    },
    currentColor() {
      return this.getColor(this.form.color);
    },
    intervalUnits() {
      return LIGHT_INTERVAL_UNITS;
    },
    durationSeconds() {
      return this.getDurationSecondsByTask(this.form);
    },
    durationValid() {
      return DURATION_OPTIONS.some((item) => item.value === Number(this.form.durationMinutes));
    },
    selectedCountText() {
      return this.formatTemplate(this.$t('beaconLightTask.preview.selectedCount'), {
        count: this.normalizedMacs.length
      });
    },
    durationSecondsText() {
      if (!Number.isFinite(this.durationSeconds) || this.durationSeconds <= 0) return '-';
      return this.formatDurationMinutes(this.form.durationMinutes);
    },
    intervalSecondsText() {
      return this.formatSeconds(this.intervalUnits / 10);
    },
    onSecondsText() {
      return this.formatSeconds(LIGHT_ON_SECONDS);
    },
    protocolValue() {
      return this.buildValue(false);
    }
  },
  mounted() {
    this.cleBaseUrl = this.loadStorage(CLE_BASE_URL_KEY, this.getDefaultCleBaseUrl());
    this.templates = this.loadStorage(TEMPLATE_KEY, []).map((item) =>
      this.normalizeStoredTemplate(item)
    );
    this.records = this.loadStorage(RECORD_KEY, []).map((item) => this.normalizeStoredRecord(item));
    this.fetchBeacons();
  },
  methods: {
    getDefaultForm() {
      return {
        taskName: this.$t('beaconLightTask.defaultTaskName'),
        macs: [],
        color: 1,
        durationMinutes: DEFAULT_DURATION_MINUTES,
        bufferSize: DEFAULT_BUFFER_SIZE,
        remark: ''
      };
    },
    getDefaultCleBaseUrl() {
      if (process.env.VUE_APP_CLE_BASE_URL) {
        return process.env.VUE_APP_CLE_BASE_URL;
      }

      const host = window.location.hostname || 'localhost';
      return `http://${host}:44444`;
    },
    loadStorage(key, defaultValue) {
      try {
        const value = window.localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (error) {
        return defaultValue;
      }
    },
    saveStorage(key, value) {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    normalizeCleBaseUrl() {
      return String(this.cleBaseUrl || '')
        .trim()
        .replace(/\/+$/, '');
    },
    normalizeMac(value) {
      const mac = String(value || '')
        .replace(/[:-]/g, '')
        .trim()
        .toLowerCase();
      return /^[0-9a-f]{12}$/.test(mac) ? mac : '';
    },
    parseMacInput(value) {
      return String(value || '')
        .split(/[\s,，;；]+/)
        .map((item) => this.normalizeMac(item))
        .filter((item, index, arr) => item && arr.indexOf(item) === index);
    },
    validateBeaconSelection(rule, value, callback) {
      if (!Array.isArray(value) || !value.length) {
        callback(new Error(this.$t('beaconLightTask.validation.beaconRequired')));
        return;
      }
      callback();
    },
    handleBeaconSelectOpen(open) {
      if (open && !this.beaconOptions.length && !this.beaconLoading) {
        this.fetchBeacons();
      }
    },
    fetchBeacons() {
      this.beaconLoading = true;
      return this.$api
        .beaconManageGetTable({
          loading: false,
          data: {
            page: 0,
            size: BEACON_PAGE_SIZE
          }
        })
        .then((res) => {
          const rows = this.extractBeaconRows(res);
          this.beaconOptions = rows
            .map((item) => this.normalizeBeacon(item))
            .filter((item) => item.beaconMac);
        })
        .catch((error) => {
          this.$Message.error(this.formatError(error));
        })
        .finally(() => {
          this.beaconLoading = false;
        });
    },
    extractBeaconRows(data) {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.content)) return data.content;
      if (data && data.detail && Array.isArray(data.detail.content)) return data.detail.content;
      if (data && Array.isArray(data.records)) return data.records;
      return [];
    },
    normalizeBeacon(item) {
      const locationObject = item.beaconLocationObject || item.locationObject || {};
      return {
        beaconId: item.beaconId || '',
        beaconMac: this.normalizeMac(item.beaconMac || item.mac),
        beaconRemark: item.beaconRemark || item.remark || '',
        beaconProduct: item.beaconProduct || '',
        beaconOnline: item.beaconOnline,
        beaconAllow: item.beaconAllow,
        objectName:
          item.objectName || item.locationObjectName || locationObject.locationObjectName || ''
      };
    },
    normalizeStoredTemplate(row) {
      const macs = Array.isArray(row.macs) ? row.macs : this.parseMacInput(row.macInput);
      const task = {
        id: row.id || `${Date.now()}`,
        createdAt: row.createdAt || Date.now(),
        taskName: row.taskName || this.$t('beaconLightTask.defaultTaskName'),
        macs: macs.map((item) => this.normalizeMac(item)).filter(Boolean),
        beacons: Array.isArray(row.beacons) ? row.beacons : [],
        color: row.color || 1,
        durationMinutes: this.normalizeDurationMinutes(row.durationMinutes),
        executionMode: this.getExecutionMode(row.executionMode),
        bufferSize: row.bufferSize || DEFAULT_BUFFER_SIZE,
        remark: row.remark || ''
      };
      task.durationText = this.formatDurationMinutes(task.durationMinutes);
      return task;
    },
    normalizeStoredRecord(row) {
      return {
        id: row.id || `${Date.now()}`,
        timeText: row.timeText || '',
        taskName: row.taskName || '',
        status: row.status || 'success',
        cleBaseUrl: row.cleBaseUrl || '',
        macs: Array.isArray(row.macs) ? row.macs : [],
        beacons: Array.isArray(row.beacons) ? row.beacons : [],
        value: Array.isArray(row.value) ? row.value : [],
        message: row.message || ''
      };
    },
    getColor(value) {
      const color = COLOR_OPTIONS.find((item) => item.value === Number(value)) || COLOR_OPTIONS[0];
      return {
        ...color,
        label: this.getColorLabel(color.value)
      };
    },
    getColorLabel(value) {
      const color = COLOR_OPTIONS.find((item) => item.value === Number(value)) || COLOR_OPTIONS[0];
      return this.$t(`beaconLightTask.colors.${color.labelKey}`);
    },
    getExecutionMode() {
      return EXECUTION_MODE_SIMULTANEOUS;
    },
    getExecutionModeLabel(value) {
      return this.$t(`beaconLightTask.executionModes.${this.getExecutionMode(value)}`);
    },
    getBeaconDisplayName(item) {
      return item.objectName || this.$t('beaconLightTask.status.noObjectName');
    },
    formatBeaconSelectLabel(item) {
      const displayName = this.getBeaconDisplayName(item);
      return `${displayName} / ${item.beaconMac}`;
    },
    formatNumber(value) {
      if (!Number.isFinite(value)) return '-';
      return Number(value.toFixed(2)).toString();
    },
    formatSeconds(value) {
      return `${this.formatNumber(value)} ${this.$t('beaconLightTask.units.seconds')}`;
    },
    formatDurationMinutes(value) {
      return this.formatTemplate(this.$t('beaconLightTask.units.minutes'), {
        count: this.normalizeDurationMinutes(value)
      });
    },
    getDurationOptionLabel(value) {
      return this.formatDurationMinutes(value);
    },
    formatTemplate(text, values) {
      return Object.keys(values).reduce((result, key) => {
        return result.replace(new RegExp(`\\{${key}\\}`, 'g'), values[key]);
      }, String(text));
    },
    formatBeaconList(macs, beacons) {
      const storedMap = (beacons || []).reduce((map, item) => {
        const mac = this.normalizeMac(item.beaconMac || item.mac);
        if (mac) map[mac] = this.normalizeBeacon(item);
        return map;
      }, {});
      const list = (macs || []).map((mac) => {
        const normalizedMac = this.normalizeMac(mac);
        return this.beaconMap[normalizedMac] || storedMap[normalizedMac] || { beaconMac: mac };
      });
      return list.map((item) => this.formatBeaconSelectLabel(item)).join(', ') || '-';
    },
    formatTemplateBeacons(row) {
      return this.formatBeaconList(row.macs, row.beacons);
    },
    formatRecordBeacons(row) {
      return this.formatBeaconList(row.macs, row.beacons);
    },
    buildValue(isTurnOff) {
      return this.buildValueByTask(this.form, isTurnOff);
    },
    getIntervalUnitsByTask() {
      return LIGHT_INTERVAL_UNITS;
    },
    normalizeDurationMinutes(value) {
      const minutes = Math.round(Number(value || DEFAULT_DURATION_MINUTES));
      return DURATION_OPTIONS.some((item) => item.value === minutes)
        ? minutes
        : DEFAULT_DURATION_MINUTES;
    },
    getDurationSecondsByTask(task) {
      return this.normalizeDurationMinutes(task && task.durationMinutes) * 60;
    },
    buildValueByTask(task, isTurnOff) {
      const intervalUnits = this.getIntervalUnitsByTask(task);
      const duration = isTurnOff ? 0 : LIGHT_ON_SECONDS;
      return [
        Number(task.color),
        duration & 0xff,
        (duration >> 8) & 0xff,
        intervalUnits,
        LIGHT_DUTY,
        LIGHT_MODE
      ];
    },
    getTaskTimeoutSeconds() {
      return LIGHT_DELIVERY_TIMEOUT_SECONDS;
    },
    getRequestTimeoutMs() {
      return LIGHT_HTTP_TIMEOUT_MS;
    },
    buildPayload(isTurnOff, task = this.form, macs = this.normalizedMacs) {
      return {
        macs: (macs || []).map((item) => this.normalizeMac(item)).filter(Boolean),
        bufferSize: Number(task.bufferSize) || DEFAULT_BUFFER_SIZE,
        timeout: this.getTaskTimeoutSeconds(),
        value: this.buildValueByTask(task, isTurnOff)
      };
    },
    validateTask(isTurnOff) {
      const cleBaseUrl = this.normalizeCleBaseUrl();
      if (!/^https?:\/\//.test(cleBaseUrl)) {
        this.$Message.error(this.$t('beaconLightTask.validation.cleUrlInvalid'));
        return false;
      }
      if (!this.normalizedMacs.length) {
        this.$Message.error(this.$t('beaconLightTask.validation.beaconRequired'));
        return false;
      }
      if (!isTurnOff && !this.durationValid) {
        this.$Message.error(this.$t('beaconLightTask.validation.taskDurationRequired'));
        return false;
      }
      this.form.durationMinutes = this.normalizeDurationMinutes(this.form.durationMinutes);
      this.form.executionMode = this.getExecutionMode(this.form.executionMode);
      return true;
    },
    handleSaveCleUrl() {
      const cleBaseUrl = this.normalizeCleBaseUrl();
      if (!cleBaseUrl) {
        this.$Message.error(this.$t('beaconLightTask.validation.cleUrlRequired'));
        return;
      }
      this.cleBaseUrl = cleBaseUrl;
      this.saveStorage(CLE_BASE_URL_KEY, cleBaseUrl);
      this.$Message.success(this.$t('beaconLightTask.messages.saved'));
    },
    handleTestCle() {
      const cleBaseUrl = this.normalizeCleBaseUrl();
      if (!/^https?:\/\//.test(cleBaseUrl)) {
        this.$Message.error(this.$t('beaconLightTask.validation.cleUrlInvalid'));
        return;
      }
      this.testLoading = true;
      this.connectionState = '';
      beaconLightTaskApi
        .beaconLightTaskTestInfo(cleBaseUrl)
        .then(() => {
          this.connectionState = 'success';
          this.$Message.success(this.$t('beaconLightTask.messages.cleConnected'));
        })
        .catch((error) => {
          this.connectionState = 'error';
          this.$Message.error(this.formatError(error));
        })
        .finally(() => {
          this.testLoading = false;
        });
    },
    handleExecute() {
      if (this.requestLoading) return;
      this.submitMessage(false);
    },
    submitMessage(isTurnOff) {
      this.$refs.taskForm.validate((valid) => {
        if (!valid || !this.validateTask(isTurnOff)) return;

        this.sendTaskMessage(isTurnOff);
      });
    },
    async sendTaskMessage(isTurnOff) {
      const cleBaseUrl = this.normalizeCleBaseUrl();
      const task = this.createTaskSnapshot();
      const beacons = this.createBeaconSnapshot(task.macs);
      const payload = this.buildPayload(false, task, task.macs);
      this.requestLoading = true;

      try {
        const result = await this.sendTimedSimultaneousMessages(cleBaseUrl, task);
        const status = result.successCount > 0 ? 'success' : 'error';
        const toastMessage =
          status === 'success'
            ? this.$t('beaconLightTask.messages.taskSent')
            : this.$t('beaconLightTask.messages.partialFailed');

        if (status === 'success') {
          this.$Message.success(toastMessage);
        } else {
          this.$Message.error(toastMessage);
        }

        this.addRecord({
          status,
          cleBaseUrl,
          payload,
          message: result.message,
          isTurnOff,
          task,
          beacons
        });
      } catch (error) {
        const message = this.formatError(error);
        this.$Message.error(message);
        this.addRecord({
          status: 'error',
          cleBaseUrl,
          payload,
          message,
          isTurnOff,
          task,
          beacons
        });
      } finally {
        this.requestLoading = false;
      }
    },
    async sendSimultaneousMessage(cleBaseUrl, task, beacons, isTurnOff) {
      const payload = this.buildPayload(isTurnOff, task, task.macs);
      const response = await this.sendCleMessage(cleBaseUrl, payload, task);
      return {
        failureCount: 0,
        message: this.formatExecutionResult(
          task.executionMode,
          task.macs.length,
          task.macs.length,
          [],
          [this.formatResponse(response.data)],
          beacons
        )
      };
    },
    async sendTimedSimultaneousMessages(cleBaseUrl, task) {
      const endAt = Date.now() + this.getDurationSecondsByTask(task) * 1000;
      const responses = [];
      const failures = [];
      let totalCount = 0;
      let successCount = 0;

      while (Date.now() < endAt) {
        totalCount += 1;
        const payload = this.buildPayload(false, task, task.macs);
        try {
          const response = await this.sendCleMessage(cleBaseUrl, payload, task);
          successCount += 1;
          if (responses.length < 3) responses.push(this.formatResponse(response.data));
        } catch (error) {
          if (failures.length < 3) failures.push({ message: this.formatError(error) });
        }

        const remainingMs = endAt - Date.now();
        if (remainingMs > 0) {
          await this.wait(Math.min(LIGHT_LOOP_DELAY_MS, remainingMs));
        }
      }

      return {
        failureCount: totalCount - successCount,
        successCount,
        message: this.formatTimedExecutionResult(totalCount, successCount, failures, responses)
      };
    },
    async sendCleMessage(cleBaseUrl, payload, task) {
      return beaconLightTaskApi.beaconLightTaskSendMessage(
        cleBaseUrl,
        payload,
        this.getRequestTimeoutMs(task)
      );
    },
    wait(ms) {
      if (!ms) return Promise.resolve();
      return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });
    },
    handleSaveTemplate() {
      this.$refs.taskForm.validate((valid) => {
        if (!valid || !this.validateTask(false)) return;

        const template = {
          id: `${Date.now()}`,
          createdAt: Date.now(),
          taskName: this.form.taskName,
          macs: this.normalizedMacs,
          beacons: this.selectedBeaconDetails,
          color: this.form.color,
          durationMinutes: this.normalizeDurationMinutes(this.form.durationMinutes),
          durationText: this.formatDurationMinutes(this.form.durationMinutes),
          executionMode: EXECUTION_MODE_SIMULTANEOUS,
          bufferSize: this.form.bufferSize,
          remark: this.form.remark
        };
        this.templates = [template].concat(this.templates).slice(0, 30);
        this.saveStorage(TEMPLATE_KEY, this.templates);
        this.$Message.success(this.$t('beaconLightTask.messages.templateSaved'));
      });
    },
    handleUseTemplate(row) {
      if (this.requestLoading) return;
      this.form = {
        taskName: row.taskName,
        macs: row.macs || [],
        color: row.color,
        durationMinutes: this.normalizeDurationMinutes(row.durationMinutes),
        executionMode: EXECUTION_MODE_SIMULTANEOUS,
        bufferSize: row.bufferSize,
        remark: row.remark || ''
      };
      this.$nextTick(() => {
        this.$refs.taskForm.validate();
      });
    },
    handleExecuteTemplate(row) {
      if (this.requestLoading) return;
      this.handleUseTemplate(row);
      this.$nextTick(() => {
        this.submitMessage(false);
      });
    },
    handleDeleteTemplate(row) {
      this.$Modal.confirm({
        title: this.$t('beaconLightTask.confirm.deleteTitle'),
        content: this.$t('beaconLightTask.confirm.deleteContent'),
        okText: this.$t('base.sure'),
        cancelText: this.$t('base.cancel'),
        onOk: () => {
          this.templates = this.templates.filter((item) => item.id !== row.id);
          this.saveStorage(TEMPLATE_KEY, this.templates);
          this.$Message.success(this.$t('base.deleteSuccess'));
        }
      });
    },
    handleResetForm() {
      this.form = this.getDefaultForm();
      this.$nextTick(() => {
        this.$refs.taskForm.resetFields();
      });
    },
    handleClearRecords() {
      this.records = [];
      this.saveStorage(RECORD_KEY, this.records);
    },
    createTaskSnapshot() {
      return {
        ...this.form,
        macs: this.normalizedMacs,
        durationMinutes: this.normalizeDurationMinutes(this.form.durationMinutes),
        executionMode: EXECUTION_MODE_SIMULTANEOUS,
        bufferSize: Number(this.form.bufferSize) || DEFAULT_BUFFER_SIZE
      };
    },
    createBeaconSnapshot(macs) {
      return (macs || []).map((mac) => {
        const beacon = this.beaconMap[this.normalizeMac(mac)] || { beaconMac: mac };
        return { ...beacon };
      });
    },
    addRecord({ status, cleBaseUrl, payload, message, isTurnOff, task, beacons }) {
      const now = Date.now();
      const taskInfo = task || this.form;
      const record = {
        id: `${now}`,
        timeText: this.formatTime(now),
        taskName: isTurnOff
          ? `${taskInfo.taskName}${this.$t('beaconLightTask.messages.turnOffSuffix')}`
          : taskInfo.taskName,
        status,
        cleBaseUrl,
        macs: payload.macs,
        beacons: beacons || this.selectedBeaconDetails,
        value: payload.value,
        message
      };
      this.records = [record].concat(this.records).slice(0, 50);
      this.saveStorage(RECORD_KEY, this.records);
    },
    formatTime(time) {
      const date = new Date(time);
      const pad = (value) => String(value).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
        date.getHours()
      )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    formatResponse(data) {
      if (typeof data === 'string') return data.slice(0, 180);
      if (data === undefined || data === null) {
        return this.$t('beaconLightTask.messages.httpSuccess');
      }
      return JSON.stringify(data).slice(0, 180);
    },
    formatTimedExecutionResult(totalCount, successCount, failures, responses) {
      const base = this.formatTemplate(this.$t('beaconLightTask.messages.timedResult'), {
        success: successCount,
        total: totalCount
      });
      const failedText = (failures || [])
        .map((item) => item.message)
        .filter(Boolean)
        .join('; ');
      const responseText = (responses || []).filter(Boolean).join('; ');
      return `${base}${failedText ? `; ${failedText}` : ''}${
        responseText ? `; ${responseText}` : ''
      }`.slice(0, 180);
    },
    formatExecutionResult(mode, total, successCount, failures, responses, beacons) {
      const key = 'simultaneousResult';
      const base = this.formatTemplate(this.$t(`beaconLightTask.messages.${key}`), {
        success: successCount,
        total
      });
      if (failures.length) {
        const failedText = failures
          .map((item) => `${this.getBeaconNameByMac(item.mac, beacons)}: ${item.message}`)
          .join('; ');
        return `${base}; ${failedText}`.slice(0, 180);
      }
      const responseText = (responses || []).filter(Boolean).join('; ');
      return responseText ? `${base}; ${responseText}`.slice(0, 180) : base;
    },
    getBeaconNameByMac(mac, beacons) {
      const normalizedMac = this.normalizeMac(mac);
      const beacon = (beacons || []).find(
        (item) => this.normalizeMac(item.beaconMac) === normalizedMac
      ) ||
        this.beaconMap[normalizedMac] || { beaconMac: mac };
      return this.getBeaconDisplayName(beacon);
    },
    formatError(error) {
      if (
        error &&
        (error.code === 'ECONNABORTED' ||
          error.code === 'ETIMEDOUT' ||
          /timeout/i.test(error.message || ''))
      ) {
        return this.$t('beaconLightTask.messages.requestTimeout');
      }
      if (error && error.response) {
        return `HTTP ${error.response.status}: ${this.formatResponse(error.response.data)}`;
      }
      if (error && error.msg) return error.msg;
      if (error && error.message) return error.message;
      return this.$t('beaconLightTask.messages.requestFailed');
    }
  }
};
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>
