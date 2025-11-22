<template>
  <div class="a" :class="{ minsScreen: chartInMinsScreen }">
    <div class="b">
      <div>
        <div class="c">
          <div class="c-left" :class="{ 'margin-none': !isleftCollapsed }">
            <div class="sl-margin-bottom-14 sll7-map-content">
              <Card class="sl-card sl-card-01" :bordered="false" dis-hover>
                <div slot="title" class="title">
                  <span class="icon icon-1"></span>
                  <span>{{ $t('home.card1.title') }}</span>
                </div>
                <div slot="extra" class="extra">
                  <div class="switch">
                    <label>{{ $t('home.card1.a') }}</label
                    ><iSwitch v-model="l7.switch.jz" @on-change="l7MapToggleJiZhanLayer" />
                  </div>
                  <div class="switch">
                    <label>{{ $t('home.card1.b') }}</label
                    ><iSwitch v-model="l7.switch.xb" @on-change="l7MapToggleXinBiaoLayer" />
                  </div>
                  <div class="switch">
                    <label>{{ $t('home.card1.c') }}</label
                    ><iSwitch v-model="l7.switch.wl" @on-change="l7MapTogglePolygonLayer" />
                  </div>

                  <div class="sl-width-150">
                    <sl-map-cascader
                      ref="mapCascader"
                      @onChange="mapCascaderOnChange"
                      @onSetMapData="mapCascaderOnsetData"
                    />
                  </div>
                </div>

                <div class="l7-map">
                  <sl-l7
                    v-if="l7.show"
                    ref="sll7"
                    :switch-jizhan="l7.switch.jz"
                    :switch-weilan="l7.switch.wl"
                  />
                </div>

                <div class="option-sidebar">
                  <div
                    :class="{ hide: isleftOptionHide, close: !isleftCollapsed }"
                    @click="handleLeftCollpasedChange"
                  ></div>
                  <div :class="{ hide: !isleftOptionHide, close: !isleftCollapsed }"></div>
                </div>
              </Card>
            </div>

            <div class="sl-margin-bottom-14">
              <Card class="sl-card sl-card-04" :bordered="false" dis-hover>
                <div slot="title" class="title">
                  <span class="icon icon-4"></span>
                  <span>{{ $t('home.card4.title') }}</span>
                </div>

                <div class="card4Chart">
                  <div
                    id="card4Chart"
                    :class="{ show: card4Chart.data.length }"
                    class="chart-4"
                  ></div>
                  <sl-empty v-show="!card4Chart.data.length" />
                </div>
              </Card>
            </div>

            <div class="card-flex">
              <div>
                <Card class="sl-card sl-card-06" :bordered="false" dis-hover>
                  <div slot="title" class="title">
                    <span class="icon icon-6"></span>
                    <span>{{ $t('home.card6.title') }}</span>
                  </div>

                  <div class="content">
                    <div class="list-detail">
                      <div>
                        <p>{{ $t('home.pub.a') }}</p>
                        <p>{{ card6Chart.detail.online + card6Chart.detail.outline }}</p>
                      </div>
                      <div>
                        <p>{{ $t('home.pub.b') }}</p>
                        <p>{{ card6Chart.detail.online }}</p>
                      </div>
                      <div>
                        <p>{{ $t('home.pub.c') }}</p>
                        <p>{{ card6Chart.detail.outline }}</p>
                      </div>
                    </div>

                    <div id="card6Chart" class="card6Chart">
                      <sl-empty />
                    </div>
                  </div>
                </Card>
              </div>
              <div>
                <Card class="sl-card sl-card-07" :bordered="false" dis-hover>
                  <div slot="title" class="title">
                    <span class="icon icon-7"></span>
                    <span>{{ $t('home.card7.title') }}</span>
                  </div>

                  <div class="content">
                    <div class="list-detail">
                      <div>
                        <p>{{ $t('home.pub.a') }}</p>
                        <p>{{ card7Chart.detail.online + card7Chart.detail.outline }}</p>
                      </div>
                      <div>
                        <p>{{ $t('home.pub.b') }}</p>
                        <p>{{ card7Chart.detail.online }}</p>
                      </div>
                      <div>
                        <p>{{ $t('home.pub.c') }}</p>
                        <p>{{ card7Chart.detail.outline }}</p>
                      </div>
                    </div>

                    <div id="card7Chart" class="card7Chart">
                      <sl-empty />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
          <div class="c-right" :class="{ 'left-collapsed': !isleftCollapsed }">
            <div class="sl-margin-bottom-14">
              <Card class="sl-card sl-card-02" :bordered="false" dis-hover>
                <div slot="title" class="title">
                  <span class="icon icon-2"></span>
                  <span>{{ $t('home.card2.title') }}-{{ card2.title }}</span>
                </div>

                <div class="carousel-content">
                  <div class="carousel">
                    <Carousel
                      v-if="card2.carouselShow"
                      ref="iviewCarousel"
                      autoplay
                      loop
                      radius-dot
                      :autoplay-speed="5000"
                      @on-change="card2CarouselOnChange"
                    >
                      <CarouselItem v-for="(item, index) in card2.data" :key="index">
                        <div class="detail list-detail">
                          <div class="detail-item">
                            <p>{{ $t('home.pub.a') }}</p>
                            <p>{{ item.total }}</p>
                          </div>
                          <div class="detail-item">
                            <p>{{ $t('home.pub.b') }}</p>
                            <p>{{ item.online }}</p>
                          </div>
                          <div class="detail-item">
                            <p>{{ $t('home.pub.c') }}</p>
                            <p>{{ item.outline }}</p>
                          </div>
                        </div>
                      </CarouselItem>
                    </Carousel>
                  </div>
                </div>
              </Card>
            </div>
            <div class="sl-margin-bottom-14">
              <Card class="sl-card sl-card-03" :bordered="false" dis-hover>
                <div slot="title" class="title">
                  <span class="icon icon-3"></span>
                  <span>{{ $t('home.card3.title') }}</span>
                </div>

                <div id="card3Chart" class="card3Chart"><sl-empty /></div>
              </Card>
            </div>

            <div class="sl-margin-bottom-14">
              <Card class="sl-card sl-card-05" :bordered="false" dis-hover>
                <div slot="title" class="title">
                  <span class="icon icon-5"></span>
                  <span>{{ $t('home.card5.title') }}</span>
                </div>

                <div class="content">
                  <div class="list-detail list-detail-no-bg">
                    <div>
                      <p>{{ $t('home.card5.a') }}</p>
                      <p>{{ card5Table.detail.statusTrue + card5Table.detail.statusFalse }}</p>
                    </div>
                    <div>
                      <p>{{ $t('home.card5.b') }}</p>
                      <p>{{ card5Table.detail.statusTrue }}</p>
                    </div>
                    <div>
                      <p>{{ $t('home.card5.c') }}</p>
                      <p>{{ card5Table.detail.statusFalse }}</p>
                    </div>
                  </div>

                  <div class="warning-list">
                    <ul>
                      <li class="title">
                        <p>{{ $t('home.card5.d') }}</p>
                        <p>{{ $t('home.card5.e') }}</p>
                        <p>{{ $t('home.card5.f') }}</p>
                      </li>
                      <li v-for="(item, index) in card5Table.table" :key="index">
                        <p>0{{ index + 1 }}</p>
                        <p>
                          {{
                            item.alarm_location_object.locationObjectBeacon
                              ? item.alarm_location_object.locationObjectBeacon.beaconMac
                              : $t('base.noData')
                          }}
                        </p>
                        <p>{{ item.count }}</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <Card class="sl-card sl-card-08" :bordered="false" dis-hover>
                <div slot="title" class="title">
                  <span class="icon icon-7"></span>
                  <span>{{ $t('home.card8.title') }}</span>
                </div>

                <div class="content">
                  <div id="card8Chart" class="card8Chart"><sl-empty /></div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import card1 from './mixins/card1';
