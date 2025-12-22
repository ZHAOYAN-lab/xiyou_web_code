<template>
  <div class="sl-main">
    <header-bar @drawerToggle="drawerToggle"></header-bar>

    <div class="for-map">

      <!-- ================= 左侧：待执行任务列表 + 红点（可展开/收起） ================= -->
      <div
        class="pending-task-box"
        :class="{ collapsed: pendingCollapsed }"
      >
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

        <!-- 展开内容 -->
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
              <div class="name">{{ task.objectName }}</div>
              <div class="desc">
                {{ task.taskType }} · {{ task.areaName || '-' }}
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- ================= 右侧：任务详情卡片（原结构不动） ================= -->
      <div class="task-info-box" :class="{ collapsed }">
        <div class="title" @click="toggleCollapse">
          <span>我的任务</span>
          <span class="collapse-btn">
            {{ collapsed ? '展开' : '收起' }}
          </span>
        </div>

        <div v-if="!collapsed">
          <div v-if="!currentTask" class="empty">
            当前账号没有任务
          </div>

          <div v-else class="task-info">
            <div>ID：{{ currentTask.id }}</div>
            <div>类型：{{ currentTask.taskType }}</div>
            <div>对象：{{ currentTask.objectName }}</div>
            <div>区域：{{ currentTask.areaName }}</div>
            <div>内容：{{ currentTask.taskDesc }}</div>
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
              :disabled="!currentTask.areaId"
              @click="handleShowTaskArea"
            >
              显示任务区域
            </Button>
          </div>
        </div>
      </div>

      <!-- 地图（不动） -->
      <Card :bordered="false" class="map-card" dis-hover>
        <sl-l7
          v-if="l7.show"
          ref="sll7"
          :switch-jizhan="l7.switch.jz"
          :switch-weilan="l7.switch.wl"
        />
      </Card>
    </div>

    <!-- ================= 底部导航按钮 ================= -->
    <div class="nav-btn-box">
      <Button
        type="primary"
        :disabled="!currentTask || currentTask.status !== '已派发'"
        @click="handleStartNav"
      >
        开始导航（固定路线）
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
import l7 from './mixins/l7';
import SideDrawer from './components/SideDrawer';
import taskApi from '@/api/path/task';
import productAreaApi from '@/api/path/product-area';

export default {
  components: { HeaderBar, SideDrawer },
  mixins: [l7],

  data() {
    return {
      nav: { enabled: false },
      currentTask: null,
      pendingTaskList: [],
      collapsed: false,
      pendingCollapsed: false, // ⭐ 新增：左侧折叠状态

      taskTimer: null,
      lastPendingCount: 0,
      flashRedDot: false
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.l7.show = true;
      this.fetchMyTask();

      this.taskTimer = setInterval(() => {
        this.fetchMyTask();
      }, 5000);
    });
  },

  beforeDestroy() {
    if (this.taskTimer) {
      clearInterval(this.taskTimer);
      this.taskTimer = null;
    }
  },

  methods: {
    drawerToggle() {
      this.$refs.sideDrawer.show();
    },

    jizhanOnChange(v) {
      this.$refs.sll7?.jizhanToggle(v);
    },

    xinbiaoOnChange(v) {
      this.l7.switch.jz = v;
      this.$refs.sll7?.xinbiaoToggle(v);
    },

    weilanOnchange(v) {
      this.l7.switch.wl = v;
      this.$refs.sll7?.polygonLayerToggle(v);
    },

    toggleCollapse() {
      this.collapsed = !this.collapsed;
    },

    // ⭐ 新增：左侧折叠
    togglePendingCollapse() {
      this.pendingCollapsed = !this.pendingCollapsed;
    },

    selectPendingTask(task) {
      this.currentTask = task;
      this.nav.enabled = task.status === '执行中';
    },

    async handleShowTaskArea() {
      if (!this.currentTask?.areaId) return;
      const res = await productAreaApi.getProductAreaById(this.currentTask.areaId);
      const area = res?.data || res;
      this.$refs.sll7?.showTaskArea(area);
    },

    async fetchMyTask() {
      try {
        const res = await taskApi.taskMy();
        const list = Array.isArray(res) ? res : [];

        const newPending = list.filter(t => t.status === '已派发');

        if (newPending.length > this.lastPendingCount) {
          this.flashRedDot = true;
          setTimeout(() => {
            this.flashRedDot = false;
          }, 3000);
        }

        this.lastPendingCount = newPending.length;
        this.pendingTaskList = newPending;

        this.currentTask =
          list.find(t => t.status === '执行中') ||
          this.currentTask ||
          this.pendingTaskList[0] ||
          null;

        this.nav.enabled = this.currentTask?.status === '执行中';
      } catch (e) {
        console.error('[fetchMyTask]', e);
      }
    },

    async handleStartNav() {
      if (!this.currentTask?.id) return;
      await taskApi.taskStart({ taskId: this.currentTask.id });
      this.$refs.sll7.navStartFixed();
      await this.fetchMyTask();
    },

    async handleArrived() {
      if (!this.currentTask?.id) return;
      await taskApi.taskArrived({ taskId: this.currentTask.id });
      this.$refs.sll7.navArrived();
      await this.fetchMyTask();
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
