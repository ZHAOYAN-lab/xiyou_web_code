export default {
  data() {
    return {
      search: {
        buildingName: ''
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
          title: this.$t('buildingSet.table.name'),
          minWidth: 100,
          align: 'center',
          key: 'buildingName'
        },
        {
          title: this.$t('buildingSet.table.address'),
          minWidth: 100,
          align: 'center',
          key: 'buildingAddress'
        },
        {
          title: this.$t('buildingSet.table.preview'),
          minWidth: 100,
          align: 'center',
          key: 'type',
          render: (h, params) => {
            let item = params.row;

            if (item.buildingImgViewUrl) {
              return h('img', {
                attrs: {
                  src: item.buildingImgViewUrl
                },
                style: {
                  width: '50px',
                  cursor: 'pointer'
                },
                on: {
                  click: () => {
                    this.$refs.mapView.show(item);
                  }
                }
              });
            } else {
              return h('span', this.$t('base.noData'));
            }
          }
        },

        {
          title: this.$t('base.option'),
          width: 150,
          fixed: 'right',
          align: 'center',
          render: (h, params) => {
            let item = params.row;

            return h('div', { class: 'table-option' }, [
              h(
                'span',
                {
                  class: 'default',
                  on: {
                    click: () => {
                      this.$refs.addBuild.show(item);
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
                      // this.demo(item);

                      this.$router.push({
                        name: 'floor_set',
                        query: { buildingId: item.buildingId }
                      });
                    }
                  }
                },
                this.$t('base.see')
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
      this.$refs.slComTable.init({
        query: {
          page: 0,
          ...this.$pub.slDeleteEmptyField(this.search)
        },
        func: (params) => {
          return new Promise((resolve) => {
            this.$api
              .buildingSetGetTableData({
                data: params
              })
              .then((res) => {
                resolve(res);
              });
          });
        }
      });
    },
    // 删除
    tableDeleteItem(item) {
      this.$Modal.confirm({
        title: this.$t('base.delete'),
        content: this.$t('buildingSet.deleteBuildMsg'),
        // loading: true,
        okText: this.$t('base.sure'),
        cancelText: this.$t('base.cancel'),
        onOk: () => {
          this.$api.buildingSetDelete({ data: { buildingId: item.buildingId } }).then(() => {
            this.handleRefreshTable();
            this.$Modal.remove();
            this.$Message.success(this.$t('base.deleteSuccess'));
          });
        }
      });
    }
  }
};
