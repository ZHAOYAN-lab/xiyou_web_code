export default {
  data() {
    return {
      search: {
        mapCpaName: '', //地图名称
        fenceName: '', //围栏名称
        fenceType: '', //围栏类型
        fenceStatus: '' //围栏状态
      },
      table: {
        columns: []
      }
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.tableInit();
    });
  },
  methods: {
    tableInit() {
      this.table.columns = [
        {
          title: this.$t('fenceManage.mapName'),
          minWidth: 130,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('div', [h('span', item.fenceMap.mapCpaName)]);
          }
        },
        {
          title: this.$t('fenceManage.fenceName'),
          minWidth: 170,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('div', [h('span', item.fenceName)]);
          }
        },
        {
          title: this.$t('fenceManage.fenceType'),
          minWidth: 180,
          align: 'center',
          render: (h, params) => {
            let item = params.row;

            return h(
              'span',
              this.fenceTypeData.reduce((str, ele) => {
                if (ele.value === item.fenceType) {
                  str = ele.label;
                }
                return str;
              }, '')
            );
          }
        },
        {
          title: this.$t('fenceManage.fenceStatus'),
          minWidth: 220,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('Badge', {
              props: {
                color: item.fenceStatus ? 'green' : 'red',
                text: item.fenceStatus ? this.$t('base.undisabled') : this.$t('base.disabled')
              }
            });
          }
        },
        {
          title: this.$t('base.option'),
          width: 200,
          fixed: 'right',
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            // console.log(JSON.stringify(item, null, 2));

            return h('div', { class: 'table-option' }, [
              h(
                'span',
                {
                  class: item.fenceStatus ? 'delete' : '',
                  on: {
                    click: () => {
                      this.tableSetStatus(item);
                    }
                  }
                },
                item.fenceStatus ? this.$t('base.disabled') : this.$t('base.undisabled')
              ),
              h(
                'span',
                {
                  on: {
                    click: () => {
                      this.$refs.fenceDetail.show(item);
                    }
                  }
                },
                this.$t('base.see')
              ),
              h(
                'span',
                {
                  class: 'default',
                  on: {
                    click: () => {
                      this.$refs.addFence.show(item);
                    }
                  }
                },
                this.$t('base.edit')
              ),

              h(
                'span',
                {
                  on: {
                    click: () => {
                      this.tableDeleteItem(item);
                    }
                  }
                },
                this.$t('base.delete')
              )
            ]);
          }
        }
      ];
    },

    tableGetData() {
      let query = this.$pub.slDeleteEmptyField(this.search);

      if (Object.hasOwnProperty.call(query, 'fenceStatus')) {
        query.fenceStatus = Boolean(query.fenceStatus);
      }

      this.$refs.slComTable.init({
        query: {
          page: 0,
          ...query
        },
        func: (params) => {
          return new Promise((resolve) => {
            this.$api
              .fenceManageGetTable({
                data: params
              })
              .then((res) => {
                resolve(res);
              });
          });
        }
      });
    },

    // 启用禁用
    tableSetStatus(item) {
      this.$api
        .fenceManageSetStatus({
          data: {
            fenceId: item.fenceId,
            fenceStatus: !item.fenceStatus
          }
        })
        .then(() => {
          this.handleRefreshTable();
        });
    },

    // 删除
    tableDeleteItem(item) {
      this.$Modal.confirm({
        title: this.$t('base.delete'),
        content: this.$t('base.sureDelete'),
        // loading: true,
        okText: this.$t('base.sure'),
        cancelText: this.$t('base.cancel'),
        onOk: () => {
          this.$api
            .fenceManageDelete({
              data: {
                fenceId: item.fenceId
              }
            })
            .then(() => {
              this.handleRefreshTable();
              this.$Modal.remove();
              this.$Message.success(this.$t('base.deleteSuccess'));
            });
        }
      });
    }
  }
};