import card2 from './mixins/card2';
import echart1 from './mixins/echart';
export default {
  components: {},
  mixins: [card1, echart1, card2],
  inject: ['reload'],
  data() {
    return {
      isleftCollapsed: true,
      isleftOptionHide: false,
      timer: null,
      loadAFinish: false,
      loadBFinish: false
    };
  },

  beforeDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.getChartData();
    });
  },
  methods: {
    handleLeftCollpasedChange() {
      this.isleftCollapsed = !this.isleftCollapsed;

      this.isleftOptionHide = true;

      setTimeout(() => {
        this.isleftOptionHide = false;
      }, 2000);

      this.resizeFun();
      this.$refs.sll7.mapSetCenter();
    },
    getChartData() {
      this.homeGetLocationObjectAndDeviceGroup();
      this.homeGetAlarmGroup();

      this.timer = setTimeout(() => {
        this.getChartData();
      }, 60 * 1000);
    },

    // 定位对象相关图表：定位概览（人员-物品-设备-车辆）-在线对象分布-基站状态-信标状态
    homeGetLocationObjectAndDeviceGroup() {
      this.$api.homeGetLocationObjectAndDeviceGroup({ loading: false }).then((res) => {
        this.card2SetData(res.locationObject);

        let card3ChartData = this.handleCard3ChartData(res);
        let card6ChartData = this.handleCard6ChartData(res);
        let card7ChartData = this.handleCard7ChartData(res);

        if (this.loadAFinish) {
          // card3Chart
          let card3ChartOption = this.card3Chart.chart.getOption();

          card3ChartOption.title[0].text = card3ChartData.reduce((number, ele) => {
            number += ele.value;
            return number;
          }, 0);
          card3ChartOption.series[0].data = card3ChartData;
          this.card3Chart.chart.setOption(card3ChartOption);

          //card6Chart
          let card6ChartOption = this.card6Chart.chart.getOption();

          card6ChartOption.title[0].text = card6ChartData.reduce((number, ele) => {
            number += ele.value;
            return number;
          }, 0);
          card6ChartOption.series[0].data = card6ChartData;
          this.card6Chart.chart.setOption(card6ChartOption);

          // card7Chart
          let card7ChartOption = this.card7Chart.chart.getOption();

          card7ChartOption.title[0].text = card7ChartData.reduce((number, ele) => {
            number += ele.value;
            return number;
          }, 0);
          card7ChartOption.series[0].data = card7ChartData;
          this.card7Chart.chart.setOption(card7ChartOption);
        } else {
          this.loadAFinish = true;
          this.card3ChartInit({ data: card3ChartData });
          this.card6ChartInit({ data: card6ChartData });
          this.card7ChartInit({ data: card7ChartData });
        }
      });
    },

    // 今日警告-今日告警类别占比-24小时告警变化
    homeGetAlarmGroup() {
      this.$api.homeGetAlarmGroup({ loading: false }).then((res) => {
        let card4ChartData = this.handleCard4ChartData(res);
        let card8ChartData = this.handleCard8ChartData(res);
        if (this.loadBFinish) {
          //card4Chart

          if (card4ChartData.length) {
            if (this.card4Chart.chart) {
              let card4ChartOption = this.card4Chart.chart.getOption();

              card4ChartOption.series[0].data = card4ChartData.reduce((arr, ele) => {
                arr.push(ele[1]);
                return arr;
              }, []);

              card4ChartOption.xAxis.data = card4ChartData.reduce((arr, ele) => {
                arr.push(this.$pub.slTimeFormat(ele[0], { format: 'HH:mm' }));
                return arr;
              }, []);
              this.card4Chart.chart.setOption(card4ChartOption);
              this.card4Chart.data = card4ChartData;
            } else {
              this.card4ChartInit({ data: card4ChartData });
            }
          } else {
            this.card4Chart.data = card4ChartData;
          }

          //card8Chart

          let card8ChartOption = this.card8Chart.chart.getOption();

          card8ChartOption.series[0].data = card8ChartData;
          this.card8Chart.chart.setOption(card8ChartOption);
        } else {
          this.loadBFinish = true;

          if (card4ChartData.length) {
            this.card4ChartInit({ data: card4ChartData });
          }
          this.card8ChartInit({ data: card8ChartData });
        }

        this.handleCard5ChartData(res);
      });
    },

    // 处理在线对象分布数据
    handleCard3ChartData(res) {
      let data = this.card3Chart.data.reduce((arr, ele) => {
        ele.name = this.$t(`home.card3.${ele.key}`);
        ele.value = 0;
        arr.push(ele);
        return arr;
      }, []);

      res.locationObject.forEach((ele) => {
        data.forEach((item) => {
          if (ele.type === item.type && ele.online) {
            item.value += ele.count;
          }
        });
      });

      return data;
    },

    // 处理24小时告警变化数据
    handleCard4ChartData(res) {
      return res.time24AlarmList.reduce((arr, ele) => {
        arr.push([ele.time, ele.count]);
        return arr;
      }, []);
    },
    // 今日告警
    handleCard5ChartData(res) {
      this.card5Table.table = res.todayAlarmRank;
      this.card5Table.detail = res.todayAlarmGroup.reduce(
        (obj, ele) => {
          if (ele.status) {
            obj.statusTrue += ele.count;
          } else {
            obj.statusFalse += ele.count;
          }

          return obj;
        },
        {
          statusTrue: 0,
          statusFalse: 0
        }
      );
    },
    handleCard6ChartData(res) {
      let data = this.card6Chart.data.reduce((arr, ele) => {
        ele.name = this.$t(`home.pub.${ele.key}`);
        ele.value = 0;
        arr.push(ele);
        return arr;
      }, []);

      let detail = this.card6Chart.detail;

      detail.online = 0;
      detail.outline = 0;

      res.beacon.forEach((ele) => {
        let count = ele.count;
        if (ele.online) {
          data[0].value = count;
          detail.online = count;
        } else {
          data[1].value = count;
          detail.outline = count;
        }
      });

      return data;
    },
    handleCard7ChartData(res) {
      let data = this.card7Chart.data.reduce((arr, ele) => {
        ele.name = this.$t(`home.pub.${ele.key}`);
        ele.value = 0;
        arr.push(ele);
        return arr;
      }, []);

      let detail = this.card7Chart.detail;

      detail.online = 0;
      detail.outline = 0;

      res.baseStation.forEach((ele) => {
        let count = ele.count;
        if (ele.online) {
          data[0].value = count;
          detail.online = count;
        } else {
          data[1].value = count;
          detail.outline = count;
        }
      });

      return data;
    },

    // 今日告警类别占比
    handleCard8ChartData(res) {
      let data = this.card8Chart.data.reduce((arr, ele) => {
        ele.name = this.$t(`home.card8.${ele.key}`);
        ele.value = 0;
        arr.push(ele);
        return arr;
      }, []);

      res.todayAlarmGroup.forEach((ele) => {
        data.forEach((item) => {
          if (ele.type === item.type) {
            item.value += ele.count;
          }
        });
      });

      return data;
    }
  }
};
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>
