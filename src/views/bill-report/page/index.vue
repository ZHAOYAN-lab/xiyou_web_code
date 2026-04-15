<template>
  <div ref="pageRoot" class="bill-report-page">
    <Card class="report-hero" :bordered="false" dis-hover>
      <div class="hero-wrap">
        <div class="hero-copy">
          <p class="hero-eyebrow">{{ $t('sideBarMenu.billReport') }}</p>
          <h2 class="hero-title">{{ $t('billReport.title') }}</h2>
          <p class="hero-subtitle">{{ $t('billReport.subtitle') }}</p>
          <div class="hero-meta">
            <span>
              <Icon type="ios-pulse" />
              {{ $t('billReport.text.generatedAt') }}: {{ generatedLabel }}
            </span>
            <span>
              <Icon type="ios-pin" />
              {{ $t('billReport.text.mapLabel') }}: {{ currentMapLabel }}
            </span>
            <span>
              <Icon type="ios-calendar-outline" />
              {{ selectedRangeText }}
            </span>
          </div>
        </div>

        <div class="hero-panel">
          <div class="filter-grid">
            <div class="filter-item">
              <label>{{ $t('base.map') }}</label>
              <sl-map-cascader
                ref="mapCascader"
                @onChange="handleMapChange"
                @onSetMapData="handleMapReady"
              />
            </div>

            <div class="filter-item wide">
              <label>{{ $t('billReport.filter.range') }}</label>
              <DatePicker
                v-model="filters.dateRange"
                transfer
                :editable="false"
                type="datetimerange"
                format="yyyy-MM-dd HH:mm:ss"
                class="filter-range"
              ></DatePicker>
            </div>
          </div>

          <div class="hero-actions">
            <Button type="primary" :loading="loading" @click="loadReport">
              {{ $t('billReport.action.refresh') }}
            </Button>
            <Button @click="handleExportExcel">{{ $t('billReport.action.exportExcel') }}</Button>
            <Button @click="handleExportPdf">{{ $t('billReport.action.exportPdf') }}</Button>
          </div>
        </div>
      </div>
    </Card>

    <div class="metric-switch">
      <button
        v-for="item in metricTabs"
        :key="item.value"
        type="button"
        class="metric-pill"
        :class="{ active: activeMetric === item.value }"
        @click="activeMetric = item.value"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="summary-grid">
      <div v-for="card in summaryCards" :key="card.key" class="summary-card" :class="card.key">
        <div class="summary-icon">
          <Icon :type="card.icon" />
        </div>
        <p class="summary-label">{{ card.label }}</p>
        <p class="summary-value">{{ card.value }}</p>
        <p class="summary-desc">{{ card.desc }}</p>
      </div>
    </div>

    <div class="main-grid">
      <Card class="surface-card heat-panel" :bordered="false" dis-hover>
        <div slot="title" class="panel-title-row">
          <div>
            <p class="panel-title">{{ $t('billReport.panel.distribution') }}</p>
            <p class="panel-tip">{{ activeMetricLabel }}</p>
          </div>
        </div>

        <div v-if="heatNodes.length" class="heat-layout">
          <div class="heat-stage">
            <div class="heat-grid"></div>

            <svg class="heat-route-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line
                v-for="item in heatRoutes"
                :key="item.key"
                :x1="item.start.left"
                :y1="item.start.top"
                :x2="item.end.left"
                :y2="item.end.top"
                class="heat-route"
                :style="{ strokeWidth: `${item.strokeWidth}px` }"
              />
            </svg>

            <div
              v-for="item in heatNodes"
              :key="item.areaId"
              class="heat-node-wrap"
              :style="{ left: `${item.left}%`, top: `${item.top}%` }"
            >
              <div class="heat-node" :class="item.levelKey" :style="{ width: `${item.size}px`, height: `${item.size}px` }">
                <span>{{ metricValueText(item) }}</span>
              </div>
              <p v-if="item.showLabel" class="heat-node-label">{{ item.objectName }}</p>
            </div>
          </div>

          <div class="heat-side">
            <div class="legend-box">
              <div class="legend-item">
                <span class="legend-dot high"></span>
                <span>{{ $t('billReport.level.high') }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot medium"></span>
                <span>{{ $t('billReport.level.medium') }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot stable"></span>
                <span>{{ $t('billReport.level.stable') }}</span>
              </div>
            </div>

            <div class="focus-list">
              <div v-for="(item, index) in topFocusAreas" :key="item.areaId" class="focus-card">
                <span class="focus-rank">{{ formatRank(index + 1) }}</span>
                <div class="focus-copy">
                  <p class="focus-name">{{ item.objectName }}</p>
                  <p class="focus-text">{{ focusReasonText(item) }}</p>
                </div>
                <Tag :color="levelColor(item.levelKey)">{{ $t(`billReport.level.${item.levelKey}`) }}</Tag>
              </div>
            </div>
          </div>
        </div>

        <sl-empty v-else />
      </Card>

      <div class="aside-stack">
        <Card class="surface-card rank-panel" :bordered="false" dis-hover>
          <div slot="title" class="panel-title-row">
            <div>
              <p class="panel-title">{{ $t('billReport.panel.ranking') }}</p>
              <p class="panel-tip">{{ activeMetricLabel }}</p>
            </div>
          </div>

          <div v-if="rankingItems.length" class="ranking-list">
            <div v-for="(item, index) in rankingItems" :key="item.areaId" class="ranking-item">
              <div class="ranking-head">
                <div class="ranking-name-wrap">
                  <span class="ranking-index">{{ formatRank(index + 1) }}</span>
                  <span class="ranking-name">{{ item.objectName }}</span>
                </div>
                <span class="ranking-value">{{ metricValueText(item) }}</span>
              </div>
              <div class="ranking-bar-track">
                <div class="ranking-bar-fill" :style="{ width: `${rankingWidth(item)}%` }"></div>
              </div>
              <div class="ranking-meta">
                <span>{{ areaTypeLabel(item.areaType) }}</span>
                <span>{{ $t(`billReport.level.${item.levelKey}`) }}</span>
              </div>
            </div>
          </div>

          <sl-empty v-else />
        </Card>

        <Card class="surface-card chart-panel" :bordered="false" dis-hover>
          <div slot="title" class="panel-title-row">
            <div>
              <p class="panel-title">{{ $t('billReport.panel.alarmTrend') }}</p>
              <p class="panel-tip">{{ selectedRangeText }}</p>
            </div>
          </div>

          <div v-if="report.trends.length" :id="chartIds.trend" class="chart-box small"></div>
          <sl-empty v-else />
        </Card>
      </div>
    </div>

    <div class="chart-grid">
      <Card class="surface-card chart-panel" :bordered="false" dis-hover>
        <div slot="title" class="panel-title-row">
          <div>
            <p class="panel-title">{{ $t('billReport.panel.densityCompare') }}</p>
            <p class="panel-tip">{{ $t('billReport.analysis.people') }} / {{ $t('billReport.analysis.material') }}</p>
          </div>
        </div>

        <div v-if="report.areas.length" :id="chartIds.density" class="chart-box"></div>
        <sl-empty v-else />
      </Card>

      <Card class="surface-card chart-panel" :bordered="false" dis-hover>
        <div slot="title" class="panel-title-row">
          <div>
            <p class="panel-title">{{ $t('billReport.panel.routeNetwork') }}</p>
            <p class="panel-tip">{{ $t('billReport.panel.routeFlow') }}</p>
          </div>
        </div>

        <div v-if="report.routes.length" :id="chartIds.route" class="chart-box"></div>
        <sl-empty v-else />
      </Card>
    </div>

    <Card class="surface-card table-panel" :bordered="false" dis-hover>
      <div slot="title" class="panel-title-row">
        <div>
          <p class="panel-title">{{ $t('billReport.panel.detail') }}</p>
          <p class="panel-tip">{{ `${report.areas.length} ${$t('billReport.text.areaUnit')}` }}</p>
        </div>
      </div>

      <Table border :columns="tableColumns" :data="report.areas" :loading="loading"></Table>
    </Card>

    <div ref="pdfSheet" class="pdf-sheet">
      <div class="pdf-inner">
        <div class="pdf-head">
          <div>
            <p class="pdf-title">{{ $t('billReport.title') }}</p>
            <p class="pdf-subtitle">{{ $t('billReport.subtitle') }}</p>
          </div>
          <div class="pdf-meta">
            <p>{{ $t('billReport.text.generatedAt') }}: {{ generatedLabel }}</p>
            <p>{{ $t('billReport.text.mapLabel') }}: {{ currentMapLabel }}</p>
            <p>{{ selectedRangeText }}</p>
          </div>
        </div>

        <div class="pdf-summary-grid">
          <div v-for="card in summaryCards" :key="`pdf-${card.key}`" class="pdf-summary-card">
            <p class="pdf-summary-label">{{ card.label }}</p>
            <p class="pdf-summary-value">{{ card.value }}</p>
            <p class="pdf-summary-desc">{{ card.desc }}</p>
          </div>
        </div>

        <table class="pdf-table">
          <thead>
            <tr>
              <th>{{ $t('billReport.table.area') }}</th>
              <th>{{ $t('billReport.table.type') }}</th>
              <th>{{ $t('billReport.table.peopleDensity') }}</th>
              <th>{{ $t('billReport.table.materialDensity') }}</th>
              <th>{{ $t('billReport.table.alarm') }}</th>
              <th>{{ $t('billReport.table.stayHold') }}</th>
              <th>{{ $t('billReport.table.route') }}</th>
              <th>{{ $t('billReport.table.score') }}</th>
              <th>{{ $t('billReport.table.level') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in report.areas" :key="`pdf-row-${item.areaId}`">
              <td>{{ item.objectName }}</td>
              <td>{{ areaTypeLabel(item.areaType) }}</td>
              <td>{{ formatNumber(item.peopleDensity, 2) }}</td>
              <td>{{ formatNumber(item.materialDensity, 2) }}</td>
              <td>{{ item.alarmCount }}</td>
              <td>{{ `${item.stayMinutes}/${item.holdMinutes}` }}</td>
              <td>{{ item.routeCount }}</td>
              <td>{{ item.hotspotScore }}</td>
              <td>{{ $t(`billReport.level.${item.levelKey}`) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, SankeyChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

echarts.use([
  BarChart,
  LineChart,
  SankeyChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
]);

export default {
  name: 'BillReportDashboard',
  data() {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

    return {
      loading: false,
      initialized: false,
      activeMetric: 'hotspotScore',
      filters: {
        mapId: null,
        dateRange: [start, end]
      },
      report: {
        generatedAt: 0,
        areas: [],
        routes: [],
        trends: []
      },
      chartIds: {
        trend: 'bill-report-trend-chart',
        density: 'bill-report-density-chart',
        route: 'bill-report-route-chart-v2'
      },
      charts: {
        trend: null,
        density: null,
        route: null
      },
      handleWindowResize: null
    };
  },
  computed: {
    ...mapState({
      collapsed: (state) => state.app.collapsed
    }),
    metricTabs() {
      return [
        { value: 'hotspotScore', label: this.$t('billReport.analysis.composite') },
        { value: 'peopleDensity', label: this.$t('billReport.analysis.people') },
        { value: 'materialDensity', label: this.$t('billReport.analysis.material') },
        { value: 'alarmCount', label: this.$t('billReport.analysis.alarm') },
        { value: 'stayMinutes', label: this.$t('billReport.analysis.stay') },
        { value: 'routeCount', label: this.$t('billReport.analysis.route') }
      ];
    },
    activeMetricLabel() {
      const target = this.metricTabs.find((item) => item.value === this.activeMetric);
      return target ? target.label : this.metricTabs[0].label;
    },
    selectedRangeText() {
      const [start, end] = this.filters.dateRange || [];
      if (!start || !end) return '--';
      return `${this.$pub.slTimeFormat(start, { format: 'MM-DD HH:mm' })} - ${this.$pub.slTimeFormat(end, {
        format: 'MM-DD HH:mm'
      })}`;
    },
    generatedLabel() {
      if (!this.report.generatedAt) return '--';
      return this.$pub.slTimeFormat(this.report.generatedAt, { format: 'YYYY-MM-DD HH:mm:ss' });
    },
    currentMapLabel() {
      if (this.report.areas.length && this.report.areas[0].mapNames) {
        return this.report.areas[0].mapNames;
      }
      return this.filters.mapId || '--';
    },
    summaryCards() {
      const areas = this.report.areas || [];
      const topArea = areas[0];
      const peoplePeak = this.topAreaBy('peopleDensity');
      const materialPeak = this.topAreaBy('materialDensity');
      const totalAlarm = areas.reduce((sum, item) => sum + Number(item.alarmCount || 0), 0);
      const unresolvedAlarm = areas.reduce((sum, item) => sum + Number(item.unresolvedAlarmCount || 0), 0);
      const stayPeak = this.topAreaBy('stayMinutes');
      const routePeak = this.report.routes.length ? this.report.routes[0] : null;

      return [
        {
          key: 'hotspot',
          icon: 'ios-flame-outline',
          label: this.$t('billReport.summary.hotspot'),
          value: topArea ? topArea.hotspotScore : '--',
          desc: topArea ? `${topArea.objectName} / ${this.$t(`billReport.level.${topArea.levelKey}`)}` : this.$t('billReport.text.none')
        },
        {
          key: 'density',
          icon: 'ios-people-outline',
          label: this.$t('billReport.summary.density'),
          value: `${this.formatNumber(peoplePeak ? peoplePeak.peopleDensity : 0, 2)} / ${this.formatNumber(
            materialPeak ? materialPeak.materialDensity : 0,
            2
          )}`,
          desc: `${peoplePeak ? peoplePeak.objectName : this.$t('billReport.text.none')} / ${
            materialPeak ? materialPeak.objectName : this.$t('billReport.text.none')
          }`
        },
        {
          key: 'alarm',
          icon: 'ios-notifications-outline',
          label: this.$t('billReport.summary.alarm'),
          value: totalAlarm,
          desc: `${this.$t('billReport.text.unresolved')}: ${unresolvedAlarm}`
        },
        {
          key: 'route',
          icon: 'ios-git-network',
          label: this.$t('billReport.summary.stayRoute'),
          value: stayPeak ? `${stayPeak.stayMinutes}/${stayPeak.holdMinutes}` : '--',
          desc: routePeak
            ? `${routePeak.startName} -> ${routePeak.endName} (${routePeak.count})`
            : this.$t('billReport.text.none')
        }
      ];
    },
    rankingItems() {
      return [...this.report.areas].sort((a, b) => this.metricValue(b) - this.metricValue(a)).slice(0, 6);
    },
    topFocusAreas() {
      return [...this.report.areas].sort((a, b) => this.metricValue(b) - this.metricValue(a)).slice(0, 6);
    },
    heatNodes() {
      const areas = [...this.report.areas];
      if (!areas.length) return [];

      const sorted = [...areas].sort((a, b) => this.metricValue(a) - this.metricValue(b));
      const topIds = new Set(
        [...areas]
          .sort((a, b) => this.metricValue(b) - this.metricValue(a))
          .slice(0, 6)
          .map((item) => item.areaId)
      );
      const positioned = this.normalizeNodePositions(sorted);
      const maxValue = Math.max(...areas.map((item) => this.metricValue(item)), 1);

      return positioned.map((item) => ({
        ...item,
        showLabel: topIds.has(item.areaId),
        size: Math.round(28 + (this.metricValue(item) / maxValue) * 24)
      }));
    },
    heatRoutes() {
      const nodeMap = this.heatNodes.reduce((map, item) => {
        map[item.areaId] = item;
        return map;
      }, {});
      const maxCount = Math.max(...this.report.routes.map((item) => item.count), 1);

      return this.report.routes
        .slice(0, 10)
        .map((item) => ({
          key: `${item.startAreaId}_${item.endAreaId}`,
          start: nodeMap[item.startAreaId],
          end: nodeMap[item.endAreaId],
          strokeWidth: 1 + (item.count / maxCount) * 3.2
        }))
        .filter((item) => item.start && item.end);
    },
    tableColumns() {
      return [
        {
          title: this.$t('billReport.table.area'),
          minWidth: 160,
          key: 'objectName'
        },
        {
          title: this.$t('billReport.table.type'),
          minWidth: 120,
          align: 'center',
          render: (h, params) => {
            return h(
              'Tag',
              { props: { color: this.areaTypeColor(params.row.areaType) } },
              this.areaTypeLabel(params.row.areaType)
            );
          }
        },
        {
          title: this.$t('billReport.table.peopleDensity'),
          minWidth: 120,
          align: 'center',
          render: (h, params) => h('span', this.formatNumber(params.row.peopleDensity, 2))
        },
        {
          title: this.$t('billReport.table.materialDensity'),
          minWidth: 120,
          align: 'center',
          render: (h, params) => h('span', this.formatNumber(params.row.materialDensity, 2))
        },
        {
          title: this.$t('billReport.table.alarm'),
          minWidth: 110,
          align: 'center',
          render: (h, params) => {
            const row = params.row;
            const value = row.unresolvedAlarmCount
              ? `${row.alarmCount} (${row.unresolvedAlarmCount})`
              : `${row.alarmCount}`;
            return h('span', value);
          }
        },
        {
          title: this.$t('billReport.table.stayHold'),
          minWidth: 130,
          align: 'center',
          render: (h, params) => h('span', `${params.row.stayMinutes}/${params.row.holdMinutes}`)
        },
        {
          title: this.$t('billReport.table.route'),
          minWidth: 100,
          align: 'center',
          key: 'routeCount'
        },
        {
          title: this.$t('billReport.table.score'),
          minWidth: 100,
          align: 'center',
          key: 'hotspotScore'
        },
        {
          title: this.$t('billReport.table.level'),
          minWidth: 110,
          align: 'center',
          render: (h, params) => {
            return h(
              'Tag',
              { props: { color: this.levelColor(params.row.levelKey) } },
              this.$t(`billReport.level.${params.row.levelKey}`)
            );
          }
        }
      ];
    }
  },
  watch: {
    collapsed() {
      setTimeout(() => {
        this.resizeCharts();
      }, 260);
    },
    '$i18n.locale'() {
      this.$nextTick(() => {
        this.renderCharts();
      });
    }
  },
  mounted() {
    this.handleWindowResize = this.$pub.slDebounce(() => {
      this.resizeCharts();
    }, 100);

    window.addEventListener('resize', this.handleWindowResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleWindowResize);
    this.disposeCharts();
  },
  methods: {
    handleMapReady() {
      if (this.initialized) return;

      const first = this.$refs.mapCascader && this.$refs.mapCascader.getFirstUseMap
        ? this.$refs.mapCascader.getFirstUseMap()
        : [];
      const defaultMapId = Array.isArray(first) ? first[2] : null;

      if (defaultMapId) {
        this.filters.mapId = defaultMapId;
        this.$refs.mapCascader.setValue(defaultMapId);
      }

      this.initialized = true;
      this.loadReport();
    },
    handleMapChange(mapId) {
      this.filters.mapId = mapId;
    },
    async loadReport() {
      if (!this.filters.mapId) {
        this.$Message.warning(this.$t('trackingManage.warning.a'));
        return;
      }

      const [start, end] = this.filters.dateRange || [];
      if (!start || !end) {
        this.$Message.warning(this.$t('trackingManage.warning.c'));
        return;
      }

      this.loading = true;
      try {
        const res = await this.$api.billReportGet({
          mapId: this.filters.mapId,
          start: this.$pub.slConvertTimestamp(start),
          end: this.$pub.slConvertTimestamp(end)
        });

        this.report = {
          generatedAt: res.generatedAt || Date.now(),
          areas: Array.isArray(res.areas) ? res.areas : [],
          routes: Array.isArray(res.routes) ? res.routes : [],
          trends: Array.isArray(res.trends) ? res.trends : []
        };

        this.$nextTick(() => {
          this.renderCharts();
        });
      } catch (error) {
        this.$Message.error(error && error.msg ? error.msg : this.$t('base.optionFail'));
      } finally {
        this.loading = false;
      }
    },
    metricValue(item) {
      const value = item && item[this.activeMetric];
      return Number(value) || 0;
    },
    metricValueText(item) {
      if (this.activeMetric === 'peopleDensity' || this.activeMetric === 'materialDensity') {
        return this.formatNumber(this.metricValue(item), 2);
      }
      return `${Math.round(this.metricValue(item))}`;
    },
    focusReasonText(item) {
      return [
        `${this.$t('billReport.analysis.people')}: ${this.formatNumber(item.peopleDensity, 2)}`,
        `${this.$t('billReport.analysis.alarm')}: ${item.alarmCount}`,
        `${this.$t('billReport.analysis.route')}: ${item.routeCount}`
      ].join('  |  ');
    },
    rankingWidth(item) {
      const max = Math.max(...this.report.areas.map((area) => this.metricValue(area)), 1);
      return Math.max((this.metricValue(item) / max) * 100, 8);
    },
    topAreaBy(key) {
      return [...this.report.areas].sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))[0] || null;
    },
    normalizeNodePositions(list) {
      const withGeometry = list.filter(
        (item) => item.hasGeometry && Number.isFinite(item.centerX) && Number.isFinite(item.centerY)
      );

      if (withGeometry.length >= 2) {
        const minX = Math.min(...withGeometry.map((item) => item.centerX));
        const maxX = Math.max(...withGeometry.map((item) => item.centerX));
        const minY = Math.min(...withGeometry.map((item) => item.centerY));
        const maxY = Math.max(...withGeometry.map((item) => item.centerY));
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;

        return list.map((item, index) => {
          if (item.hasGeometry && Number.isFinite(item.centerX) && Number.isFinite(item.centerY)) {
            return {
              ...item,
              left: this.roundNumber(10 + ((item.centerX - minX) / rangeX) * 80, 1),
              top: this.roundNumber(14 + (1 - (item.centerY - minY) / rangeY) * 68, 1)
            };
          }

          return {
            ...item,
            ...this.fallbackNodePosition(index, list.length)
          };
        });
      }

      return list.map((item, index) => ({
        ...item,
        ...this.fallbackNodePosition(index, list.length)
      }));
    },
    fallbackNodePosition(index, total) {
      const safeTotal = Math.max(total, 1);
      const columns = safeTotal <= 4 ? 2 : safeTotal <= 9 ? 3 : 4;
      const row = Math.floor(index / columns);
      const col = index % columns;
      const rows = Math.ceil(safeTotal / columns);

      return {
        left: this.roundNumber(18 + (col * 62) / Math.max(columns - 1, 1), 1),
        top: this.roundNumber(22 + (row * 50) / Math.max(rows - 1, 1), 1)
      };
    },
    renderCharts() {
      this.renderTrendChart();
      this.renderDensityChart();
      this.renderRouteChart();
    },
    renderTrendChart() {
      const dom = document.getElementById(this.chartIds.trend);
      if (!dom || !this.report.trends.length) {
        this.disposeChart('trend');
        return;
      }

      const chart = this.getChart('trend', dom);
      chart.setOption({
        color: ['#ff6b6b'],
        grid: { top: 26, left: 36, right: 16, bottom: 24, containLabel: true },
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: this.report.trends.map((item) => item.label),
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#ccd7e7' } },
          axisLabel: { color: '#688098' }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { type: 'dashed', color: '#d9e1ee' } },
          axisLabel: { color: '#688098' }
        },
        series: [
          {
            type: 'line',
            smooth: true,
            symbolSize: 6,
            lineStyle: { width: 3 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255,107,107,0.35)' },
                { offset: 1, color: 'rgba(255,107,107,0.02)' }
              ])
            },
            data: this.report.trends.map((item) => item.count)
          }
        ]
      });
    },
    renderDensityChart() {
      const dom = document.getElementById(this.chartIds.density);
      if (!dom || !this.report.areas.length) {
        this.disposeChart('density');
        return;
      }

      const areas = [...this.report.areas].sort((a, b) => b.hotspotScore - a.hotspotScore).slice(0, 6);
      const chart = this.getChart('density', dom);
      chart.setOption({
        color: ['#14c3a2', '#ff9f43'],
        legend: { top: 0, textStyle: { color: '#5f738d' } },
        grid: { top: 36, left: 40, right: 18, bottom: 22, containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: {
          type: 'category',
          data: areas.map((item) => this.truncate(item.objectName, 8)),
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#ccd7e7' } },
          axisLabel: { color: '#688098' }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { type: 'dashed', color: '#d9e1ee' } },
          axisLabel: { color: '#688098' }
        },
        series: [
          {
            name: this.$t('billReport.analysis.people'),
            type: 'bar',
            barMaxWidth: 18,
            data: areas.map((item) => item.peopleDensity),
            itemStyle: { borderRadius: [8, 8, 0, 0] }
          },
          {
            name: this.$t('billReport.analysis.material'),
            type: 'bar',
            barMaxWidth: 18,
            data: areas.map((item) => item.materialDensity),
            itemStyle: { borderRadius: [8, 8, 0, 0] }
          }
        ]
      });
    },
    renderRouteChart() {
      const dom = document.getElementById(this.chartIds.route);
      if (!dom || !this.report.routes.length) {
        this.disposeChart('route');
        return;
      }

      const routes = this.report.routes.slice(0, 10);
      const nodeMap = {};
      routes.forEach((item) => {
        nodeMap[item.startName] = { name: item.startName };
        nodeMap[item.endName] = { name: item.endName };
      });

      const chart = this.getChart('route', dom);
      chart.setOption({
        tooltip: {
          trigger: 'item'
        },
        series: [
          {
            type: 'sankey',
            left: 10,
            right: 20,
            top: 12,
            bottom: 12,
            emphasis: { focus: 'adjacency' },
            lineStyle: {
              color: 'gradient',
              curveness: 0.48,
              opacity: 0.28
            },
            label: {
              color: '#24364c',
              fontSize: 12
            },
            itemStyle: {
              borderWidth: 0,
              color: '#4d8dff'
            },
            data: Object.values(nodeMap),
            links: routes.map((item) => ({
              source: item.startName,
              target: item.endName,
              value: item.count
            }))
          }
        ]
      });
    },
    getChart(name, dom) {
      if (!this.charts[name]) {
        this.charts[name] = echarts.init(dom);
      }
      return this.charts[name];
    },
    resizeCharts() {
      Object.keys(this.charts).forEach((key) => {
        if (this.charts[key]) {
          this.charts[key].resize();
        }
      });
    },
    disposeChart(name) {
      if (this.charts[name]) {
        this.charts[name].dispose();
        this.charts[name] = null;
      }
    },
    disposeCharts() {
      this.disposeChart('trend');
      this.disposeChart('density');
      this.disposeChart('route');
    },
    async handleExportPdf() {
      if (!this.report.areas.length) {
        this.$Message.warning(this.$t('base.noDataText'));
        return;
      }

      const element = this.$refs.pdfSheet;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${this.exportBaseName()}.pdf`);
      this.$Message.success(this.$t('base.optionSuccess'));
    },
    handleExportExcel() {
      if (!this.report.areas.length) {
        this.$Message.warning(this.$t('base.noDataText'));
        return;
      }

      const rows = this.report.areas.map((item) => ({
        [this.$t('billReport.table.area')]: item.objectName,
        [this.$t('billReport.table.type')]: this.areaTypeLabel(item.areaType),
        [this.$t('billReport.table.peopleDensity')]: this.formatNumber(item.peopleDensity, 2),
        [this.$t('billReport.table.materialDensity')]: this.formatNumber(item.materialDensity, 2),
        [this.$t('billReport.table.alarm')]: item.alarmCount,
        [this.$t('billReport.table.stayHold')]: `${item.stayMinutes}/${item.holdMinutes}`,
        [this.$t('billReport.table.route')]: item.routeCount,
        [this.$t('billReport.table.score')]: item.hotspotScore,
        [this.$t('billReport.table.level')]: this.$t(`billReport.level.${item.levelKey}`)
      }));
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, this.$t('sideBarMenu.billReport'));
      XLSX.writeFile(workbook, `${this.exportBaseName()}.xlsx`);
      this.$Message.success(this.$t('base.optionSuccess'));
    },
    exportBaseName() {
      const stamp = this.$pub.slTimeFormat(Date.now(), { format: 'YYYYMMDD_HHmmss' });
      return `${this.$t('billReport.export.fileName')}_${stamp}`;
    },
    levelColor(level) {
      if (level === 'high') return 'red';
      if (level === 'medium') return 'orange';
      return 'green';
    },
    areaTypeLabel(type) {
      return this.$t(`billReport.type.${type || 'general'}`);
    },
    areaTypeColor(type) {
      if (type === 'goods') return 'blue';
      if (type === 'passage') return 'cyan';
      return 'default';
    },
    truncate(value, length) {
      const text = String(value || '');
      return text.length > length ? `${text.slice(0, length)}...` : text;
    },
    formatNumber(value, digits) {
      return Number(value || 0).toFixed(digits);
    },
    roundNumber(value, digits) {
      const factor = Math.pow(10, digits);
      return Math.round((Number(value) || 0) * factor) / factor;
    },
    formatRank(index) {
      return index < 10 ? `0${index}` : `${index}`;
    }
  }
};
</script>

<style scoped lang="less">
.bill-report-page {
  position: relative;
}

.report-hero,
.surface-card {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(22, 43, 77, 0.08);
}

.report-hero {
  margin-bottom: 14px;
  background:
    radial-gradient(circle at top left, rgba(77, 141, 255, 0.24), transparent 34%),
    radial-gradient(circle at right bottom, rgba(19, 195, 162, 0.18), transparent 30%),
    linear-gradient(135deg, #f8fbff 0%, #eef5ff 45%, #f7fbff 100%);
}

.hero-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.95fr);
  gap: 18px;
  align-items: stretch;
}

.hero-copy {
  padding: 8px 4px 4px;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(38, 92, 224, 0.12);
  color: #2a5de0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.hero-title {
  margin-top: 16px;
  font-size: 30px;
  line-height: 1.1;
  color: #17304f;
}

.hero-subtitle {
  max-width: 680px;
  margin-top: 14px;
  color: #5f748e;
  line-height: 1.8;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.hero-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #48607c;
  font-size: 12px;
}

.hero-panel {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item.wide {
  grid-column: span 2;
}

.filter-item label {
  font-size: 12px;
  font-weight: 600;
  color: #5a7190;
}

.filter-range {
  width: 100%;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.metric-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.metric-pill {
  padding: 10px 16px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  color: #50677f;
  box-shadow: 0 8px 20px rgba(22, 43, 77, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
}

.metric-pill.active {
  background: linear-gradient(135deg, #2f65e9 0%, #14c3a2 100%);
  color: #fff;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.summary-card {
  position: relative;
  min-height: 150px;
  padding: 20px 20px 18px;
  overflow: hidden;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 16px 34px rgba(20, 44, 79, 0.07);
}

.summary-card::before {
  position: absolute;
  top: -36px;
  right: -26px;
  width: 110px;
  height: 110px;
  content: '';
  border-radius: 50%;
  opacity: 0.16;
}

.summary-card.hotspot::before {
  background: linear-gradient(135deg, #ff9068 0%, #ff5c60 100%);
}

.summary-card.density::before {
  background: linear-gradient(135deg, #4fa9ff 0%, #2f65e9 100%);
}

.summary-card.alarm::before {
  background: linear-gradient(135deg, #ff8a7a 0%, #f95d6a 100%);
}

.summary-card.route::before {
  background: linear-gradient(135deg, #39d1c0 0%, #1b9c90 100%);
}

.summary-icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(40, 87, 214, 0.08);
  color: #2f65e9;
  font-size: 22px;
}

.summary-label {
  margin-top: 16px;
  color: #6b8098;
  font-size: 13px;
}

.summary-value {
  margin-top: 12px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
  color: #18304e;
}

.summary-desc {
  margin-top: 12px;
  color: #5c718a;
  line-height: 1.6;
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.85fr);
  gap: 14px;
  margin-bottom: 14px;
}

.aside-stack {
  display: grid;
  gap: 14px;
}

.surface-card ::v-deep .ivu-card-body {
  padding: 18px;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #20344f;
}

.panel-tip {
  margin-top: 4px;
  color: #6c819b;
  font-size: 12px;
}

.heat-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.8fr);
  gap: 16px;
}

.heat-stage {
  position: relative;
  min-height: 430px;
  overflow: hidden;
  border-radius: 24px;
  background: linear-gradient(150deg, #071426 0%, #0c2b4d 55%, #12506d 100%);
}

.heat-stage::before,
.heat-stage::after {
  position: absolute;
  border-radius: 50%;
  content: '';
}

.heat-stage::before {
  top: -70px;
  left: -40px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(73, 171, 255, 0.28) 0%, rgba(73, 171, 255, 0) 72%);
}

.heat-stage::after {
  right: -90px;
  bottom: -90px;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(22, 195, 162, 0.22) 0%, rgba(22, 195, 162, 0) 70%);
}

.heat-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  background-size: 54px 54px;
  opacity: 0.55;
}

.heat-route-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.heat-route {
  stroke: rgba(157, 226, 255, 0.44);
  fill: none;
  stroke-linecap: round;
}

.heat-node-wrap {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  text-align: center;
}

.heat-node {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 16px 28px rgba(3, 10, 20, 0.38);
}

.heat-node::after {
  position: absolute;
  inset: -8px;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.18);
  content: '';
  animation: pulse-ring 3s ease-out infinite;
}

.heat-node.high {
  background: linear-gradient(135deg, #ff9362 0%, #ff5d5d 100%);
}

.heat-node.medium {
  background: linear-gradient(135deg, #ffc95c 0%, #ff9f43 100%);
}

.heat-node.stable {
  background: linear-gradient(135deg, #37d0c0 0%, #3478ff 100%);
}

.heat-node-label {
  max-width: 140px;
  margin-top: 10px;
  padding: 4px 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(6, 18, 33, 0.56);
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.heat-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border-radius: 20px;
  background: linear-gradient(180deg, #f4f8ff 0%, #eef5ff 100%);
}

.legend-box {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #566d86;
  font-size: 12px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.high {
  background: #ff5d5d;
}

.legend-dot.medium {
  background: #ffad48;
}

.legend-dot.stable {
  background: #37d0c0;
}

.focus-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.focus-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
}

.focus-rank {
  min-width: 34px;
  font-size: 18px;
  font-weight: 700;
  color: #2f65e9;
}

.focus-copy {
  flex: 1;
  min-width: 0;
}

.focus-name {
  overflow: hidden;
  color: #20344f;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.focus-text {
  margin-top: 4px;
  color: #6c819b;
  font-size: 12px;
  line-height: 1.6;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ranking-item {
  padding: 14px 14px 12px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f9fbff 0%, #f4f8ff 100%);
}

.ranking-head,
.ranking-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ranking-name-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ranking-index {
  color: #2f65e9;
  font-weight: 700;
}

.ranking-name {
  overflow: hidden;
  color: #20344f;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ranking-value {
  color: #17304f;
  font-weight: 700;
}

.ranking-bar-track {
  height: 8px;
  margin-top: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #dfe8f5;
}

.ranking-bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2f65e9 0%, #16c3a2 100%);
}

.ranking-meta {
  margin-top: 10px;
  color: #6c819b;
  font-size: 12px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.chart-box {
  height: 330px;
}

.chart-box.small {
  height: 280px;
}

.pdf-sheet {
  position: fixed;
  top: 0;
  left: -10000px;
  width: 1120px;
  padding: 24px;
  background: #fff;
}

.pdf-inner {
  color: #20344f;
}

.pdf-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid #dce5f1;
}

.pdf-title {
  font-size: 28px;
  font-weight: 700;
}

.pdf-subtitle {
  margin-top: 10px;
  color: #5c718a;
  line-height: 1.7;
}

.pdf-meta {
  font-size: 13px;
  color: #5c718a;
  line-height: 1.8;
}

.pdf-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
  margin-bottom: 20px;
}

.pdf-summary-card {
  padding: 16px;
  border-radius: 18px;
  background: #f5f8fd;
}

.pdf-summary-label {
  font-size: 12px;
  color: #6c819b;
}

.pdf-summary-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
}

.pdf-summary-desc {
  margin-top: 8px;
  color: #5c718a;
  line-height: 1.6;
}

.pdf-table {
  width: 100%;
  border-collapse: collapse;
}

.pdf-table th,
.pdf-table td {
  padding: 10px 12px;
  border: 1px solid #dce5f1;
  font-size: 12px;
}

.pdf-table th {
  background: #eff4fb;
}

.table-panel {
  margin-bottom: 12px;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.86);
    opacity: 0.55;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

@media (max-width: 1360px) {
  .hero-wrap,
  .main-grid,
  .chart-grid,
  .heat-layout,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 24px;
  }

  .summary-value {
    font-size: 24px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-item.wide {
    grid-column: span 1;
  }

  .heat-stage {
    min-height: 340px;
  }
}
</style>
