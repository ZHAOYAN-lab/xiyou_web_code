export default {
  data() {
    return {
      search: {
        mapCpaName: '',
        fenceName: '',
        fenceType: '',
        fenceStatus: ''
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
        // 对象名称
        {
          title: this.$t('fenceManage.objectName'),
          minWidth: 150,
          align: 'center',
          render: (h, params) => {
            return h('span', params.row.objectName || '-');
          }
        },
        // 所属类型
        {
          title: this.$t('fenceManage.belongType'),
          minWidth: 150,
          align: 'center',
          render: (h, params) => {
            const item = params.row;
            const typeLabel = this.belongTypeData.find(ele => ele.value === item.belongType);
            return h('span', typeLabel ? typeLabel.label : '-');
          }
        },
        // 图标（新增）
        {
          title: this.$t('fenceManage.icon'),
          minWidth: 100,
          align: 'center',
          render: (h, params) => {
            const iconUrl = params.row.iconUrl;
            if (iconUrl) {
              return h('img', {
                attrs: {
                  src: iconUrl,
                  alt: 'icon'
                },
                style: {
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain'
                }
              });
            }
            return h('span', '-');
          }
        },
        // 地图名称
        {
          title: this.$t('fenceManage.mapName'),
          minWidth: 130,
          align: 'center',
          render: (h, params) => {
            return h('span', params.row.fenceMap?.mapCpaName || '-');
          }
        },
        // 围栏名称
        {
          title: this.$t('fenceManage.fenceName'),
          minWidth: 170,
          align: 'center',
          render: (h, params) => {
            return h('span', params.row.fenceName || '-');
          }
        },
        // 围栏类型
        {
          title: this.$t('fenceManage.fenceType'),
          minWidth: 180,
          align: 'center',
          render: (h, params) => {
            const item = params.row;
            const typeLabel = this.fenceTypeData.find(ele => ele.value === item.fenceType);
            return h('span', typeLabel ? typeLabel.label : '-');
          }
        },
        // 围栏状态
        {
          title: this.$t('fenceManage.fenceStatus'),
          minWidth: 220,
          align: 'center',
          render: (h, params) => {
            const item = params.row;
            return h('Badge', {
              props: {
                color: item.fenceStatus ? 'green' : 'red',
                text: item.fenceStatus ? this.$t('base.undisabled') : this.$t('base.disabled')
              }
            });
          }
        },
        // 操作列
        {
          title: this.$t('base.option'),
          width: 200,
          fixed: 'right',
          align: 'center',
          render: (h, params) => {
            const item = params.row;
            return h('div', { class: 'table-option' }, [
              // 启用/禁用
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
              // 查看
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
              // 编辑
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
              // 删除
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
      const query = this.$pub.slDeleteEmptyField(this.search);

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

    // 启用/禁用
    tableSetStatus(item) {
      this.$api
        .fenceManageSetStatus({
          data: {
            fenceId: item.fenceId,
            fenceStatus: !item.fenceStatus
          }
        })
        .then(() => {
          this.$refs.slComTable.handleRefreshtable();
          this.$Message.success(this.$t('base.optionSuccess'));
        });
    },

    // 删除
    tableDeleteItem(item) {
      this.$Modal.confirm({
        title: this.$t('base.delete'),
        content: this.$t('base.sureDelete'),
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
              this.$refs.slComTable.handleRefreshtable();
              this.$Modal.remove();
              this.$Message.success(this.$t('base.deleteSuccess'));
            });
        }
      });
    }
  }
};