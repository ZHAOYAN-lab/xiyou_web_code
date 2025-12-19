<template>
  <div class="sl-main">
    <header-bar @drawerToggle="drawerToggle"></header-bar>

    <div class="for-map">

      <!-- ✅ 右侧：可折叠任务卡片（不遮右上角） -->
      <div
        class="task-info-box"
        :class="{ collapsed }"
      >
        <div class="title" @click="toggleCollapse">
          <span>我的任务</span>
          <span class="collapse-btn">
            {{ collapsed ? '展开' : '收起' }}
          </span>
        </div>

        <!-- 内容区 -->
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
          </div>
        </div>
      </div>

      <!-- 地图本体（完全不动） -->
      <Card :bordered="false" class="map-card" dis-hover>
        <sl-l7
          v-if="l7.show"
          ref="sll7"
          :switch-jizhan="l7.switch.jz"
          :switch-weilan="l7.switch.wl"
        />
      </Card>
    </div>

    <!-- =========================
      导航按钮区
    ============================-->
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

export default {
  components: { HeaderBar, SideDrawer },
  mixins: [l7],

  data() {
    return {
      nav: {
        enabled: false
      },
      currentTask: null,
      collapsed: false
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.l7.show = true;
      this.fetchMyTask();
    });
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

    /* =========================
     * 拉取当前账号任务
     * ========================= */
    async fetchMyTask() {
      try {
        const res = await taskApi.taskMy();
        console.log('[taskMy]', res);

        this.currentTask =
          Array.isArray(res) && res.length > 0
            ? res[0]
            : null;

        // 如果后台已经是“执行中”，前端按钮同步
        this.nav.enabled = this.currentTask?.status === '执行中';
      } catch (e) {
        console.error('[fetchMyTask]', e);
        this.currentTask = null;
        this.nav.enabled = false;
      }
    },

    /* =========================
     * 开始导航 → 已派发 → 执行中
     * ========================= */
    async handleStartNav() {
      if (!this.currentTask?.id) return;

      try {
        // ⚠️ 关键：taskId 以 query 形式传给后端
        await taskApi.taskStart({
          taskId: this.currentTask.id
        });

        // 地图开始导航
        this.$refs.sll7.navStartFixed();
        this.nav.enabled = true;

        // 重新拉任务，同步后台状态
        await this.fetchMyTask();

        this.$Message.success('任务已开始执行');
      } catch (e) {
        console.error('[taskStart]', e);
        this.$Message.error('开始执行失败');
      }
    },

    /* =========================
     * 已到达 → 执行中 → 已完成
     * ========================= */
    async handleArrived() {
      if (!this.currentTask?.id) return;

      try {
        // ⚠️ 关键：taskId 以 query 形式传给后端
        await taskApi.taskArrived({
          taskId: this.currentTask.id
        });

        // 清除导航
        this.$refs.sll7.navArrived();
        this.nav.enabled = false;

        // 同步后台状态
        await this.fetchMyTask();

        this.$Message.success('任务已完成');
      } catch (e) {
        console.error('[taskArrived]', e);
        this.$Message.error('到达失败');
      }
    }
  }
};
</script>

<style lang="less" scoped>
@import url('./index.less');

/* 任务卡片：右侧 + 不遮右上角 + 可折叠 */
.task-info-box {
  position: absolute;
  top: 84px;     /* ✅ 已下移，避开右上角控件 */
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

/* 标题栏 */
.task-info-box .title {
  font-weight: bold;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}

.collapse-btn {
  font-size: 12px;
  color: #2d8cf0;
}

.task-info div {
  margin-bottom: 4px;
}

.empty {
  color: #999;
}

/* 底部导航按钮 */
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
