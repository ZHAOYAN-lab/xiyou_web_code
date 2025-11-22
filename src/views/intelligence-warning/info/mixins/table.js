export default {
  data() {
    return {
      search: {
        locationObjectName: '', //告警对象
        beaconMac: '',
        alarmStatus: '',
        alarmType: '',
        dateTime: [],
        order: ''
      },
      emailSwitch: {
        id: '',
        value: false
      },
      datePickerOption: {
        disabledDate(date) {
          return date && date.valueOf() > Date.now();
        }
      },
      searchData: {
        alarmType: [
          { value: 1, key: 'a' },
          { value: 2, key: 'b' },
          { value: 3, key: 'c' }
        ],
        alarmStatus: [
          { value: 1, key: 'b' },
          { value: 0, key: 'c' }
        ],
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
          title: this.$t('warningInfo.table.beacon'),
          minWidth: 170,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('div', [
              h(
                'span',
                item.alarmLocationObject.locationObjectBeacon
                  ? item.alarmLocationObject.locationObjectBeacon.beaconMac
                  : this.$t('base.noData')
              )
            ]);
          }
        },
        {
          title: this.$t('warningInfo.table.object'),
          minWidth: 140,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('div', [h('span', item.alarmLocationObject.locationObjectName)]);
          }
        },
        {
          title: this.$t('warningInfo.table.status'),
          minWidth: 170,
          align: 'center',
          render: (h, params) => {
            let item = params.row;

            return h('Badge', {
              props: {
                color: item.alarmStatus ? 'green' : 'red',
                text: this.searchData.alarmStatus.reduce((str, ele) => {
                  if (ele.value === +item.alarmStatus) {
                    str = ele.label;
                  }
                  return str;
                }, '')
              }
            });
          }
        },
        {
          title: this.$t('fenceManage.fenceName'),
          minWidth: 170,
          align: 'center',
          render: (h, params) => {
            let item = params.row;

            return h('span', item.alarmFence ? item.alarmFence.fenceName : this.$t('base.noData'));
          }
        },
        {
          title: this.$t('warningInfo.table.content'),
          minWidth: 150,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h(
              'span',
              this.searchData.alarmType.reduce((str, ele) => {
                if (ele.value === +item.alarmType) {
                  str = this.$t(`warningInfo.warningContent.${ele.key}`);
                }
                return str;
              }, '')
            );
          }
        },
        {
          title: this.$t('warningInfo.table.type'),
          minWidth: 170,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h(
              'span',
              this.searchData.alarmType.reduce((str, ele) => {
                if (ele.value === +item.alarmType) {
                  str = ele.label;
                }
                return str;
              }, '')
            );
          }
        },

        {
          title: this.$t('warningInfo.table.date'),
          align: 'center',
          minWidth: 150,
          // sortable: true,
          render: (h, params) => {
            let item = params.row;

            if (item.alarmTime > 0) {
              return h('div', [
                h('p', this.$pub.slTimeFormat(item.alarmTime, { format: 'YYYY-MM-DD' })),
                h(
                  'p',
                  this.$pub.slTimeFormat(item.alarmTime, {
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
          title: this.$t('base.option'),
          width: this.mixinIsZHCN ? 150 : 170,
          align: 'center',
          fixed: 'right',
          render: (h, params) => {
            let item = params.row;

            return h('div', { class: 'table-option' }, [
              h(
                'span',
                {
                  class: item.alarmStatus ? 'disabled' : 'default',
                  on: {
                    click: () => {
                      if (!item.alarmStatus) {
                        this.tableHandleStatus(item);
                      }
                    }
                  }
                },
                this.$t('warningInfo.table.handle')
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
      let slConvertTimestamp = this.$pub.slConvertTimestamp;
      let search = this.search;

      let query = {
        beaconMac: search.beaconMac,
        locationObjectName: search.locationObjectName,
        alarmType: search.alarmType,
        alarmStatus: search.alarmStatus,
        start:
          search.dateTime.length && search.dateTime[0]
            ? slConvertTimestamp(search.dateTime[0])
            : '',
        end:
          search.dateTime.length && search.dateTime[1] ? slConvertTimestamp(search.dateTime[1]) : ''
      };

      if (!this.$pub.slIsEmpty(search.order)) {
        query.asc = Boolean(search.order);
      }

      this.$refs.slComTable.init({
        query: {
          page: 0,
          ...this.$pub.slDeleteEmptyField(query)
        },
        func: (params) => {
          return new Promise((resolve) => {
            this.$api
              .warningInfoGetTable({
                data: params
              })
              .then((res) => {
                resolve(res);
              });
          });
        }
      });
    },
    // 处理告警
    tableHandleStatus(item) {
      this.$api.warningInfoHandleWarning({ data: { alarmId: item.alarmId } }).then(() => {
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
          this.$api.warningInfoDelete({ data: { alarmId: item.alarmId } }).then(() => {
            this.handleRefreshTable();
            this.$Modal.remove();
            this.$Message.success(this.$t('base.deleteSuccess'));
          });
        }
      });
    },

    searchDataInit() {
      let searchData = this.searchData;
      searchData.alarmType.forEach((ele) => {
        ele.label = this.$t(`base.config.warningType.${ele.key}`);
      });
      searchData.alarmStatus.forEach((ele) => {
        ele.label = this.$t(`home.card5.${ele.key}`);
      });

      searchData.order = [
        {
          value: 1,
          label: this.$t('warningInfo.sort.data.a')
        },
        {
          value: 0,
          label: this.$t('warningInfo.sort.data.b')
        }
      ];
    }
  }
};
