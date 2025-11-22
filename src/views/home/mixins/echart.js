import * as echarts from 'echarts/core';
import { PieChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  CanvasRenderer
]);
import { ResizeObserver } from '@juggle/resize-observer';
import { mapState } from 'vuex';

export default {
  data() {
    return {
      windowOnSizeFlag: true,
      chartInMinsScreen: false,
      chartReSizeFlag: true,
      card3Chart: {
        id: 'card3Chart',
        chart: null,
        data: [
          { value: 0, name: '人员数量', key: 'a', type: 1 },
          { value: 0, name: '物品数量', key: 'b', type: 2 },
          { value: 0, name: '设备数量', key: 'c', type: 3 },
          { value: 0, name: '车辆数量', key: 'd', type: 4 }
        ]
      },
      card4Chart: {
        id: 'card4Chart',
        chart: null,
        data: []
      },
      // 今日告警
      card5Table: {
        detail: {
          statusTrue: 0,
          statusFalse: 0
        },
        table: []
      },
      // 信标
      card6Chart: {
        id: 'card6Chart',
        chart: null,
        detail: {
          online: 0,
          outline: 0
        },
        data: [
          { value: 0, name: '在线数量', key: 'b' },
          { value: 0, name: '离线数量', key: 'c' }
        ]
      },
      // 基站
      card7Chart: {
        id: 'card7Chart',
        chart: null,
        detail: {
          online: 0,
          outline: 0
        },
        data: [
          { value: 0, name: '在线数量', key: 'b' },
          { value: 0, name: '离线数量', key: 'c' }
        ]
      },
      card8Chart: {
        id: 'card8Chart',
        chart: null,
        data: [
          { value: 0, name: '进入人员', key: 'a', type: 1 },
          { value: 0, name: '离开人员', key: 'b', type: 2 },
          {
            value: 0,
            name: '进入非关联对象',
            key: 'c',
            type: 3
          }
        ]
      }
    };
  },
  computed: mapState({
    collapsed: (state) => state.app.collapsed
  }),
  beforeDestroy() {
    if (this.homeMainOnresizeObserver) {
      this.homeMainOnresizeObserver.disconnect();
      this.homeMainOnresizeObserver = null;
      // console.log('销毁监听');
    }

    window.removeEventListener('resize', this.resizeFun);
  },
  mounted() {
    this.$nextTick(() => {
      // this.chartInit();

      this.homeMainResize();

      this.resizeFun = () => {
        // console.log('浏览器窗口变化');

        this.handleWindowReSize();
      };

      window.addEventListener('resize', this.resizeFun);
    });
  },
  methods: {
    handleHomeMain() {
      let width = window.innerWidth;
      let defaultWidth = 1300;

      if (this.mixinFullscreen) {
        this.chartInMinsScreen = width < defaultWidth;
      } else {
        this.chartInMinsScreen = width - (this.collapsed ? 65 : 242) < defaultWidth;
      }
    },

    handleWindowReSize() {
      // console.log('this.windowOnSizeFlag:', this.windowOnSizeFlag);
      // console.log('this.chartReSizeFlag:', this.chartReSizeFlag);

      if (this.windowReSize) {
        this.windowReSize();
      } else {
        this.windowReSize = this.$pub.slDebounce(() => {
          // 执行方法

          if (this.windowOnSizeFlag && this.chartReSizeFlag) {
            // console.log('浏览器窗口变化-----函数');
            this.windowOnSizeFlag = false;
            this.chartInit();
            setTimeout(() => {
              this.windowOnSizeFlag = true;
            }, 1000);
          }
        }, 500);
      }
    },

    hanleEChartReSize() {
      if (this.eChartReSize) {
        this.eChartReSize();
      } else {
        this.eChartReSize = this.$pub.slDebounce(() => {
          // 执行方法
          // console.log('main-side-bar----宽度变化');

          this.chartInit();
        }, 300);
      }
    },

    homeMainResize() {
      this.homeMainOnresizeObserver = new ResizeObserver(() => {
        this.hanleEChartReSize();
      });

      this.homeMainOnresizeObserver.observe(document.getElementById('main-side-bar'));
    },

    chartInit() {
      if (this.debounceChart) {
        this.debounceChart();
      } else {
        this.debounceChart = this.$pub.slDebounce(() => {
          //  执行方法
          // console.log('重新chatinit');

          this.chartReSizeFlag = false;

          this.handleHomeMain();

          this.card3ChartInit();
          this.card4ChartInit();
          this.card6ChartInit();
          this.card7ChartInit();
          this.card8ChartInit();

          setTimeout(() => {
            this.$refs.iviewCarousel.handleResize();
          }, 500);
        }, 200);

        this.debounceChart();
      }
    },

    card3ChartInit(params) {
      let cardChart = this.card3Chart;
      let dom = document.getElementById(cardChart.id);

      if (params) {
        cardChart.data = params.data;
      }

      let total = cardChart.data.reduce((number, ele) => {
        number += ele.value;
        return number;
      }, 0);

      let option = {
        backgroundColor: '#fff',
        color: ['#AC72FD', '#3491FA', '#14C9C9', '#F7BA1E'],
        title: {
          text: total,
          subtext: this.$t('home.pub.d'),
          left: 'center',
          top: '39%',
          itemGap: 5,
          textStyle: {
            fontSize: 30,
            color: '#454c5c',
            align: 'center'
          },
          subtextStyle: {
            fontSize: 16,
            color: '#6c7a89'
          }
        },
        // legend: {
        //   top: -5,
        //   itemHeight: 6,
        //   itemWidth: 6,
        //   icon: 'rect',
        //   left: 'right',
        //   textStyle: {
        //     color: '#666666',
        //     fontSize: this.chartInMinsScreen ? 12 : 14
        //   },
        //   data: cardChart.data.reduce((arr, ele, index) => {
        //     if (index === 2) {
        //       arr.push('');
        //     }
        //     arr.push(ele.name);
        //     return arr;
        //   }, [])
        // },

        legend: {
          bottom: -5,
          itemHeight: 6,
          itemWidth: 6,
          icon: 'rect',
          // orient: 'vertical',
          left: 'center',
          textStyle: {
            color: '#666666',
            fontSize: 14
          }
        },
        tooltip: {
          trigger: 'item'
        },
        series: [
          {
            type: 'pie',
            bottom: 15,
            radius: ['45%', '65%'],
            itemStyle: {
              borderWidth: 2,
              borderColor: '#fff'
            },
            emphasis: {
              // scaleSize: 12
            },

            label: {
              show: true,
              formatter: '{value|{c}}',
              // formatter: '{name|{b}}\n{value|{c}}',
              rich: {
                value: {
                  fontSize: '16px',
                  color: '#333333',
                  align: 'left'
                  // fontWeight: 'bold'
                }
              }
            },
            // labelLine: {
            //   length: 25
            // },
            data: cardChart.data
          }
        ]
      };

      this.handleChart(cardChart, option, dom);
    },

    card4ChartInit(params) {
      let cardChart = this.card4Chart;
      let dom = document.getElementById(cardChart.id);

      if (params) {
        cardChart.data = params.data;
      }

      let gridLeftRightValue = this.mixinIsZHCN ? '2%' : '3%';

      let option = {
        grid: {
          top: '15%',
          left: gridLeftRightValue,
          right: gridLeftRightValue,
          bottom: '2%',
          containLabel: true
        },
        xAxis: {
          // type: 'time',
          type: 'category',
          data: cardChart.data.reduce((arr, ele) => {
            arr.push(this.$pub.slTimeFormat(ele[0], { format: 'HH:mm' }));
            return arr;
          }, []),
          axisTick: {
            show: false
          },
          axisLine: {
            lineStyle: {
              color: '#C9CDD4'
            }
          },
          axisLabel: {
            color: '#86909C'
          }
        },
        yAxis: {
          type: 'value',
          name: this.$t('home.card4.a'),
          nameLocation: 'end',
          nameTextStyle: {
            padding: [0, 20, 20, 0]
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed'
            }
          },
          axisLabel: {
            color: '#86909C'
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            let title = this.$t('home.card4.b');

            // console.log(params[0]);

            return (
              '<div>' +
              '<span style="display:inline-block;margin-right:5px;border-radius:50%;width:6px;height:6px;background-color:#008afb;position: relative;top:-3px"></span>' +
              '<span style="color:#333;">' +
              title +
              '</span>' +
              '<br>' +
              '<p style="text-left: right; color:#333;">' +
              params[0].axisValue +
              '<p style="text-left: right; color:#333;">value:' +
              params[0].value +
              '</p>' +
              '</div>'
            );
          }
        },
        series: [
          {
            data: cardChart.data.reduce((arr, ele) => {
              arr.push(ele[1]);
              return arr;
            }, []),
            type: 'line',
            smooth: true,
            emphasis: {
              disabled: true
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgba(222,237,255)'
                },
                {
                  offset: 1,
                  color: 'rgba(255,255,255)'
                }
              ])
            },
            symbol: 'none',
            lineStyle: {
              color: '#008afb'
              // width: 5
            }
          }
        ]
      };

      this.handleChart(cardChart, option, dom);
    },

    card6ChartInit(params) {
      let cardChart = this.card6Chart;
      let dom = document.getElementById(cardChart.id);

      if (params) {
        cardChart.data = params.data;
      }

      let total = cardChart.data.reduce((number, ele) => {
        number += ele.value;
        return number;
      }, 0);

      let option = {
        backgroundColor: '#fff',
        color: ['#F7C12F', '#3491FA'],
        title: {
          text: total, //主标题文本
          subtext: this.$t('home.pub.d'),
          left: 'center',
          top: '39%',
          itemGap: 5,
          textStyle: {
            fontSize: 30,
            color: '#454c5c',
            align: 'center'
          },
          subtextStyle: {
            fontSize: 16,
            color: '#6c7a89'
          }
        },

        legend: {
          bottom: 0,
          itemHeight: 6,
          itemWidth: 6,
          icon: 'rect',
          // orient: 'vertical',
          left: 'center',
          textStyle: {
            color: '#666666',
            fontSize: 14
          }
        },
        tooltip: {
          trigger: 'item'
        },
        series: [
          {
            // name: '访问来源',
            type: 'pie',
            radius: ['45%', '65%'],
            itemStyle: {
              borderWidth: 2, //设置border的宽度有多大
              borderColor: '#fff'
            },
            emphasis: {
              // scaleSize: 12
            },
            label: {
              show: true,
              formatter: '{value|{c}}',
              // formatter: '{name|{b}}\n{value|{c}}',
              rich: {
                // name: {
                //   fontSize: '16px',
                //   color: '#666666'
                // },
                value: {
                  fontSize: '16px',
                  color: '#333333',
                  align: 'left'
                  // fontWeight: 'bold'
                }
              }
            },

            data: cardChart.data
          }
        ]
      };

      this.handleChart(cardChart, option, dom);
    },
    card7ChartInit(params) {
      let cardChart = this.card7Chart;
      let dom = document.getElementById(cardChart.id);

      if (params) {
        cardChart.data = params.data;
      }

      let total = cardChart.data.reduce((number, ele) => {
        number += ele.value;
        return number;
      }, 0);

      let option = {
        backgroundColor: '#fff',
        color: ['#F7C12F', '#AC72FD'],
        title: {
          text: total, //主标题文本
          subtext: this.$t('home.pub.d'),
          left: 'center',
          top: '39%',
          itemGap: 5,
          textStyle: {
            fontSize: 30,
            color: '#454c5c',
            align: 'center'
          },
          subtextStyle: {
            fontSize: 16,
            color: '#6c7a89'
          }
        },
        // legend: false,

        legend: {
          bottom: 0,
          itemHeight: 6,
          itemWidth: 6,
          icon: 'rect',
          // orient: 'vertical',
          left: 'center',
          textStyle: {
            color: '#666666',
            fontSize: 14
          }
        },
        tooltip: {
          trigger: 'item'
        },
        series: [
          {
            // name: '访问来源',
            type: 'pie',
            radius: ['45%', '65%'],
            itemStyle: {
              borderWidth: 2, //设置border的宽度有多大
              borderColor: '#fff'
            },
            emphasis: {
              // scaleSize: 12
            },
            label: {
              show: true,
              formatter: '{value|{c}}',
              // formatter: '{name|{b}}\n{value|{c}}',
              rich: {
                // name: {
                //   fontSize: '16px',
                //   color: '#666666'
                // },
                value: {
                  fontSize: '16px',
                  color: '#333333',
                  align: 'left'
                  // fontWeight: 'bold'
                }
              }
            },

            // labelLine: {
            //   length: 20
            // },

            data: cardChart.data
            // selectedOffset: 109
          }
        ]
      };
      this.handleChart(cardChart, option, dom);
    },

    card8ChartInit(params) {
      let cardChart = this.card8Chart;
      let dom = document.getElementById(cardChart.id);
      let flag = this.chartInMinsScreen;
      let radius = flag ? '50%' : '60%';
      // let data = cardChart.data.reduce((arr, ele) => {
      //   ele.name = this.$t(`home.card8.${ele.key}`);
      //   arr.push(ele);
      //   return arr;
      // }, []);

      if (params) {
        cardChart.data = params.data;
      }

      let option = {
        // backgroundColor: '#F5F7FB',
        color: ['#14C9C9', '#AC72FD', '#F7BA1E', '#3491FA'],
        legend: {
          bottom: flag ? 15 : 10,
          itemHeight: 6,
          itemWidth: 6,
          icon: 'rect',

          left: 'center',
          textStyle: {
            color: '#666666',
            fontSize: 14
          }
        },
        tooltip: {
          trigger: 'item'
        },
        series: [
          {
            type: 'pie',
            radius: radius,
            zlevel: 2,
            label: {
              show: true,
              formatter: '{value|{c}}',
              rich: {
                value: {
                  fontSize: '16px',
                  color: '#333333',
                  align: 'left'
                  // fontWeight: 'bold'
                }
              }
            },
            data: cardChart.data
          },
          {
            type: 'pie',
            zlevel: 3,
            radius: radius,
            label: {
              show: true,
              position: 'inside', //标签的位置
              textStyle: {
                fontSize: 14,
                color: '#ffffff'
                // fontWeight: 'bold'
              },
              formatter: function (d) {
                return Math.round(d.percent) + '%';
              }
            },
            data: cardChart.data
          }
        ]
      };

      this.handleChart(cardChart, option, dom);
    },

    handleChart(cardChart, option, dom) {
      if (cardChart.chart) {
        cardChart.chart.dispose();
        cardChart.chart = null;
        dom.innerHTML = '';

        setTimeout(() => {
          this.handleAfterHandleChart(cardChart, option, dom);
        }, 100);
      } else {
        this.handleAfterHandleChart(cardChart, option, dom);
      }
    },
    handleAfterHandleChart(cardChart, option, dom) {
      cardChart.chart = echarts.init(dom);
      cardChart.chart.setOption(option);

      setTimeout(() => {
        // console.log('图表渲染结束 this.chartReSizeFlag:', this.chartReSizeFlag);
        this.chartReSizeFlag = true;
      }, 2000);
    }
  }
};
