import mixin_config from '@/mixins/mixin-config';

export default {
  mixins: [mixin_config],
  data() {
    return {
      search: {
        locationObjectName: '',
        locationObjectType: [], //类型

        order: '' //排序类型
      },
      searchData: {
        order: []
      },
      table: {
        columns: []
      }
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.searchData.order = [
        {
          value: 'locationObjectName',
          label: this.$t('beaconManage.sort.data.a')
        },
        {
          value: 'locationObjectCreateTime',
          label: this.$t('beaconManage.sort.data.b')
        }
      ];

      this.tableInit();
    });
  },
  methods: {
    tableInit() {
      this.table.columns = [
        {
          title: this.$t('objectManage.table.name'),
          minWidth: 130,
          align: 'center',
          key: 'locationObjectName'
        },
        {
          title: this.$t('objectManage.table.type'),
          minWidth: 140,
          align: 'center',
          key: 'locationObjectType',
          render: (h, params) => {
            let item = params.row;
            let OBJECT_TYPE = this.mixinConfig.BEACON_AND_LOCATION_OBJECT_TYPE;
            let type = [...OBJECT_TYPE.data, OBJECT_TYPE.none].reduce((str, ele) => {
              if (ele.value === item.locationObjectType) {
                str = ele.label;
              }
              return str;
            }, '');

            return h('span', { props: { slot: 'count' } }, type);
          }
        },

        {
          title: this.$t('objectManage.table.icon'),
          align: 'center',
          key: 'img',
          minWidth: 100,
          render: (h, params) => {
            let item = params.row;

            if (item.locationObjectImgViewUrl) {
              return h('img', {
                attrs: {
                  src: item.locationObjectImgViewUrl
                },
                style: {
                  width: '30px',
                  cursor: 'pointer'
                }
              });
            } else {
              return h('span', this.$t('base.noData'));
            }
          }
        },

        {
          title: this.$t('objectManage.table.joinDate'),
          align: 'center',
          minWidth: 150,
          // sortable: true,
          render: (h, params) => {
            let item = params.row;

            if (item.locationObjectCreateTime > 0) {
              return h('div', [
                h(
                  'p',
                  this.$pub.slTimeFormat(item.locationObjectCreateTime, { format: 'YYYY-MM-DD' })
                ),
                h(
                  'p',
                  this.$pub.slTimeFormat(item.locationObjectCreateTime, {
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
          width: this.mixinIsZHCN ? 180 : 220,
          align: 'center',
          fixed: 'right',
          render: (h, params) => {
            let item = params.row;

            return h('div', { class: 'table-option' }, [
              h(
                'span',
                {
                  class: 'default',
                  on: {
                    click: () => {
                      this.$refs.bindMap.show(item);
                    }
                  }
                },
                this.$t('objectManage.table.bindMap')
              ),
              h(
                'span',
                {
                  class: 'default',
                  on: {
                    click: () => {
                      this.$refs.addObject.show(item);
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
              .objectManageGetTable({
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
            .objectManageDelete({ data: { locationObjectId: item.locationObjectId } })
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
