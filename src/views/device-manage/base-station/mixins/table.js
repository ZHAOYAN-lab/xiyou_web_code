export default {
  data() {
    return {
      search: {
        mac: '',
        ip: ''
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
          title: this.$t('baseStation.table.mac'),
          minWidth: 130,
          key: 'baseStationMac',
          align: 'center'
        },
        {
          title: this.$t('baseStation.table.type'),
          minWidth: 100,
          key: 'baseStationProduct',
          align: 'center'
        },
        {
          title: this.$t('baseStation.table.ip'),
          minWidth: 130,
          key: 'baseStationIp',
          align: 'center',
          render: (h, params) => {
            let item = params.row;
            return h('span', item.baseStationIp ? item.baseStationIp : this.$t('base.noData'));
          }
        },
        {
          title: this.$t('baseStation.table.location'),
          align: 'center',
          children: [
            {
              title: this.$t('baseStation.table.x'),
              key: 'baseStationX',
              align: 'center',
              minWidth: 100
            },
            {
              title: this.$t('baseStation.table.y'),
              key: 'baseStationY',
              align: 'center',
              minWidth: 100
            }
          ]
        },
        {
          title: this.$t('baseStation.table.status'),
          align: 'center',
          minWidth: 130,
          render: (h, params) => {
            let item = params.row;
            return h('Badge', {
              props: {
                color: item.baseStationOnline ? 'green' : 'red',
                text: item.baseStationOnline ? this.$t('base.online') : this.$t('base.outline')
              }
            });
          }
        }
      ];
    },
    tableGetData() {
      let s = this.search;
      let warning = '';

      if (this.$pub.slHasChinese(s.mac)) {
        warning = `${this.$t('baseStation.table.mac')}${this.$t('base.warning.chinese')}`;
      } else if (this.$pub.slHasChinese(s.ip)) {
        warning = `ip${this.$t('base.warning.chinese')}`;
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
                .baseStationGetTable({
                  data: params
                })
                .then((res) => {
                  resolve(res);
                });
            });
          }
        });
      } else {
        this.$Message.warning(warning);
      }
    }
  }
};
