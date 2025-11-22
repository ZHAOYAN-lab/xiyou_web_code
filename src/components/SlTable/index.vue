<template>
  <div :id="tId" class="sl-com-table" :class="{ 'no-data': !table.data.length }">
    <div v-show="table.data.length" class="sl-table-content">
      <Table
        ref="tables"
        class="sl-table"
        :highlight-row="tHighlightrow"
        :disabled-hover="tDisabledhover"
        :border="tBorder"
        :loading="tLoading"
        :columns="tColumns"
        :data="table.data"
        :width="table.width"
        :span-method="spanMethod"
      ></Table>

      <div v-show="tPage" class="sl-table-page">
        <Page
          v-show="table.data.length"
          ref="pages"
          :page-size="table.pageSize"
          :total="table.total"
          @on-change="handlePageChange"
        />
      </div>
    </div>
    <div v-show="!table.data.length" class="sl-table-no-data">
      <sl-empty />
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex';

export default {
  name: 'SlTable',
  components: {},
  mixins: [],
  props: {
    // 自定义类名字
    tId: {
      type: String,
      default: '',
      required: true
    },
    tPageHeight: {
      type: Number,
      default: 60
    },
    tColumns: {
      type: Array,
      default: function () {
        return [];
      }
    },
    tLoading: {
      type: Boolean,
      default: false
    },
    tBorder: {
      type: Boolean,
      default: true
    },
    tResize: {
      type: Boolean,
      default: true
    },
    tWidth: {
      type: Number,
      default: 300
    },
    tPage: {
      type: Boolean,
      default: true
    },
    tHighlightrow: {
      type: Boolean,
      default: true
    },
    tDisabledhover: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      initFinish: false,
      table: {
        width: 0,
        data: [
          // {
          //   number: 10000,
          //   type: 'Gateway1',
          //   name: '测试数据',
          //   dateTime: '1972-01-06 02:14:07',
          //   status: true,
          //   checkBox: false
          // },
          // {
          //   number: 10001,
          //   type: 'Gateway2',
          //   name: '测试数据',
          //   dateTime: '1987-07-16 22:28:33',
          //   status: false,
          //   checkBox: false
          // },
          // {
          //   number: 10002,
          //   type: 'Gateway1',
          //   name: '测试数据',
          //   dateTime: '1993-12-10 05:38:27',
          //   status: false,
          //   checkBox: false
          // },
          // {
          //   number: 10002,
          //   type: 'Gateway1',
          //   name: '测试数据',
          //   dateTime: '1993-12-10 05:38:27',
          //   status: false,
          //   checkBox: false
          // },
          // {
          //   number: 10002,
          //   type: 'Gateway1',
          //   name: '测试数据',
          //   dateTime: '1993-12-10 05:38:27',
          //   status: false,
          //   checkBox: false
          // },
          // {
          //   number: 10002,
          //   type: 'Gateway1',
          //   name: '测试数据',
          //   dateTime: '1993-12-10 05:38:27',
          //   status: false,
          //   checkBox: false
          // },
          // {
          //   number: 10002,
          //   type: 'Gateway1',
          //   name: '测试数据',
          //   dateTime: '1993-12-10 05:38:27',
          //   status: false,
          //   checkBox: false
          // },
          // {
          //   number: 10002,
          //   type: 'Gateway1',
          //   name: '测试数据',
          //   dateTime: '1993-12-10 05:38:27',
          //   status: false,
          //   checkBox: false
          // },
          // {
          //   number: 10002,
          //   type: 'Gateway1',
          //   name: '测试数据',
          //   dateTime: '1993-12-10 05:38:27',
          //   status: false,
          //   checkBox: false
          // },
          // {
          //   number: 10002,
          //   type: 'Gateway1',
          //   name: '测试数据',
          //   dateTime: '1993-12-10 05:38:27',
          //   status: false,
          //   checkBox: false
          // },
          // {
          //   number: 10002,
          //   type: 'Gateway1',
          //   name: '测试数据',
          //   dateTime: '1993-12-10 05:38:27',
          //   status: false,
          //   checkBox: false
          // }
        ],
        pageSize: 10, //每页数量
        total: 0, //总数量
        maxHeight: 1, //表格最大高度
        getData: null,
        query: null
      },
      tableWidth: 1000,
      flag: false
    };
  },
  computed: mapState({
    collapsed: (state) => state.app.collapsed
  }),
  watch: {
    collapsed() {
      this.handleSetTableWidth();
    }
  },
  beforeDestroy() {
    // console.log('销毁监听');

    if (this.tResize) {
      window.removeEventListener('resize', this.handleTableMaxHeight);
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.tResize) {
        this.handleTableMaxHeight();
        window.addEventListener('resize', this.handleTableMaxHeight);
      } else {
        this.table.width = this.tWidth;
      }
    });
  },
  methods: {
    // 外部调用
    init(params) {
      let table = this.table;

      table.query = params.query;
      table.getData = params.func;

      if (params.spanMethod) {
        table.spanMethod = params.spanMethod;
      }

      this.handleTableGetData({ page: 0 });
    },

    // 获取 表格数据
    handleTableGetData(params) {
      let table = this.table;

      let query = table.query;

      if (params) {
        query.page = params.page;
      }
      query.size = table.pageSize;

      console.log('表格参数：', JSON.stringify(table.query, null, 2));

      table.getData(table.query).then((res) => {
        let page = res.number;

        // 后台数据被删除 造成前端 分页数据异常
        if (!res.content.length && page !== 0) {
          this.handleTableGetData({ page: this.$refs.pages.currentPage - 2 });
        } else {
          table.data = res.content;
          table.total = res.totalElements;
          if (!page) {
            this.$refs.pages.currentPage = 1;
          }
        }
      });
    },

    // 计算表格最大高度
    handleTableMaxHeight() {
      this.handleSetTableWidth();
    },
    // 设置表格宽度
    handleSetTableWidth() {
      let width = window.innerWidth;

      // console.log('当前页面宽度：', width);
      // console.log('当前侧边栏宽度：', this.collapsed ? 65 : 272);
      // console.log('当前剩余宽度：', width - (this.collapsed ? 65 : 272) - 40 - 34);

      this.table.width = width - (this.collapsed ? 65 : 242) - 25 - 34;
    },

    //切换每页的回调
    handlePageChange(currentPage) {
      this.handleTableGetData({ page: currentPage - 1 });
    },
    // 刷新表格 用于新增/编辑/删除 操作
    handleRefreshtable() {
      let page = this.$refs.pages.currentPage;

      this.handlePageChange(page);
    },

    spanMethod({ row, column, rowIndex, columnIndex }) {
      if (this.table.spanMethod) {
        return this.table.spanMethod(row, column, rowIndex, columnIndex);
      }
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
