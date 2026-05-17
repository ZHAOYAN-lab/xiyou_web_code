<template>
  <div class="sl-main">
    <header-bar @drawerToggle="drawerToggle" />

    <div class="for-map">
      <!-- ================= 左侧：待执行任务 ================= -->
      <div class="pending-task-box" :class="{ collapsed: pendingCollapsed }">
        <div class="title" @click="togglePendingCollapse">
          <span>{{ $t('h5Location.pendingTitle') }}</span>
          <span
            v-if="pendingTaskList.length"
            class="red-dot"
            :class="{ flash: flashRedDot }"
          >
            {{ pendingTaskList.length }}
          </span>
        </div>

        <div v-if="!pendingCollapsed">
          <div v-if="pendingTaskList.length === 0" class="empty">
            {{ $t('h5Location.pendingEmpty') }}
          </div>

          <ul v-else class="task-list">
            <li
              v-for="task in pendingTaskList"
              :key="task.id"
              :class="{ active: currentTask && currentTask.id === task.id }"
              @click="selectPendingTask(task)"
            >
              <div class="name">{{ task.objectName || '-' }}</div>
              <div class="desc">
                <template v-if="task.startAreaName && task.endAreaName">
                  {{ $t('h5Location.start') }} {{ task.startAreaName }} →
                  {{ $t('h5Location.end') }} {{ task.endAreaName }}
                </template>
                <template v-else-if="task.endAreaName">
                  {{ $t('h5Location.end') }} {{ task.endAreaName }}
                </template>
                <template v-else-if="task.startAreaName">
                  {{ $t('h5Location.start') }} {{ task.startAreaName }}
                </template>
                <template v-else>-</template>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- ================= 右侧：任务详情 ================= -->
      <div class="task-info-box" :class="{ collapsed }">
        <div class="title" @click="toggleCollapse">
          <span>{{ $t('h5Location.taskTitle') }}</span>
          <span class="collapse-btn">{{
            collapsed ? $t('h5Location.expand') : $t('h5Location.collapse')
          }}</span>
        </div>

        <div v-if="!collapsed">
          <div v-if="!currentTask" class="empty">
            {{ $t('h5Location.noTask') }}
          </div>

          <div v-else class="task-info">
            <div>{{ $t('h5Location.labelId') }}：{{ currentTask.id }}</div>
            <div>{{ $t('h5Location.labelType') }}：{{ formatTaskType(currentTask.taskType) }}</div>
            <div>{{ $t('h5Location.labelObject') }}：{{ currentTask.objectName || '-' }}</div>

            <div>
              {{ $t('h5Location.labelArea') }}：
              <template v-if="currentTask.startAreaName && currentTask.endAreaName">
                {{ $t('h5Location.start') }} {{ currentTask.startAreaName }} →
                {{ $t('h5Location.end') }} {{ currentTask.endAreaName }}
              </template>
              <template v-else-if="currentTask.endAreaName">
                {{ $t('h5Location.end') }} {{ currentTask.endAreaName }}
              </template>
              <template v-else-if="currentTask.startAreaName">
                {{ $t('h5Location.start') }} {{ currentTask.startAreaName }}
              </template>
              <template v-else>-</template>
            </div>

            <div>
              {{ $t('h5Location.labelRemark') }}：{{
                displayTaskRemark(currentTask)
              }}
            </div>

            <div>
              {{ $t('h5Location.labelStatus') }}：
              <b
                :style="{
                  color:
                    currentTask.status === '执行中'
                      ? '#2d8cf0'
                      : currentTask.status === '已完成'
                      ? '#19be6b'
                      : '#333'
                }"
              >
                {{ formatTaskStatus(currentTask.status) }}
              </b>
            </div>

            <Button
              size="small"
              type="primary"
              style="margin-top: 6px"
              :disabled="!canShowTaskArea"
              @click="handleShowTaskArea"
            >
              {{ $t('h5Location.showTaskArea') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- ================= 地图 ================= -->
      <Card :bordered="false" class="map-card" dis-hover>
        <sl-l7
          v-if="l7.show"
          ref="sll7"
          :switch-jizhan="l7.switch.jz"
          :switch-weilan="l7.switch.wl"
        />
      </Card>
    </div>

    <!-- ================= 底部按钮 ================= -->
    <div class="nav-btn-box">
      <Button
        type="primary"
        :disabled="!currentTask || taskStage === 'DONE'"
        @click="handleStartNav"
      >
        {{ navButtonText }}
      </Button>

      <Button
        v-if="nav.enabled"
        type="success"
        style="margin-left: 12px"
        @click="handleArrived"
      >
        {{ arrivedButtonText }}
      </Button>
    </div>

    <side-drawer
      ref="sideDrawer"
      @jizhan="jizhanOnChange"
      @xinbiao="xinbiaoOnChange"
      @weilan="weilanOnchange"
      @mapCascaderOnChange="mapCascaderOnChange"
    />
  </div>
</template>

<script>
import HeaderBar from './components/HeaderBar';
import SideDrawer from './components/SideDrawer';
import l7 from './mixins/l7';
import taskApi from '@/api/path/task';
import productAreaApi from '@/api/path/product-area';
import beaconLightTaskApi from '@/api/path/beacon-light-task';

const BEACON_LIGHT_TASK_TYPE = '点灯任务';
const BEACON_LIGHT_KIND = 'beacon-light';
const CLE_BASE_URL_KEY = 'xiyou_beacon_light_cle_base_url';
const LIGHT_COLOR_RED = 1;
const LIGHT_ON_SECONDS = 1;
const LIGHT_FLASH_INTERVAL_SECONDS = 0.4;
const LIGHT_LOOP_DELAY_MS = LIGHT_ON_SECONDS * 1000;
const LIGHT_INTERVAL_UNITS = Math.round(LIGHT_FLASH_INTERVAL_SECONDS * 10);
const LIGHT_DUTY = 100;
const LIGHT_MODE = 0;
const LIGHT_BUFFER_SIZE = 5;
const LIGHT_DELIVERY_TIMEOUT_SECONDS = 3;
const LIGHT_HTTP_TIMEOUT_MS = 8000;

export default {
  components: { HeaderBar, SideDrawer },
  mixins: [l7],

  data() {
    return {
      nav: { enabled: false },
      currentTask: null,
      taskStage: 'TO_START',
      pendingTaskList: [],
      collapsed: false,
      pendingCollapsed: false,
      taskTimer: null,
      lightRefreshTimer: null,
      lightRefreshInFlight: false,
      lightTaskRuntimeStatus: {},
      activeBeaconLightTarget: null,
      flashRedDot: false,
      taskAreaCache: {},
      fullRouteActive: false
    };
  },

  computed: {
    navButtonText() {
      if (!this.currentTask) return this.$t('mobileNav.start');
      if (this.isBeaconLightTask(this.currentTask)) {
        return this.currentTask.status === '执行中'
          ? this.$t('h5Location.lightContinueTask')
          : this.$t('h5Location.lightStartTask');
      }
      const target =
        this.taskStage === 'TO_END'
          ? this.$t('h5Location.end')
          : this.$t('h5Location.start');
      const action = this.nav.enabled
        ? this.$t('h5Location.navActionContinue')
        : this.$t('h5Location.navActionStart');
      return this.$t('h5Location.navButton', { action, target });
    },
    arrivedButtonText() {
      return this.isBeaconLightTask(this.currentTask)
        ? this.$t('h5Location.lightEndTask')
        : this.$t('h5Location.arrived');
    },
    canShowTaskArea() {
      return (
        this.currentTask &&
        !this.isBeaconLightTask(this.currentTask) &&
        (this.currentTask.startAreaId || this.currentTask.endAreaId)
      );
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.l7.show = true;
      this.fetchMyTask();
      this.taskTimer = setInterval(this.fetchMyTask, 5000);
    });
  },

  beforeDestroy() {
    clearInterval(this.taskTimer);
    this.clearBeaconLightTimer();
  },

  methods: {
    formatTaskStatus(status) {
      if (!status) return '-';
      const map = {
        执行中: this.$t('h5Location.status.running'),
        已完成: this.$t('h5Location.status.done'),
        已派发: this.$t('h5Location.status.dispatched')
      };
      return map[status] || status;
    },
    formatTaskType(type) {
      if (!type) return '-';
      const map = {
        导航: this.$t('taskManage.type.nav'),
        取货: this.$t('taskManage.type.pickup'),
        送货: this.$t('taskManage.type.delivery'),
        点灯任务: this.$t('taskManage.type.light')
      };
      return map[type] || type;
    },
    normalizeMac(value) {
      const mac = String(value || '')
        .replace(/[^0-9a-f]/gi, '')
        .toLowerCase();
      return /^[0-9a-f]{12}$/.test(mac) ? mac : '';
    },
    getBeaconLightTarget(task) {
      if (!task || !task.taskDesc) return null;

      try {
        const target = JSON.parse(task.taskDesc);
        if (target && target.kind === BEACON_LIGHT_KIND) return target;
      } catch (e) {
        return null;
      }

      return null;
    },
    isBeaconLightTask(task) {
      return task?.taskType === BEACON_LIGHT_TASK_TYPE || Boolean(this.getBeaconLightTarget(task));
    },
    applyLocalLightTaskStatus(task) {
      if (!task || !this.isBeaconLightTask(task)) return task;

      const runtimeStatus = this.lightTaskRuntimeStatus[task.id];
      return runtimeStatus ? { ...task, status: runtimeStatus } : task;
    },
    markLocalLightTaskStatus(taskId, status) {
      if (!taskId) return;
      this.$set(this.lightTaskRuntimeStatus, taskId, status);
    },
    clearLocalLightTaskStatus(taskId) {
      if (!taskId) return;
      this.$delete(this.lightTaskRuntimeStatus, taskId);
    },
    displayTaskRemark(task) {
      if (!task) return '-';
      if (task.remark) return task.remark;
      return this.getBeaconLightTarget(task) ? '-' : task.taskDesc || '-';
    },
    setActiveBeaconLightTarget(target) {
      this.activeBeaconLightTarget = target ? { ...target } : null;
    },
    getCommandBeaconLightTarget(targetOverride) {
      return (
        targetOverride ||
        this.getBeaconLightTarget(this.currentTask) ||
        this.activeBeaconLightTarget
      );
    },
    getDefaultCleBaseUrl() {
      if (process.env.VUE_APP_CLE_BASE_URL) {
        return process.env.VUE_APP_CLE_BASE_URL;
      }

      const host = window.location.hostname || 'localhost';
      return `http://${host}:44444`;
    },
    normalizeCleBaseUrl(targetOverride) {
      const target = this.getCommandBeaconLightTarget(targetOverride);
      const stored = window.localStorage.getItem(CLE_BASE_URL_KEY);
      return String(target?.cleBaseUrl || stored || this.getDefaultCleBaseUrl())
        .replace(/^"|"$/g, '')
        .trim()
        .replace(/\/+$/, '');
    },
    buildBeaconLightValue() {
      return [
        LIGHT_COLOR_RED,
        LIGHT_ON_SECONDS & 0xff,
        (LIGHT_ON_SECONDS >> 8) & 0xff,
        LIGHT_INTERVAL_UNITS,
        LIGHT_DUTY,
        LIGHT_MODE
      ];
    },
    buildBeaconLightPayload(targetOverride) {
      const target = this.getCommandBeaconLightTarget(targetOverride);
      const mac = this.normalizeMac(target?.beaconMac);

      if (!mac) {
        throw new Error(this.$t('h5Location.lightNoDevice'));
      }

      return {
        macs: [mac],
        bufferSize: LIGHT_BUFFER_SIZE,
        timeout: LIGHT_DELIVERY_TIMEOUT_SECONDS,
        value: this.buildBeaconLightValue()
      };
    },
    clearBeaconLightTimer() {
      if (this.lightRefreshTimer) {
        clearTimeout(this.lightRefreshTimer);
        this.lightRefreshTimer = null;
      }
      this.lightRefreshInFlight = false;
    },
    async sendBeaconLightCommand(silent = false, targetOverride = null) {
      const target = this.getCommandBeaconLightTarget(targetOverride);
      const cleBaseUrl = this.normalizeCleBaseUrl(target);
      if (!/^https?:\/\//.test(cleBaseUrl)) {
        const error = new Error(this.$t('h5Location.lightCleUrlInvalid'));
        if (!silent) this.$Message.error(error.message);
        throw error;
      }

      const payload = this.buildBeaconLightPayload(target);
      try {
        await beaconLightTaskApi.beaconLightTaskSendMessage(cleBaseUrl, payload, LIGHT_HTTP_TIMEOUT_MS);
      } catch (error) {
        if (!silent) this.$Message.error(this.$t('h5Location.lightCommandFailed'));
        throw error;
      }
    },
    async runBeaconLightLoop(showError = false) {
      const target = this.activeBeaconLightTarget;
      if (!target || this.lightRefreshInFlight) return;

      this.lightRefreshInFlight = true;
      let sent = false;
      try {
        await this.sendBeaconLightCommand(!showError, target);
        sent = true;
      } catch (error) {
        if (showError) throw error;
      } finally {
        this.lightRefreshInFlight = false;
        if (this.activeBeaconLightTarget && (sent || !showError)) {
          this.lightRefreshTimer = setTimeout(() => {
            this.runBeaconLightLoop(false);
          }, LIGHT_LOOP_DELAY_MS);
        }
      }
    },
    async startBeaconLightTask() {
      const target = this.getCommandBeaconLightTarget();
      this.setActiveBeaconLightTarget(target);
      this.clearBeaconLightTimer();
      await this.runBeaconLightLoop(true);
      this.$Message.success(this.$t('h5Location.lightStarted'));
    },
    async stopBeaconLightTask(silent = false) {
      this.activeBeaconLightTarget = null;
      this.clearBeaconLightTimer();
      if (!silent) {
        this.$Message.success(this.$t('h5Location.lightStopped'));
      }
      return true;
    },
    isSilentTaskSuccess(response) {
      return response?.data?.code === '0000';
    },
    async completeLightTaskOnServer(taskId) {
      try {
        const arrived = await taskApi.taskArrivedSilent({ taskId });
        if (this.isSilentTaskSuccess(arrived)) return true;

        await taskApi.taskStartSilent({ taskId }).catch(() => null);
        const arrivedAfterStart = await taskApi.taskArrivedSilent({ taskId });
        return this.isSilentTaskSuccess(arrivedAfterStart);
      } catch (error) {
        return false;
      }
    },
    async ensureTaskMapLoaded(mapId) {
      const rawMapId = String(mapId || '').trim();
      if (!/^\d+$/.test(rawMapId)) return;

      const targetMapId = Number(rawMapId);

      const currentMapId = this.$refs.sll7?.mapId;
      if (`${currentMapId}` === `${targetMapId}`) return;

      try {
        this.$refs.sideDrawer?.$refs?.mapCascader?.setValue(targetMapId);
        await this.mapCascaderOnChange(targetMapId);
      } catch (error) {
        this.$Message.error(this.$t('mapNav.mapDataLoadFail'));
        throw error;
      }
    },
    drawerToggle() {
      this.$refs.sideDrawer.show();
    },

    jizhanOnChange(v) {
      this.l7.switch.jz = v;
      this.$refs.sll7?.jizhanToggle(v);
    },

    xinbiaoOnChange(v) {
      this.l7.switch.xb = v;
      this.$refs.sll7?.xinbiaoToggle(v);
    },

    weilanOnchange(v) {
      this.l7.switch.wl = v;
      this.$refs.sll7?.polygonLayerToggle(v);
    },

    toggleCollapse() {
      this.collapsed = !this.collapsed;
    },

    togglePendingCollapse() {
      this.pendingCollapsed = !this.pendingCollapsed;
    },

    isTwoStageTask(task) {
      return task?.taskType === '送货';
    },

    /** ⭐⭐⭐ 关键修复点：切换任务必清区域 ⭐⭐⭐ */
    selectPendingTask(task) {
      this.$refs.sll7?.clearTaskArea();
      this.fullRouteActive = false;

      this.currentTask = task;
      this.calcTaskStage(task);
      this.nav.enabled = task.status === '执行中';
    },

    calcTaskStage(task) {
      if (!task) return (this.taskStage = 'TO_START');
      if (task.status === '已完成') return (this.taskStage = 'DONE');
      if (!this.isTwoStageTask(task)) return (this.taskStage = 'TO_END');
      if (task.reachedStart) return (this.taskStage = 'TO_END');
      this.taskStage = 'TO_START';
    },

    async getTaskAreaById(areaId) {
      if (!areaId) return null;
      if (this.taskAreaCache[areaId]) return this.taskAreaCache[areaId];

      try {
        const res = await productAreaApi.getProductAreaById(areaId);
        const area = res?.data || res;
        if (area) this.taskAreaCache[areaId] = area;
        return area || null;
      } catch (e) {
        return null;
      }
    },

    async handleShowTaskArea() {
      if (!this.canShowTaskArea) return;

      const ids = [];
      if (this.currentTask.startAreaId) ids.push(this.currentTask.startAreaId);
      if (this.currentTask.endAreaId) ids.push(this.currentTask.endAreaId);

      for (const id of ids) {
        const area = await this.getTaskAreaById(id);
        area && this.$refs.sll7?.showTaskArea(area);
      }
    },

    async fetchMyTask() {
      const res = await taskApi.taskMy();
      const list = (Array.isArray(res) ? res : []).map(task =>
        this.applyLocalLightTaskStatus(task)
      );

      this.pendingTaskList = list.filter(t => t.status === '已派发');

      const prevTaskId = this.currentTask?.id;
      const prevReachedStart = this.currentTask?.reachedStart;

      const runningTask = list.find(t => t.status === '执行中');
      const currentFromList = prevTaskId
        ? list.find(t => t.id === prevTaskId)
        : null;
      const nextTask =
        runningTask || currentFromList || this.pendingTaskList[0] || null;

      if (nextTask) {
        this.currentTask = this.applyLocalLightTaskStatus({
          ...nextTask,
          reachedStart: prevTaskId === nextTask.id ? prevReachedStart : false
        });
      } else {
        this.currentTask = null;
      }

      if (!this.currentTask) {
        this.nav.enabled = false;
        this.fullRouteActive = false;
        this.clearBeaconLightTimer();
        this.calcTaskStage(null);
        return;
      }

      if (prevTaskId !== this.currentTask.id) {
        this.fullRouteActive = false;
        this.nav.enabled = this.currentTask.status === '执行中';
      } else if (this.currentTask.status !== '执行中') {
        this.nav.enabled = false;
        this.fullRouteActive = false;
        if (this.isBeaconLightTask(this.currentTask)) {
          this.clearBeaconLightTimer();
        }
      }

      this.calcTaskStage(this.currentTask);
    },
    async handleStartNav() {
      if (!this.currentTask) return;

      if (this.isBeaconLightTask(this.currentTask)) {
        const wasRunning = this.currentTask.status === '执行中';
        const target = this.getBeaconLightTarget(this.currentTask);
        const targetPos = {
          x: Number(target?.beaconX),
          y: Number(target?.beaconY)
        };

        if (!Number.isFinite(targetPos.x) || !Number.isFinite(targetPos.y)) {
          this.$Message.error(this.$t('h5Location.lightNoPosition'));
          return;
        }

        await this.ensureTaskMapLoaded(target?.beaconMapId);
        this.setActiveBeaconLightTarget(target);
        this.taskStage = 'TO_END';
        this.fullRouteActive = false;
        this.currentTask = { ...this.currentTask, status: '执行中' };
        this.markLocalLightTaskStatus(this.currentTask.id, '执行中');
        this.nav.enabled = true;

        await this.$refs.sll7?.navStartFixed({
          areaName: this.currentTask.endAreaName || target?.objectName || '',
          targetPos
        });

        try {
          await this.startBeaconLightTask();
        } catch (error) {
          this.nav.enabled = true;
        }

        if (!wasRunning) {
          taskApi.taskStartSilent({ taskId: this.currentTask.id }).catch(() => {});
        }

        this.nav.enabled = true;
        return;
      }

      if (this.currentTask.status !== '执行中') {
        await taskApi.taskStart({ taskId: this.currentTask.id });
        this.currentTask = { ...this.currentTask, status: '执行中' };
      }

      this.nav.enabled = true;
      const isToStart = this.taskStage === 'TO_START';
      const isTwoStage = this.isTwoStageTask(this.currentTask);
      const startAreaId = this.currentTask.startAreaId;
      const endAreaId = this.currentTask.endAreaId;
      const startAreaName = this.currentTask.startAreaName;
      const endAreaName = this.currentTask.endAreaName;

      if (isTwoStage && isToStart) {
        const [startArea, endArea] = await Promise.all([
          this.getTaskAreaById(startAreaId),
          this.getTaskAreaById(endAreaId)
        ]);

        if (startArea && endArea) {
          this.fullRouteActive = true;
          const fullName = startAreaName && endAreaName
            ? `${startAreaName} -> ${endAreaName}`
            : startAreaName || endAreaName || '';
          this.$refs.sll7?.navStartFixed({
            areaName: fullName,
            startArea,
            endArea
          });
          return;
        }
      }

      this.fullRouteActive = false;
      const areaId = isToStart ? startAreaId : endAreaId;
      const areaName = isToStart ? startAreaName : endAreaName;
      const area = await this.getTaskAreaById(areaId);

      this.$refs.sll7?.navStartFixed({
        areaName,
        area
      });
    },
    async handleArrived() {
      if (!this.currentTask) return;

      if (this.taskStage === 'TO_START') {
        this.currentTask = { ...this.currentTask, reachedStart: true };
        this.taskStage = 'TO_END';
        if (!this.fullRouteActive) {
          this.nav.enabled = false;
          this.$refs.sll7?.navArrived();
        }
        return;
      }

      if (this.taskStage === 'TO_END') {
        if (this.isBeaconLightTask(this.currentTask)) {
          const taskId = this.currentTask.id;
          this.currentTask = { ...this.currentTask, status: '已完成' };
          this.markLocalLightTaskStatus(taskId, '已完成');
          this.taskStage = 'DONE';
          this.nav.enabled = false;
          this.fullRouteActive = false;
          this.$refs.sll7?.navArrived();
          this.completeLightTaskOnServer(taskId).then(success => {
            if (success) {
              this.clearLocalLightTaskStatus(taskId);
            }
            this.fetchMyTask();
          });
          this.stopBeaconLightTask(true).catch(() => {});
          return;
        }
        await taskApi.taskArrived({ taskId: this.currentTask.id });
        this.currentTask = { ...this.currentTask, status: '已完成' };
        this.taskStage = 'DONE';
        this.nav.enabled = false;
        this.fullRouteActive = false;
        this.$refs.sll7?.navArrived();
        this.fetchMyTask();
      }
    }
  }
};
</script>


<style lang="less" scoped>
@import url('./index.less');

/* ================= 左侧待执行任务 ================= */
.pending-task-box {
  position: absolute;
  top: 84px;
  left: 12px;
  z-index: 80;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  padding: 10px;
  width: 18vw;
  min-width: 140px;
  max-width: 220px;
  font-size: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.pending-task-box.collapsed {
  width: 14vw;
  min-width: 120px;
  max-width: 180px;
}

.pending-task-box .title {
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 6px;
}

.task-list li {
  padding: 6px;
  cursor: pointer;
  border-radius: 4px;
}

.task-list li.active {
  background: #e6f7ff;
}

.red-dot {
  background: #f5222d;
  color: #fff;
  border-radius: 10px;
  padding: 0 6px;
  font-size: 12px;
}

.red-dot.flash {
  animation: flash 0.6s ease-in-out infinite;
}

@keyframes flash {
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}

/* ================= 右侧原样 ================= */
.task-info-box {
  position: absolute;
  top: 84px;
  right: 12px;
  z-index: 80;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  padding: 10px;
  width: 24vw;
  min-width: 220px;
  max-width: 320px;
  font-size: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.task-info-box.collapsed {
  width: 14vw;
  min-width: 120px;
  max-width: 180px;
}

.task-info-box .title {
  font-weight: bold;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}

.nav-btn-box {
  width: 100%;
  padding: 14px;
  display: flex;
  justify-content: center;
  position: fixed;
  bottom: 20px;
  left: 0;
  z-index: 999;
}
</style>
