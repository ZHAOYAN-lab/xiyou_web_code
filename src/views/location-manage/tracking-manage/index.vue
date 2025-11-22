<template>
  <div class="sl-main-content">
    <Card :bordered="false" class="map-card card-search" dis-hover>
      <p slot="title" class="title">{{ $t('trackingManage.title') }}</p>
      <div slot="extra" class="sl-main-search-header">
        <div class="sl-margin-right-10">
          <div class="sl-width-150">
            <sl-map-cascader
              ref="mapCascader"
              @onChange="mapCascaderOnChange"
              @onSetMapData="mapCascaderOnsetData"
            />
          </div>
        </div>
        <div class="sl-margin-right-10">
          <Select
            v-model="search.object.value"
            class="sl-width-150"
            clearable
            :placeholder="$t('beaconManage.table.object')"
          >
            <Option v-for="item in search.object.data" :key="item.value" :value="item.value">{{
              item.label
            }}</Option>
          </Select>
        </div>
        <div class="sl-margin-right-15">
          <DatePicker
            v-model="search.dateTime.data"
            transfer
            :editable="false"
            type="datetimerange"
            format="yyyy-MM-dd HH:mm:ss"
            :placeholder="$t('base.date')"
            class="sl-width-360"
            :options="search.dateTime.datePickerOption"
          ></DatePicker>
        </div>
        <div>
          <Button type="primary" @click="getObjectTracking">{{ $t('base.search') }}</Button>
        </div>
      </div>

      <div class="for-map"><sl-l7 v-if="l7.show" ref="sll7" :fullscreen="false" /></div>
    </Card>
  </div>
</template>
<script>
import { mapState } from 'vuex';
import l7 from './mixins/l7';
export default {
  components: {},
  mixins: [l7],
  inject: ['reload'],
  data() {
    return {
      search: {
        mapId: '',
        object: {
          value: '',
          data: []
        },
        dateTime: {
          data: [],
          datePickerOption: {
            disabledDate(date) {
              return (
                (date && date.valueOf() > Date.now()) ||
                (date && date.valueOf() < Date.now() - 86400000 * 30)
              );
            }
          }
        }
      }
    };
  },
  computed: mapState({}),
  watch: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {
      this.objectManageGetAllAvailable();
    });
  },
  activated() {},
  methods: {
    mapCascaderOnsetData() {
      let mapCascader = this.$refs.mapCascader;
      let a = mapCascader.getFirstUseMap();

      mapCascader.setValue(a[2]);

      this.mapCascaderOnChange(a[2]);
    },
    // 缓存地图id
    mapCascaderOnChange(params) {
      this.search.mapId = params;

      this.$api
        .pubGetMapDetailByMapId({
          data: {
            mapId: this.search.mapId
          }
        })
        .then((data) => {
          let l7 = this.l7;

          l7.show = false;

          this.$nextTick(() => {
            l7.show = true;
            this.$nextTick(() => {
              let sll7 = this.$refs.sll7;
              sll7.mapInit().then(() => {
                sll7.mapSetBackgroundImage(data);
              });
            });
          });
        });
    },
    // 获取全部可用对象
    objectManageGetAllAvailable() {
      this.$api.objectManageGetAllAvailable({ loading: false }).then((res) => {
        this.search.object.data = res.reduce((arr, ele) => {
          arr.push({
            value: ele.locationObjectId,
            label: ele.locationObjectName
          });
          return arr;
        }, []);
      });
    },

    // 查询对象轨迹
    getObjectTracking() {
      let s = this.search;
      let warning = this.$pub.slIsEmptyMsg(
        {
          mapId: s.mapId,
          objectValue: s.object.value,
          dateTime: s.dateTime.data.length && s.dateTime.data[0] ? 1 : ''
        },
        [
          {
            key: 'mapId',
            msg: this.$t('trackingManage.warning.a')
          },
          // {
          //   key: 'objectValue',
          //   msg: this.$t('trackingManage.warning.b')
          // },
          {
            key: 'dateTime',
            msg: this.$t('trackingManage.warning.c')
          }
        ]
      );

      if (!warning) {
        let slConvertTimestamp = this.$pub.slConvertTimestamp;
        let query = {
          mapId: s.mapId,
          locationObjectId: s.object.value,
          start: slConvertTimestamp(s.dateTime.data[0]),
          end: slConvertTimestamp(s.dateTime.data[1])
        };

        this.$api.trackingManageGetTracking({ data: query }).then((res) => {
          // 处理 轨迹数据并显示

          setTimeout(() => {
            // 清除当前 轨迹
            this.$refs.sll7.guijiClear();
            // 画图
            this.$refs.sll7.guijiSetData(res);
          }, 1000);
        });

        // this.$refs.sll7.guijiClear();

        // let res = {
        //   3: [
        //     {
        //       x: '9.263677597045898',
        //       y: '0.4077938997745514',
        //       mapId: '6',
        //       z: '1.2000000476837158',
        //       time: '2023-07-20T21:43:41.331Z',
        //       loId: '3'
        //     },
        //     {
        //       x: '8.263677597045898',
        //       y: '0.3077967309951782',
        //       mapId: '6',
        //       z: '1.2000000476837158',
        //       time: '2023-07-20T21:43:41.616Z',
        //       loId: '3'
        //     },
        //     {
        //       x: '7.263677597045898',
        //       y: '0.20779494285583496',
        //       mapId: '6',
        //       z: '1.2000000476837158',
        //       time: '2023-07-20T21:43:41.982Z',
        //       loId: '3'
        //     }
        //   ],
        //   4: [
        //     {
        //       x: '1.263677597045898',
        //       y: '1.4077938997745514',
        //       mapId: '6',
        //       z: '1.2000000476837158',
        //       time: '2023-07-20T21:43:41.331Z',
        //       loId: '3'
        //     },
        //     {
        //       x: '2.263677597045898',
        //       y: '2.3077967309951782',
        //       mapId: '6',
        //       z: '1.2000000476837158',
        //       time: '2023-07-20T21:43:41.616Z',
        //       loId: '3'
        //     },
        //     {
        //       x: '3.263677597045898',
        //       y: '3.20779494285583496',
        //       mapId: '6',
        //       z: '1.2000000476837158',
        //       time: '2023-07-20T21:43:41.982Z',
        //       loId: '3'
        //     }
        //   ]
        // };

        // this.$refs.sll7.guijiSetData(res);
      } else {
        this.$Message.warning(warning);
      }
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
