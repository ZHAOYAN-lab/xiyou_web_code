import mixin_config from '@/mixins/mixin-config';

export default {
  mixins: [mixin_config],
  data() {
    return {
      search: {
        beaconMac: '', //信标mac
        locationObjectName: '', //对象
        beaconOnline: '', //状态
        beaconAllow: '', //是否录入
        beaconType: [], //信标类型
        beaconProduct: '', //信标型号

        order: '' //排序类型
      },
      searchData: {
        beaconOnline: [],
        beaconAllow: [],
        beaconProduct: [],
        order: []
      },
      table: {
        columns: []
      }
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.searchDataInit();

      this.tableInit();
    });
  },
  methods: {
    tableInit() {
      this.table.columns = [
        {
          title: this.$t('beaconManage.table.mac'),
          minWidth: 180,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('span', item.beaconMac ? item.beaconMac : this.$t('base.noData'));
          }
        },
        {
          title: this.$t('beaconManage.table.model'),
          minWidth: 150,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('span', item.beaconProduct ? item.beaconProduct : this.$t('base.noData'));
          }
        },
        {
          title: this.$t('beaconManage.table.type'),
          key: 'name',
          minWidth: 150,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            let OBJECT_TYPE = this.mixinConfig.BEACON_AND_LOCATION_OBJECT_TYPE;
            let type = [...OBJECT_TYPE.data, OBJECT_TYPE.none].reduce((str, ele) => {
              if (ele.value === item.beaconType) {
                str = ele.label;
              }
              return str;
            }, '');

            return h('span', { props: { slot: 'count' } }, type);
          }
        },
        {
          title: this.$t('beaconManage.table.location'),
          align: 'center',
          children: [
            {
              title: this.$t('beaconManage.table.x'),
              minWidth: 150,
              align: 'center',
              render: (h, params) => {
                let item = params.row;
                return h('span', item.beaconX ? item.beaconX : this.$t('base.noData'));
              }
            },
            {
              title: this.$t('beaconManage.table.y'),
              minWidth: 150,
              align: 'center',
              render: (h, params) => {
                let item = params.row;
                return h('span', item.beaconY ? item.beaconY : this.$t('base.noData'));
              }
            },
            {
              title: this.$t('beaconManage.table.z'),
              minWidth: 150,
              align: 'center',
              render: (h, params) => {
                let item = params.row;
                return h('span', item.beaconZ ? item.beaconZ : this.$t('base.noData'));
              }
            }
          ]
        },
        {
          title: this.$t('beaconManage.table.status'),
          minWidth: 150,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            //  在线 / 离线
            return h('div', [
              h('span', item.beaconOnline ? this.$t('base.online') : this.$t('base.outline'))
            ]);
          }
        },
        {
          title: this.$t('beaconManage.table.whetherAdd'),
          key: 'beaconAllow',
          minWidth: 150,
          align: 'center',
          render: (h, params) => {
            let item = params.row;

            //  已录入显示“是”，未录入显示“否”
            return h('div', [
              h('span', item.beaconAllow ? this.$t('base.yes') : this.$t('base.no'))
            ]);
          }
        },

        {
          title: this.$t('beaconManage.table.object'),
          minWidth: 150,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('div', [
              h(
                'span',
                item.beaconLocationObject
                  ? item.beaconLocationObject.locationObjectName
                  : this.$t('base.noData')
              )
            ]);
          }
        },
        {
          title: this.$t('beaconManage.table.date'),
          key: 'beaconJoinTime',
          align: 'center',
          minWidth: 150,
          render: (h, params) => {
            let item = params.row;

            if (item.beaconJoinTime > 0) {
              return h('div', [
                h('p', this.$pub.slTimeFormat(item.beaconJoinTime, { format: 'YYYY-MM-DD' })),
                h(
                  'p',
                  this.$pub.slTimeFormat(item.beaconJoinTime, {
                    format: 'HH:mm:ss'
                  })
                )
              ]);
            } else {
              return h('div', [h('p', this.$t('base.noData'))]);
            }
          }
        },
        {
          title: this.$t('beaconManage.table.remark'),
          minWidth: 150,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('span', item.beaconRemark ? item.beaconRemark : this.$t('base.noData'));
          }
        },

        {
          title: this.$t('base.option'),
          fixed: 'right',
          width: this.mixinIsZHCN ? 220 : 280,
          align: 'center',
          render: (h, params) => {
            let item = params.row;

            return h('div', { class: 'table-option' }, [
              h(
                'span',
                {
                  class: item.beaconAllow ? 'disabled' : 'default',
                  on: {
                    click: () => {
                      if (!item.beaconAllow) {
                        this.$api
                          .beaconManageLuRu({ data: { beaconId: item.beaconId } })
                          .then(() => {
                            this.$Message.success(this.$t('base.optionSuccess'));
                            this.handleRefreshTable();
                          });
                      }
                    }
                  }
                },
                this.$t('beaconManage.add')
              ),
              h(
                'span',
                {
                  class: !item.beaconAllow ? 'disabled' : 'default',
                  on: {
                    click: () => {
                      if (item.beaconAllow) {
                        this.tableSetObject(item);
                      }
                    }
                  }
                },
                this.$t('beaconManage.table.setObject')
              ),
              h(
                'span',
                {
                  on: {
                    click: () => {
                      this.$refs.addXinbiao.show(item);
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
      let search = this.$pub.slDeleteEmptyField(this.search);

      if (search.order) {
        search.asc = search.order === this.searchData.order[0].value;
      }

      this.$refs.slComTable.init({
        query: {
          page: 0,
          ...search
        },
        func: (params) => {
          return new Promise((resolve) => {
            this.$api
              .beaconManageGetTable({
                data: params
              })
              .then((res) => {
                resolve(res);
              });
          });
        }
      });
    },
    tableDeleteItem(item) {
      this.$Modal.confirm({
        title: this.$t('base.delete'),
        content: this.$t('base.sureDelete'),
        // loading: true,
        okText: this.$t('base.sure'),
        cancelText: this.$t('base.cancel'),
        onOk: () => {
          this.$api
            .beaconManageDeleteBeacon({
              data: {
                beaconId: item.beaconId
              }
            })
            .then(() => {
              this.handleRefreshTable();
              this.$Modal.remove();
              this.$Message.success(this.$t('base.deleteSuccess'));
            });
        }
      });
    },
    // 设置对象
    tableSetObject(item) {
      this.$refs.setObject.show(item);
    },

    searchDataInit() {
      let searchData = this.searchData;

      // 状态
      searchData.beaconOnline = [
        {
          label: this.$t('base.online'),
          value: 1
        },
        {
          label: this.$t('base.outline'),
          value: 0
        }
      ];

      // 是否录入
      searchData.beaconAllow = [
        {
          label: this.$t('base.yes'),
          value: 1
        },
        {
          label: this.$t('base.no'),
          value: 0
        }
      ];

      // 类型
      this.$api.beaconManageGetAllBeaconType({ loading: false }).then((res) => {
        searchData.beaconProduct = res.reduce((arr, ele) => {
          arr.push({
            label: ele,
            value: ele
          });
          return arr;
        }, []);
      });

      searchData.order = [
        {
          value: 'beaconLocationObject.locationObjectName',
          label: this.$t('beaconManage.sort.data.a')
        },
        {
          value: 'beaconJoinTime',
          label: this.$t('beaconManage.sort.data.b')
        }
      ];
    }
  }
};
