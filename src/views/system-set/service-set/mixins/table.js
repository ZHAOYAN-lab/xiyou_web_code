export default {
  data() {
    return {
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
          title: this.$t('serviceSet.table.localService'),
          align: 'center',

          children: [
            {
              title: this.$t('serviceSet.table.mac'),
              align: 'center',
              minWidth: 150,
              key: 'localServerMac'
            },
            {
              title: this.$t('serviceSet.table.onlineStatus'),
              align: 'center',
              minWidth: 140,
              render: (h, params) => {
                let item = params.row;
                return h('Badge', {
                  props: {
                    color: item.localServerOnline ? 'green' : 'red',
                    text: item.localServerOnline ? this.$t('base.online') : this.$t('base.outline')
                  }
                });
              }
            }
          ]
        },
        {
          title: this.$t('serviceSet.table.cpuService'),
          align: 'center',

          children: [
            {
              title: this.$t('serviceSet.table.deviceCode'),
              align: 'center',
              minWidth: 150,
              key: 'localServerCleCode'
            },
            {
              title: this.$t('serviceSet.table.startStatus'),
              align: 'center',
              minWidth: 130,
              render: (h, params) => {
                let item = params.row;
                return h('Badge', {
                  props: {
                    color: item.localServerCleStartup ? 'green' : 'red',
                    text: item.localServerCleStartup
                      ? this.$t('serviceSet.table.start')
                      : this.$t('serviceSet.table.stop')
                  }
                });
              }
            },
            {
              title: this.$t('serviceSet.table.active'),
              align: 'center',
              minWidth: 130,
              render: (h, params) => {
                let item = params.row;
                return h('Badge', {
                  props: {
                    color: item.localServerCleActivation ? 'green' : 'red',
                    text: item.localServerCleActivation
                      ? this.$t('serviceSet.table.activeTrue')
                      : this.$t('serviceSet.table.activeFalse')
                  }
                });
              }
            },

            {
              title: this.$t('serviceSet.table.endDate'),
              align: 'center',
              minWidth: 130,
              render: (h, params) => {
                let item = params.row;

                if (item.localServerCleLicenseExpireTime > 0) {
                  return h('div', [
                    h(
                      'p',
                      this.$pub.slTimeFormat(item.localServerCleLicenseExpireTime, {
                        format: 'YYYY-MM-DD'
                      })
                    ),
                    h(
                      'p',
                      this.$pub.slTimeFormat(item.localServerCleLicenseExpireTime, {
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
              title: this.$t('serviceSet.table.file'),
              align: 'center',
              minWidth: 170,
              key: 'localServerCleLicenseFileName',
              render: (h, params) => {
                let item = params.row;
                return h('div', [
                  h(
                    'span',
                    item.localServerCleLicenseFileName
                      ? item.localServerCleLicenseFileName
                      : this.$t('base.noData')
                  )
                ]);
              }
            },
            {
              title: this.$t('serviceSet.table.lastFileDate'),
              align: 'center',
              minWidth: 150,
              render: (h, params) => {
                let item = params.row;

                if (item.localServerLastTime > 0) {
                  return h('div', [
                    h(
                      'p',
                      this.$pub.slTimeFormat(item.localServerLastTime, { format: 'YYYY-MM-DD' })
                    ),
                    h(
                      'p',
                      this.$pub.slTimeFormat(item.localServerLastTimelocalServerLastTime, {
                        format: 'HH:mm:ss'
                      })
                    )
                  ]);
                } else {
                  return h('div', [h('p', this.$t('base.noData'))]);
                }
              }
            }
          ]
        },

        {
          title: this.$t('serviceSet.table.remark'),
          align: 'center',
          minWidth: 100,
          render: (h, params) => {
            let item = params.row;
            return h('div', [
              h('span', item.localServerRemark ? item.localServerRemark : this.$t('base.noData'))
            ]);
          }
        },

        {
          title: this.$t('base.option'),
          width: this.mixinIsZHCN ? 180 : 290,
          fixed: 'right',
          align: 'center',
          render: (h, params) => {
            let item = params.row;

            return h('div', { class: 'table-option' }, [
              h(
                'span',
                {
                  on: {
                    click: () => {
                      this.$Modal.confirm({
                        render: (h) => {
                          return h('Input', {
                            props: {
                              type: 'textarea',
                              maxlength: 30,
                              value: this.value,
                              autofocus: true,
                              placeholder: `${this.$t('serviceSet.table.editRemark')}`
                            },
                            on: {
                              input: (val) => {
                                this.value = val;
                              }
                            }
                          });
                        },
                        // loading: true,
                        okText: this.$t('base.sure'),
                        cancelText: this.$t('base.cancel'),
                        onOk: () => {
                          // console.log('value:', this.value);
                          this.$api
                            .serviceSetEditItem({
                              data: {
                                localServerId: item.localServerId,
                                localServerRemark: this.value
                              }
                            })
                            .then(() => {
                              this.$refs.slComTable.handleRefreshtable();
                              this.$Modal.remove();
                              this.$Message.success(this.$t('base.optionSuccess'));
                            });
                        }
                      });
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
                      this.$refs.modalUpload.show(item);
                    }
                  }
                },
                this.$t('serviceSet.table.uploadFile')
              )
            ]);
          }
        }
      ];
    },
    tableGetData() {
      this.$refs.slComTable.init({
        query: {
          page: 0
        },
        func: (params) => {
          return new Promise((resolve) => {
            this.$api
              .serviceSetGetTableData({
                data: params
              })
              .then((res) => {
                resolve(res);
              });
          });
        }
      });
    }
  }
};
