/* eslint-disable indent */
export default {
  data() {
    return {
      search: {
        buildingId: '',
        projectName: '',
        cpaFileName: '',
        mac: ''
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
          title: this.$t('floorSet.table.projectName'),
          minWidth: 100,
          key: 'projectName',
          align: 'center'
        },
        {
          title: this.$t('floorSet.table.cpa'),
          minWidth: 140,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h(
              'span',
              item.localServerCpaFileName ? item.localServerCpaFileName : this.$t('base.noData')
            );
          }
        },
        {
          title: this.$t('floorSet.table.mac'),
          minWidth: 140,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('span', item.localServerMac ? item.localServerMac : this.$t('base.noData'));
          }
        },
        {
          title: this.$t('floorSet.table.mapId'),
          minWidth: 100,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('span', item.mapId ? item.mapId : this.$t('base.noData'));
          }
        },
        {
          title: this.$t('floorSet.table.mapName'),
          minWidth: 120,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('span', item.mapCpaName ? item.mapCpaName : this.$t('base.noData'));
          }
        },

        {
          title: this.$t('floorSet.table.mapHeight'),
          minWidth: 130,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('span', item.mapHeight ? item.mapHeight : this.$t('base.noData'));
          }
        },

        {
          title: this.$t('floorSet.table.mapWidth'),
          minWidth: 130,
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('span', item.mapWidth ? item.mapWidth : this.$t('base.noData'));
          }
        },

        {
          title: this.$t('base.option'),
          width: 180,

          align: 'center',
          children: [
            {
              title: '-',
              width: 100,
              align: 'center',
              render: (h, params) => {
                let item = params.row;
                return h('div', [
                  h(
                    'span',
                    {
                      style: item.mapId
                        ? {
                            color: '#008afb',
                            cursor: 'pointer'
                          }
                        : {},
                      on: {
                        click: () => {
                          if (item.mapId) {
                            this.$refs.floorView.show(item);
                          }
                        }
                      }
                    },
                    item.mapId ? this.$t('base.see') : this.$t('base.noData')
                  )
                ]);
              }
            },
            {
              title: '-',
              width: 100,
              align: 'center',
              render: (h, params) => {
                let item = params.row;

                return h('div', [
                  h(
                    'span',
                    {
                      style: {
                        color: '#008afb',
                        cursor: 'pointer'
                      },
                      on: {
                        click: () => {
                          this.$refs.addFloor.show(item);
                        }
                      }
                    },
                    `${this.$t('floorSet.table.renew')}CPA`
                  )
                ]);
              }
            },
            {
              title: '-',
              width: 100,
              align: 'center',
              render: (h, params) => {
                let item = params.row;
                return h('div', [
                  h(
                    'span',
                    {
                      style: {
                        color: '#008afb',
                        cursor: 'pointer'
                      },
                      on: {
                        click: () => {
                          this.tableDeleteItem(item);
                        }
                      }
                    },
                    `${this.$t('base.delete')}CPA`
                  )
                ]);
              }
            }
          ]
        }
      ];
    },
    tableGetData() {
      let s = this.search;
      let warning = '';

      if (this.$pub.slHasChinese(s.mac)) {
        warning = `${this.$t('baseStation.table.mac')}${this.$t('base.warning.chinese')}`;
      }

      if (!warning) {
        this.$refs.slComTable.init({
          query: {
            page: 0,
            ...this.$pub.slDeleteEmptyField(this.search)
          },
          func: (params) => {
            return new Promise((resolve) => {
              this.$api
                .serviceSetGetTableData({
                  data: params
                })
                .then((res) => {
                  let mapData = res.content.reduce((arr, item) => {
                    console.log();

                    if (!item.mapList.length) {
                      item.mapList.push({
                        mapId: '',
                        mapCpaId: '',
                        mapCpaName: '',
                        mapModelType: '',
                        mapWidth: '',
                        mapHeight: '',
                        mapWidthPixel: '',
                        mapHeightPixel: '',
                        mapMetersPerPixel: '',
                        mapOriginPixelX: '',
                        mapOriginPixelY: '',
                        mapCpaAreas: [],
                        mapImgFileName: '',
                        mapImgSaveName: '',
                        mapImgViewUrl: '',
                        baseStationList: []
                      });
                    }

                    item.mapList.forEach((ele) => {
                      ele.projectName = item.localServerCpaProject;
                      ele.localServerMac = item.localServerMac;
                      ele.localServerCpaFileName = item.localServerCpaFileName;
                      ele.localServerCpaSaveName = item.localServerCpaSaveName;
                      ele.localServerId = item.localServerId;
                      arr.push(ele);
                    });

                    return arr;
                  }, []);

                  res.content = mapData.map((item, index) => {
                    item.colspan = 0;
                    item.rowspan = 0;
                    if (!item.isLoad) {
                      for (let i = index, len = mapData.length; i < len; i++) {
                        if (item.localServerId !== mapData[i].localServerId) {
                          break;
                        } else {
                          mapData[i].isLoad = true;
                          item.colspan = i - index + 1;
                          item.rowspan = 1;
                        }
                      }
                    }
                    return item;
                  });

                  console.log(JSON.stringify(res, null, 2));

                  resolve(res);
                });
            });
          },
          spanMethod: (row, column, rowIndex, columnIndex) => {
            if ([0, 1, 2, 8, 9].includes(columnIndex)) {
              return {
                colspan: row.rowspan,
                rowspan: row.colspan
              };
            }
          }
        });
      } else {
        this.$Message.warning(warning);
      }
    },
    tableDeleteItem(item) {
      this.$Modal.confirm({
        title: this.$t('base.delete'),
        content: this.$t('base.sureDelete'),
        // loading: true,
        okText: this.$t('base.sure'),
        cancelText: this.$t('base.cancel'),
        onOk: () => {
          this.$api.floorSetDeleteCpa({ data: { localServerId: item.localServerId } }).then(() => {
            this.$refs.slComTable.handleRefreshtable();
            this.$Modal.remove();
            this.$Message.success(this.$t('base.deleteSuccess'));
          });
        }
      });
    }
  }
};
