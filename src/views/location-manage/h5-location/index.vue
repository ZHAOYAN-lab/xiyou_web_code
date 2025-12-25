<template>
  <div class="sl-main">
    <header-bar @drawerToggle="drawerToggle" />

    <div class="for-map">
      <!-- ================= 左侧：待执行任务 ================= -->
      <div class="pending-task-box" :class="{ collapsed: pendingCollapsed }">
        <div class="title" @click="togglePendingCollapse">
          <span>待执行任务</span>
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
            暂无待执行任务
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
                  起点 {{ task.startAreaName }} → 终点 {{ task.endAreaName }}
                </template>
                <template v-else-if="task.endAreaName">
                  终点 {{ task.endAreaName }}
                </template>
                <template v-else-if="task.startAreaName">
                  起点 {{ task.startAreaName }}
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
          <span>我的任务</span>
          <span class="collapse-btn">{{ collapsed ? '展开' : '收起' }}</span>
        </div>

        <div v-if="!collapsed">
          <div v-if="!currentTask" class="empty">
            当前账号没有任务
          </div>

          <div v-else class="task-info">
            <div>ID：{{ currentTask.id }}</div>
            <div>类型：{{ currentTask.taskType || '-' }}</div>
            <div>对象：{{ currentTask.objectName || '-' }}</div>

            <div>
              区域：
              <template v-if="currentTask.startAreaName && currentTask.endAreaName">
                起点 {{ currentTask.startAreaName }} →
                终点 {{ currentTask.endAreaName }}
              </template>
              <template v-else-if="currentTask.endAreaName">
                终点 {{ currentTask.endAreaName }}
              </template>
              <template v-else-if="currentTask.startAreaName">
                起点 {{ currentTask.startAreaName }}
              </template>
              <template v-else>-</template>
            </div>

            <div>
              备注：{{ currentTask.remark || currentTask.taskDesc || '-' }}
            </div>

            <div>
              状态：
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
                {{ currentTask.status }}
              </b>
            </div>

            <Button
              size="small"
              type="primary"
              style="margin-top: 6px"
              :disabled="!(currentTask.startAreaId || currentTask.endAreaId)"
              @click="handleShowTaskArea"
            >
              显示任务区域
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
        已到达
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
      flashRedDot: false,
      taskAreaCache: {},
      fullRouteActive: false
    };
  },

  computed: {
    navButtonText() {
      if (!this.currentTask) return '开始导航';
      const target = this.taskStage === 'TO_END' ? '终点' : '起点';
      const action = this.nav.enabled ? '继续' : '开始';
      return `${action}导航（去${target}）`;
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
  },

  methods: {
    drawerToggle() {
      this.$refs.sideDrawer.show();
    },

    jizhanOnChange(v) {
      this.$refs.sll7?.jizhanToggle(v);
    },

    xinbiaoOnChange(v) {
      this.$refs.sll7?.xinbiaoToggle(v);
    },

    weilanOnchange(v) {
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
      if (!this.currentTask) return;

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
      const list = Array.isArray(res) ? res : [];

      this.pendingTaskList = list.filter(t => t.status === '已派发');

      const prevTaskId = this.currentTask?.id;
      const prevReachedStart = this.currentTask?.reachedStart;

      const runningTask = list.find(t => t.status === '执行中');
      const currentFromList = prevTaskId
        ? list.find(t => t.id === prevTaskId)
        : null;
      const nextTask =
        runningTask || currentFromList || this.pendingTaskList[0] || null;

      this.currentTask = nextTask
        ? {
            ...nextTask,
            reachedStart: prevTaskId === nextTask.id ? prevReachedStart : false
          }
        : null;

      if (!this.currentTask) {
        this.nav.enabled = false;
        this.fullRouteActive = false;
        this.calcTaskStage(null);
        return;
      }

      if (prevTaskId !== this.currentTask.id) {
        this.fullRouteActive = false;
        this.nav.enabled = this.currentTask.status === '执行中';
      } else if (this.currentTask.status !== '执行中') {
        this.nav.enabled = false;
        this.fullRouteActive = false;
      }

      this.calcTaskStage(this.currentTask);
    },
    async handleStartNav() {
      if (!this.currentTask) return;

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
  z-index: 3000;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  padding: 10px;
  width: 140px;
  font-size: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.pending-task-box.collapsed {
  width: 120px;
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
  z-index: 3000;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  padding: 10px;
  width: 220px;
  font-size: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.task-info-box.collapsed {
  width: 120px;
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
