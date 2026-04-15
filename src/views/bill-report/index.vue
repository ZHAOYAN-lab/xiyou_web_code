<template>
  <div class="bill-report">
    <Card class="card-search report-filter-card" :bordered="false" dis-hover>
      <div slot="title" class="report-header">
        <div>
          <p class="report-title">{{ $t('billReport.title') }}</p>
          <p class="report-subtitle">{{ $t('billReport.subtitle') }}</p>
        </div>
      </div>

      <div class="sl-main-search-header">
        <div class="sl-margin-right-10">
          <div class="sl-width-180">
            <sl-map-cascader
              ref="mapCascader"
              @onChange="handleMapChange"
              @onSetMapData="handleMapReady"
            />
          </div>
        </div>

        <div class="sl-margin-right-15">
          <DatePicker
            v-model="filters.dateRange"
            transfer
            :editable="false"
            type="datetimerange"
            format="yyyy-MM-dd HH:mm:ss"
            class="sl-width-360"
            :placeholder="$t('billReport.filter.range')"
          ></DatePicker>
        </div>

        <div class="sl-margin-right-10">
          <Select v-model="filters.analysisType" class="sl-width-180">
            <Option v-for="item in analysisOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </Option>
          </Select>
        </div>

        <div class="sl-margin-right-10">
          <Button type="primary" @click="handleSearch">
            {{ $t('billReport.action.refresh') }}
          </Button>
        </div>

        <div>
          <Button @click="handleExport">{{ $t('billReport.action.export') }}</Button>
        </div>
      </div>
    </Card>

    <div class="summary-grid">
      <div
        v-for="card in summaryCards"
        :key="card.key"
        class="summary-card"
        :class="`accent-${card.key}`"
      >
        <p class="summary-label">{{ card.label }}</p>
        <p class="summary-value">{{ card.value }}</p>
        <p class="summary-desc">{{ card.desc }}</p>
      </div>
    </div>

    <div class="report-grid report-grid-top">
      <Card class="report-panel" :bordered="false" dis-hover>
        <div slot="title" class="panel-title">
          <span>{{ $t('billReport.panel.distribution') }}</span>
        </div>
        <div slot="extra" class="panel-extra">
          <Tag color="blue">{{ focusMetricLabel }}</Tag>
        </div>

        <div v-if="visualAreas.length" class="hotspot-layout">
          <div class="hotspot-stage">
            <div class="stage-grid"></div>

            <svg class="route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line
                v-for="route in visualRoutes"
                :key="route.key"
                class="route-line"
                :x1="route.start.plotX"
                :y1="route.start.plotY"
                :x2="route.end.plotX"
                :y2="route.end.plotY"
                :style="{ strokeWidth: `${route.strokeWidth}px` }"
              />
            </svg>

            <div
              v-for="area in visualAreas"
              :key="area.areaId"
              class="hotspot-node-wrap"
              :style="getNodeWrapStyle(area)"
            >
              <div
                class="hotspot-node"
                :class="area.levelKey"
                :style="getNodeStyle(area)"
                :title="getAreaTooltip(area)"
              >
                <span class="hotspot-score">{{ getFocusMetricDisplay(area) }}</span>
              </div>
              <p v-if="area.showLabel" class="hotspot-label">{{ area.objectName }}</p>
            </div>
          </div>

          <div class="hotspot-side">
            <div class="legend-list">
              <div v-for="item in legendList" :key="item.key" class="legend-item">
                <span class="legend-dot" :class="item.key"></span>
                <span>{{ item.label }}</span>
              </div>
            </div>

            <div class="insight-list">
              <div v-for="(area, index) in topHotAreas" :key="area.areaId" class="insight-item">
                <span class="insight-rank">{{ formatRank(index + 1) }}</span>
                <div class="insight-text">
                  <p class="insight-name">{{ area.objectName }}</p>
                  <p class="insight-desc">{{ getAreaReason(area) }}</p>
                </div>
                <Tag :color="getLevelColor(area.levelKey)">{{ getLevelLabel(area.levelKey) }}</Tag>
              </div>
            </div>
          </div>
        </div>

        <sl-empty v-else />
      </Card>

      <Card class="report-panel" :bordered="false" dis-hover>
        <div slot="title" class="panel-title">
          <span>{{ $t('billReport.panel.ranking') }}</span>
        </div>
        <div slot="extra" class="panel-extra range-text">{{ selectedRangeText }}</div>

        <div v-if="reportData.areas.length" :id="chartIds.ranking" class="chart-box"></div>
        <sl-empty v-else />
      </Card>
    </div>

    <div class="report-grid report-grid-bottom">
      <Card class="report-panel" :bordered="false" dis-hover>
        <div slot="title" class="panel-title">
          <span>{{ $t('billReport.panel.alarmTrend') }}</span>
        </div>

        <div v-if="reportData.trend.length" :id="chartIds.alarm" class="chart-box"></div>
        <sl-empty v-else />
      </Card>

      <Card class="report-panel" :bordered="false" dis-hover>
        <div slot="title" class="panel-title">
          <span>{{ $t('billReport.panel.routeFlow') }}</span>
        </div>

        <div v-if="reportData.routes.length" :id="chartIds.route" class="chart-box"></div>
        <sl-empty v-else />
      </Card>
    </div>

    <Card class="report-panel detail-panel" :bordered="false" dis-hover>
      <div slot="title" class="panel-title">
        <span>{{ $t('billReport.panel.detail') }}</span>
      </div>

      <Table border :columns="detailColumns" :data="reportData.areas" :loading="loading"></Table>
    </Card>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import productAreaApi from '@/api/path/product-area';
import taskApi from '@/api/path/task';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  CanvasRenderer
]);

const TASK_PAGE_SIZE = 200;
const WARNING_PAGE_SIZE = 200;
const MAX_FETCH_PAGES = 10;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default {
  name: 'BillReport',
  data() {
    const end = new Date();
    const start = new Date();

    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    return {
      loading: false,
      initialized: false,
      filters: {
        mapId: null,
        dateRange: [start, end],
        analysisType: 'composite'
      },
      rawData: {
        areas: [],
        tasks: [],
        warnings: [],
        overview: null,
        alarmOverview: null
      },
      reportData: {
        areas: [],
        routes: [],
        trend: []
      },
      chartIds: {
        ranking: 'bill-report-ranking-chart',
        alarm: 'bill-report-alarm-chart',
        route: 'bill-report-route-chart'
      },
      charts: {
        ranking: null,
        alarm: null,
        route: null
      },
      handleWindowResize: null
    };
  },
  computed: {
    ...mapState({
      collapsed: (state) => state.app.collapsed
    }),
    analysisOptions() {
      return [
        { value: 'composite', label: this.$t('billReport.analysis.composite') },
        { value: 'people', label: this.$t('billReport.analysis.people') },
        { value: 'material', label: this.$t('billReport.analysis.material') },
        { value: 'alarm', label: this.$t('billReport.analysis.alarm') },
        { value: 'stay', label: this.$t('billReport.analysis.stay') },
        { value: 'route', label: this.$t('billReport.analysis.route') }
      ];
    },
    focusMetricLabel() {
      const hit = this.analysisOptions.find((item) => item.value === this.filters.analysisType);
      return hit ? hit.label : this.$t('billReport.analysis.composite');
    },
    legendList() {
      return [
        { key: 'high', label: this.getLevelLabel('high') },
        { key: 'medium', label: this.getLevelLabel('medium') },
        { key: 'stable', label: this.getLevelLabel('stable') }
      ];
    },
    selectedRangeText() {
      const { start, end } = this.getRangeBounds();

      return `${this.$pub.slTimeFormat(start, { format: 'MM-DD HH:mm' })} - ${this.$pub.slTimeFormat(
        end,
        { format: 'MM-DD HH:mm' }
      )}`;
    },
    summaryCards() {
      const areas = this.reportData.areas || [];
      const topHot = areas[0];
      const peoplePeakArea = this.getTopAreaBy('peopleDensity');
      const materialPeakArea = this.getTopAreaBy('materialDensity');
      const topAlarmArea = this.getTopAreaBy('alarmCount');
      const highCount = areas.filter((item) => item.levelKey === 'high').length;
      const totalAlarm = areas.reduce((sum, item) => sum + item.alarmCount, 0);
      const unresolvedAlarm = areas.reduce((sum, item) => sum + item.unresolvedAlarmCount, 0);
      const avgStay = this.averageAreaMetric('stayMinutes');
      const avgHold = this.averageAreaMetric('holdMinutes');
      const topRoute = this.reportData.routes && this.reportData.routes.length ? this.reportData.routes[0] : null;

      return [
        {
          key: 'hotspot',
          label: this.$t('billReport.summary.hotspot'),
          value: String(highCount),
          desc: topHot ? `${topHot.objectName} ${topHot.hotspotScore}` : this.$t('billReport.text.none')
        },
        {
          key: 'density',
          label: this.$t('billReport.summary.density'),
          value: `${this.formatValue(peoplePeakArea ? peoplePeakArea.peopleDensity : 0, 'density')} / ${this.formatValue(
            materialPeakArea ? materialPeakArea.materialDensity : 0,
            'density'
          )}`,
          desc: `${peoplePeakArea ? peoplePeakArea.objectName : this.$t('billReport.text.none')} / ${
            materialPeakArea ? materialPeakArea.objectName : this.$t('billReport.text.none')
          }`
        },
        {
          key: 'alarm',
          label: this.$t('billReport.summary.alarm'),
          value: String(totalAlarm),
          desc: `${unresolvedAlarm} ${this.$t('home.card5.c')} / ${
            topAlarmArea ? topAlarmArea.objectName : this.$t('billReport.text.none')
          }`
        },
        {
          key: 'stayRoute',
          label: this.$t('billReport.summary.stayRoute'),
          value: `${this.formatValue(avgStay, 'count')} / ${this.formatValue(avgHold, 'count')} min`,
          desc: `${this.reportData.routes.length} ${this.$t('billReport.unit.routes')} / ${
            topRoute ? topRoute.label : this.$t('billReport.text.none')
          }`
        }
      ];
    },
    topHotAreas() {
      return [...this.reportData.areas]
        .sort((a, b) => this.getFocusMetricValue(b) - this.getFocusMetricValue(a))
        .slice(0, 6);
    },
    visualAreas() {
      const areas = [...this.reportData.areas];
      const topIds = new Set(
        [...areas]
          .sort((a, b) => this.getFocusMetricValue(b) - this.getFocusMetricValue(a))
          .slice(0, 6)
          .map((item) => item.areaId)
      );

      return areas
        .sort((a, b) => this.getFocusMetricValue(a) - this.getFocusMetricValue(b))
        .map((item) => ({
          ...item,
          showLabel: topIds.has(item.areaId),
          nodeSize: this.getNodeSize(item)
        }));
    },
    visualRoutes() {
      const areaMap = this.reportData.areas.reduce((map, item) => {
        map[item.areaId] = item;
        return map;
      }, {});

      return (this.reportData.routes || [])
        .map((item) => ({
          ...item,
          start: areaMap[item.startAreaId],
          end: areaMap[item.endAreaId],
          strokeWidth: clamp(0.9 + item.count * 0.25, 1, 4.5)
        }))
        .filter((item) => item.start && item.end)
        .slice(0, 8);
    },
    detailColumns() {
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
            const row = params.row;
            return h(
              'Tag',
              {
                props: {
                  color: this.getAreaTypeColor(row.areaTypeKey)
                }
              },
              this.getAreaTypeLabel(row.areaTypeKey)
            );
          }
        },
        {
          title: this.$t('billReport.table.map'),
          minWidth: 140,
          render: (h, params) => {
            return h('span', params.row.mapNames || this.$t('base.noData'));
          }
        },
        {
          title: this.$t('billReport.table.peopleDensity'),
          minWidth: 120,
          align: 'center',
          render: (h, params) => {
            return h('span', this.formatValue(params.row.peopleDensity, 'density'));
          }
        },
        {
          title: this.$t('billReport.table.materialDensity'),
          minWidth: 120,
          align: 'center',
          render: (h, params) => {
            return h('span', this.formatValue(params.row.materialDensity, 'density'));
          }
        },
        {
          title: this.$t('billReport.table.alarm'),
          minWidth: 110,
          align: 'center',
          render: (h, params) => {
            const row = params.row;
            const text = row.unresolvedAlarmCount
              ? `${row.alarmCount} (${row.unresolvedAlarmCount})`
              : `${row.alarmCount}`;
            return h('span', text);
          }
        },
        {
          title: this.$t('billReport.table.stayHold'),
          minWidth: 140,
          align: 'center',
          render: (h, params) => {
            const row = params.row;
            return h('span', `${row.stayMinutes} / ${row.holdMinutes}`);
          }
        },
        {
          title: this.$t('billReport.table.route'),
          minWidth: 110,
          align: 'center',
          render: (h, params) => {
            return h('span', this.formatValue(params.row.routeCount, 'count'));
          }
        },
        {
          title: this.$t('billReport.table.score'),
          minWidth: 100,
          align: 'center',
          render: (h, params) => {
            return h('strong', params.row.hotspotScore);
          }
        },
        {
          title: this.$t('billReport.table.level'),
          minWidth: 110,
          align: 'center',
          render: (h, params) => {
            return h(
              'Tag',
              {
                props: {
                  color: this.getLevelColor(params.row.levelKey)
                }
              },
              this.getLevelLabel(params.row.levelKey)
            );
          }
        }
      ];
    }
  },
  watch: {
    'filters.analysisType'() {
      this.$nextTick(() => {
        this.renderCharts();
      });
    },
    '$i18n.locale'() {
      this.$nextTick(() => {
        this.renderCharts();
      });
    },
    collapsed() {
      setTimeout(() => {
        this.resizeCharts();
      }, 260);
    }
  },
  mounted() {
    this.handleWindowResize = this.$pub.slDebounce(() => {
      this.resizeCharts();
    }, 120);

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
    async handleSearch() {
      await this.loadReport();
    },
    async loadReport() {
      this.loading = true;

      try {
        const results = await Promise.allSettled([
          productAreaApi.getProductAreaList(),
          this.fetchAllTasks(),
          this.fetchAllWarnings(),
          this.$api.homeGetLocationObjectAndDeviceGroup({ loading: false }),
          this.$api.homeGetAlarmGroup({ loading: false })
        ]);

        this.rawData.areas = this.unwrapArrayResult(results[0]);
        this.rawData.tasks = this.unwrapArrayResult(results[1]);
        this.rawData.warnings = this.unwrapArrayResult(results[2]);
        this.rawData.overview = this.unwrapValueResult(results[3]);
        this.rawData.alarmOverview = this.unwrapValueResult(results[4]);

        this.buildReportData();

        this.$nextTick(() => {
          this.renderCharts();
        });
      } finally {
        this.loading = false;
      }
    },
    unwrapArrayResult(result) {
      if (!result || result.status !== 'fulfilled') return [];

      const value = result.value;

      if (Array.isArray(value)) return value;
      if (value && Array.isArray(value.list)) return value.list;
      if (value && Array.isArray(value.content)) return value.content;

      return [];
    },
    unwrapValueResult(result) {
      if (!result || result.status !== 'fulfilled') return null;
      return result.value || null;
    },
    async fetchAllTasks() {
      let page = 1;
      let total = 0;
      let list = [];

      while (page <= MAX_FETCH_PAGES) {
        const res = await taskApi.taskGetList({
          page,
          size: TASK_PAGE_SIZE
        });
        const current = res && Array.isArray(res.list) ? res.list : [];

        list = list.concat(current);
        total = Number(res && res.total) || list.length;

        if (!current.length || list.length >= total) {
          break;
        }

        page += 1;
      }

      return list;
    },
    async fetchAllWarnings() {
      const { start, end } = this.getRangeBounds();
      let page = 0;
      let total = 0;
      let list = [];

      while (page < MAX_FETCH_PAGES) {
        const res = await this.$api.warningInfoGetTable({
          loading: false,
          data: {
            page,
            size: WARNING_PAGE_SIZE,
            start,
            end
          }
        });
        const current = res && Array.isArray(res.content) ? res.content : [];

        list = list.concat(current);
        total = Number(res && res.totalElements) || list.length;

        if (!current.length || list.length >= total) {
          break;
        }

        page += 1;
      }

      return list;
    },
    buildReportData() {
      const normalizedTasks = (this.rawData.tasks || []).map((item) => this.normalizeTaskRecord(item));
      const normalizedWarnings = (this.rawData.warnings || []).map((item) =>
        this.normalizeWarningRecord(item)
      );
      const areas = this.selectAreasByMap(
        this.normalizeAreas(this.rawData.areas || [], normalizedTasks, normalizedWarnings),
        this.filters.mapId
      );
      const areaStats = areas.map((item, index) => this.createAreaStat(item, index));
      const filteredTasks = normalizedTasks.filter((item) => this.taskInRange(item));
      const routeMap = {};

      filteredTasks.forEach((item) => {
        const startArea = this.findAreaByIdOrName(areaStats, item.startAreaId, item.startAreaName);
        const endArea = this.findAreaByIdOrName(areaStats, item.endAreaId, item.endAreaName);

        this.applyTaskToArea(startArea, 'start', item);

        if (endArea && (!startArea || endArea.areaId !== startArea.areaId)) {
          this.applyTaskToArea(endArea, 'end', item);
        } else if (endArea) {
          this.applyTaskToArea(endArea, 'end', item);
        }

        if (startArea && endArea) {
          const key = `${startArea.areaId}__${endArea.areaId}`;

          if (!routeMap[key]) {
            routeMap[key] = {
              key,
              startAreaId: startArea.areaId,
              endAreaId: endArea.areaId,
              startName: startArea.objectName,
              endName: endArea.objectName,
              count: 0
            };
          }

          routeMap[key].count += 1;
        }
      });

      const unmatchedWarnings = [];

      normalizedWarnings.forEach((item) => {
        const matchedArea = this.findAreaForWarning(areaStats, item);

        if (matchedArea) {
          matchedArea.alarmCount += 1;
          matchedArea.alarmWeight += item.handled ? 1 : 1.7;

          if (!item.handled) {
            matchedArea.unresolvedAlarmCount += 1;
          }
        } else {
          unmatchedWarnings.push(item);
        }
      });

      this.distributeUnmatchedWarnings(areaStats, unmatchedWarnings);
      this.ensureBaselineLoads(areaStats);

      const peopleTotal = this.getOverviewCountByType(1);
      const materialTotal = this.getOverviewCountByType(2);
      const peopleLoadTotal = areaStats.reduce((sum, item) => sum + item.peopleLoad, 0) || 1;
      const materialLoadTotal = areaStats.reduce((sum, item) => sum + item.materialLoad, 0) || 1;
      const geometryAverage =
        areaStats.reduce((sum, item) => sum + item.geometryMeasure, 0) / Math.max(areaStats.length, 1) || 1;

      areaStats.forEach((item) => {
        const spatialFactor = clamp(item.geometryMeasure / geometryAverage || 1, 0.65, 1.85);
        const targetPeople = peopleTotal || peopleLoadTotal;
        const targetMaterial = materialTotal || materialLoadTotal;

        item.spatialFactor = spatialFactor;
        item.estimatedPeople = (targetPeople * item.peopleLoad) / peopleLoadTotal;
        item.estimatedMaterial = (targetMaterial * item.materialLoad) / materialLoadTotal;
        item.peopleDensity = this.roundNumber(item.estimatedPeople / spatialFactor, 1);
        item.materialDensity = this.roundNumber(item.estimatedMaterial / spatialFactor, 1);
        item.stayMinutes = Math.round(item.stayMinutesBase / Math.max(item.taskTouches, 1));
        item.holdMinutes = Math.round(item.holdMinutesBase / Math.max(item.materialEvents, 1));

        if (!item.stayMinutes) {
          item.stayMinutes = Math.round(item.alarmCount * 6 + item.routeCount * 4);
        }

        if (!item.holdMinutes) {
          item.holdMinutes = Math.round(
            item.stayMinutes * (item.areaTypeKey === 'goods' ? 0.7 : 0.45) + item.unresolvedAlarmCount * 5
          );
        }

        item.routeCount = this.roundNumber(item.routeCount, 1);
      });

      this.applyMetricScores(areaStats);

      const sortedAreas = areaStats.sort((a, b) => {
        if (b.hotspotScore !== a.hotspotScore) return b.hotspotScore - a.hotspotScore;
        if (b.alarmCount !== a.alarmCount) return b.alarmCount - a.alarmCount;
        return b.routeCount - a.routeCount;
      });

      sortedAreas.forEach((item, index) => {
        item.rank = index + 1;
      });

      this.applyPlotPositions(sortedAreas);

      const routeRows = Object.values(routeMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
        .map((item) => ({
          ...item,
          label: `${item.startName} -> ${item.endName}`
        }));

      this.reportData = {
        areas: sortedAreas,
        routes: routeRows,
        trend: this.buildTrendPoints(normalizedWarnings)
      };
    },
    normalizeAreas(rawAreas, tasks, warnings) {
      const list = [];

      rawAreas.forEach((item, index) => {
        list.push({
          ...item,
          areaId: item.areaId || `area_${index + 1}`,
          objectName: item.objectName || this.$t('billReport.text.unassigned')
        });
      });

      const appendPseudoArea = (name, typeText = '') => {
        if (!name) return;

        const exists = this.findAreaByIdOrName(list, null, name);

        if (exists) return;

        list.push({
          areaId: `pseudo_${list.length + 1}_${this.normalizeText(name)}`,
          objectName: name,
          belongType: typeText,
          mapIds: this.filters.mapId ? [this.filters.mapId] : [],
          mapNames: '',
          areaContent: null
        });
      };

      tasks.forEach((item) => {
        appendPseudoArea(item.startAreaName, this.inferAreaTypeFromName(item.startAreaName));
        appendPseudoArea(item.endAreaName, this.inferAreaTypeFromName(item.endAreaName));
      });

      warnings.forEach((item) => {
        appendPseudoArea(item.fenceName);
      });

      return list;
    },
    selectAreasByMap(areas, mapId) {
      if (!mapId) return areas;

      const current = String(mapId);
      const filtered = areas.filter((item) => this.getAreaMapIds(item).includes(current));

      return filtered.length ? filtered : areas;
    },
    createAreaStat(item, index) {
      const parsed = this.parseAreaGeometry(item);

      return {
        ...item,
        areaId: item.areaId || `area_${index + 1}`,
        objectName: item.objectName || this.$t('billReport.text.unassigned'),
        mapNames: item.mapNames || '',
        areaTypeKey: this.normalizeAreaType(item.belongType, item.areaContent),
        centroidX: parsed.centroid.x,
        centroidY: parsed.centroid.y,
        geometryMeasure: parsed.measure,
        hasGeometry: parsed.hasGeometry,
        peopleLoad: 0,
        materialLoad: 0,
        alarmCount: 0,
        alarmWeight: 0,
        unresolvedAlarmCount: 0,
        stayMinutesBase: 0,
        holdMinutesBase: 0,
        taskTouches: 0,
        materialEvents: 0,
        routeCount: 0,
        peopleDensity: 0,
        materialDensity: 0,
        stayMinutes: 0,
        holdMinutes: 0,
        hotspotScore: 0,
        levelKey: 'stable',
        plotX: 0,
        plotY: 0,
        rank: 0
      };
    },
    normalizeTaskRecord(item) {
      const startTime = this.pickTimestamp(item, [
        'startTime',
        'taskStartTime',
        'planStartTime',
        'createTime',
        'dispatchTime'
      ]);
      const endTime = this.pickTimestamp(item, [
        'endTime',
        'taskEndTime',
        'planEndTime',
        'finishTime',
        'updateTime'
      ]);
      const effectiveStart = startTime || endTime || 0;
      const effectiveEnd = endTime || startTime || 0;
      let durationMinutes = 30;

      if (effectiveStart && effectiveEnd) {
        durationMinutes = clamp(Math.round(Math.abs(effectiveEnd - effectiveStart) / 60000), 15, 720);
      }

      const statusKey = this.normalizeTaskStatus(item.status);
      const overdueMinutes =
        (statusKey === 'running' || statusKey === 'dispatched') && endTime && Date.now() > endTime
          ? Math.round((Date.now() - endTime) / 60000)
          : 0;

      return {
        raw: item,
        id: item.id || item.taskId || '',
        startAreaId: item.startAreaId || '',
        startAreaName: item.startAreaName || '',
        endAreaId: item.endAreaId || '',
        endAreaName: item.endAreaName || '',
        typeKey: this.normalizeTaskType(item.taskType),
        statusKey,
        startTime,
        endTime,
        durationMinutes,
        overdueMinutes,
        isOverdue: overdueMinutes > 0
      };
    },
    normalizeWarningRecord(item) {
      return {
        raw: item,
        alarmTime: this.toTimestamp(item.alarmTime || item.time || item.createTime),
        fenceName: item.alarmFence && item.alarmFence.fenceName ? item.alarmFence.fenceName : '',
        objectName:
          item.alarmLocationObject && item.alarmLocationObject.locationObjectName
            ? item.alarmLocationObject.locationObjectName
            : '',
        handled: this.isHandledAlarm(item.alarmStatus),
        alarmType: Number(item.alarmType) || 0
      };
    },
    taskInRange(item) {
      const { start, end } = this.getRangeBounds();

      if (!item.startTime && !item.endTime) {
        return true;
      }

      const taskStart = item.startTime || item.endTime;
      const taskEnd = item.endTime || item.startTime;

      return taskEnd >= start && taskStart <= end;
    },
    applyTaskToArea(area, role, item) {
      if (!area) return;

      const roleWeight = role === 'start' ? 0.95 : 1.05;
      const statusWeights = {
        running: 1.35,
        dispatched: 1.1,
        done: 0.78,
        other: 1
      };
      const typeWeights = {
        nav: { people: 1.05, material: 0.2, route: 1.25 },
        pickup: { people: 0.7, material: 1.05, route: 0.95 },
        delivery: { people: 0.82, material: 1.22, route: 1.05 },
        other: { people: 0.65, material: 0.55, route: 0.8 }
      };
      const statusWeight = statusWeights[item.statusKey] || statusWeights.other;
      const typeWeight = typeWeights[item.typeKey] || typeWeights.other;
      const goodsBoost = area.areaTypeKey === 'goods' ? 1.15 : 0.88;
      const passageBoost = area.areaTypeKey === 'passage' ? 1.15 : 0.95;

      area.taskTouches += 1;
      area.peopleLoad += roleWeight * statusWeight * typeWeight.people * passageBoost;
      area.materialLoad += roleWeight * statusWeight * typeWeight.material * goodsBoost;
      area.routeCount += statusWeight * typeWeight.route;
      area.stayMinutesBase += item.durationMinutes * (role === 'end' ? 1.1 : 0.9);
      area.holdMinutesBase += item.durationMinutes * (item.typeKey === 'nav' ? 0.2 : 0.65);

      if (item.typeKey === 'delivery') {
        area.materialEvents += role === 'end' ? 2 : 1;
        area.materialLoad += role === 'end' ? 1.6 : 0.45;
      } else if (item.typeKey === 'pickup') {
        area.materialEvents += role === 'start' ? 2 : 1;
        area.materialLoad += role === 'start' ? 1.45 : 0.4;
      } else if (item.typeKey === 'nav') {
        area.peopleLoad += 0.45;
      }

      if (item.statusKey === 'running') {
        area.stayMinutesBase += 18;
        area.holdMinutesBase += 10;
      }

      if (item.statusKey === 'dispatched') {
        area.stayMinutesBase += 8;
      }

      if (item.isOverdue) {
        area.stayMinutesBase += item.overdueMinutes;
        area.holdMinutesBase += Math.round(item.overdueMinutes * 0.65);
      }
    },
    findAreaForWarning(areas, item) {
      const tryNames = [item.fenceName, item.objectName].filter(Boolean);

      for (let i = 0; i < tryNames.length; i += 1) {
        const currentName = tryNames[i];
        const exact = areas.find(
          (area) => this.normalizeText(area.objectName) === this.normalizeText(currentName)
        );

        if (exact) return exact;

        const fuzzy = areas.find((area) => this.isNameRelated(area.objectName, currentName));

        if (fuzzy) return fuzzy;
      }

      return null;
    },
    distributeUnmatchedWarnings(areas, warnings) {
      if (!warnings.length || !areas.length) return;

      const rankedAreas = [...areas].sort(
        (a, b) => b.peopleLoad + b.materialLoad + b.routeCount - (a.peopleLoad + a.materialLoad + a.routeCount)
      );

      warnings.forEach((item, index) => {
        const target = rankedAreas[index % Math.max(Math.min(rankedAreas.length, 5), 1)];

        if (!target) return;

        target.alarmCount += 1;
        target.alarmWeight += item.handled ? 1 : 1.6;

        if (!item.handled) {
          target.unresolvedAlarmCount += 1;
        }
      });
    },
    ensureBaselineLoads(areas) {
      if (!areas.length) return;

      if (!areas.some((item) => item.peopleLoad > 0)) {
        areas.forEach((item, index) => {
          item.peopleLoad = item.areaTypeKey === 'passage' ? 1.25 : 1 + (index % 3) * 0.18;
        });
      }

      if (!areas.some((item) => item.materialLoad > 0)) {
        areas.forEach((item, index) => {
          item.materialLoad = item.areaTypeKey === 'goods' ? 1.3 : 0.82 + (index % 2) * 0.16;
          item.materialEvents = item.materialEvents || 1;
        });
      }

      if (!areas.some((item) => item.routeCount > 0)) {
        areas.forEach((item, index) => {
          item.routeCount = item.areaTypeKey === 'passage' ? 1.4 : 0.9 + (index % 2) * 0.25;
        });
      }
    },
    applyMetricScores(areas) {
      const peopleMax = Math.max(...areas.map((item) => item.peopleDensity), 1);
      const materialMax = Math.max(...areas.map((item) => item.materialDensity), 1);
      const alarmMax = Math.max(...areas.map((item) => item.alarmCount + item.unresolvedAlarmCount * 0.75), 1);
      const stayMax = Math.max(...areas.map((item) => item.stayMinutes + item.holdMinutes * 0.65), 1);
      const routeMax = Math.max(...areas.map((item) => item.routeCount), 1);

      areas.forEach((item) => {
        item.peopleScore = Math.round((item.peopleDensity / peopleMax) * 100);
        item.materialScore = Math.round((item.materialDensity / materialMax) * 100);
        item.alarmScore = Math.round(
          ((item.alarmCount + item.unresolvedAlarmCount * 0.75) / alarmMax) * 100
        );
        item.stayScore = Math.round(((item.stayMinutes + item.holdMinutes * 0.65) / stayMax) * 100);
        item.routeScore = Math.round((item.routeCount / routeMax) * 100);
        item.hotspotScore = Math.round(
          item.peopleScore * 0.24 +
            item.materialScore * 0.22 +
            item.alarmScore * 0.24 +
            item.stayScore * 0.16 +
            item.routeScore * 0.14
        );

        if (item.hotspotScore >= 78) {
          item.levelKey = 'high';
        } else if (item.hotspotScore >= 52) {
          item.levelKey = 'medium';
        } else {
          item.levelKey = 'stable';
        }
      });
    },
    applyPlotPositions(areas) {
      const geometryAreas = areas.filter((item) => item.hasGeometry);

      if (geometryAreas.length >= 2) {
        const minX = Math.min(...geometryAreas.map((item) => item.centroidX));
        const maxX = Math.max(...geometryAreas.map((item) => item.centroidX));
        const minY = Math.min(...geometryAreas.map((item) => item.centroidY));
        const maxY = Math.max(...geometryAreas.map((item) => item.centroidY));
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;

        areas.forEach((item) => {
          if (item.hasGeometry) {
            item.plotX = this.roundNumber(8 + ((item.centroidX - minX) / rangeX) * 84, 1);
            item.plotY = this.roundNumber(12 + (1 - (item.centroidY - minY) / rangeY) * 72, 1);
          }
        });

        const missingAreas = areas.filter((item) => !item.hasGeometry);

        missingAreas.forEach((item, index) => {
          const position = this.getFallbackPlotPosition(index, missingAreas.length);
          item.plotX = position.x;
          item.plotY = position.y;
        });

        return;
      }

      areas.forEach((item, index) => {
        const position = this.getFallbackPlotPosition(index, areas.length);
        item.plotX = position.x;
        item.plotY = position.y;
      });
    },
    getFallbackPlotPosition(index, total) {
      const safeTotal = Math.max(total, 1);
      const columns = safeTotal <= 4 ? 2 : safeTotal <= 9 ? 3 : 4;
      const row = Math.floor(index / columns);
      const col = index % columns;
      const rows = Math.ceil(safeTotal / columns);

      return {
        x: this.roundNumber(14 + (col * 70) / Math.max(columns - 1, 1), 1),
        y: this.roundNumber(20 + (row * 58) / Math.max(rows - 1, 1), 1)
      };
    },
    buildTrendPoints(warnings) {
      if (warnings.length) {
        const { start, end } = this.getRangeBounds();
        const useHour = end - start <= 48 * 60 * 60 * 1000;
        const bucketMap = {};

        warnings.forEach((item) => {
          const time = item.alarmTime;

          if (!time) return;

          const key = this.$pub.slTimeFormat(time, {
            format: useHour ? 'YYYY-MM-DD HH:00' : 'YYYY-MM-DD'
          });

          if (!bucketMap[key]) {
            bucketMap[key] = {
              time,
              label: this.$pub.slTimeFormat(time, {
                format: useHour ? 'MM-DD HH:00' : 'MM-DD'
              }),
              count: 0
            };
          }

          bucketMap[key].count += 1;
        });

        return Object.values(bucketMap).sort((a, b) => a.time - b.time);
      }

      const alarmOverview = this.rawData.alarmOverview;
      const alarmList = alarmOverview && Array.isArray(alarmOverview.time24AlarmList)
        ? alarmOverview.time24AlarmList
        : [];

      return alarmList.map((item) => ({
        time: item.time,
        label: this.$pub.slTimeFormat(item.time, { format: 'HH:mm' }),
        count: Number(item.count) || 0
      }));
    },
    getAreaMapIds(item) {
      if (!item) return [];
      if (Array.isArray(item.mapIds)) return item.mapIds.map((id) => String(id));
      if (typeof item.mapIds === 'string' && item.mapIds) {
        return item.mapIds
          .split(',')
          .map((id) => String(id).trim())
          .filter(Boolean);
      }

      return [];
    },
    findAreaByIdOrName(areas, areaId, areaName) {
      if (areaId !== null && areaId !== undefined && areaId !== '') {
        const hit = areas.find((item) => String(item.areaId) === String(areaId));

        if (hit) return hit;
      }

      if (areaName) {
        const exact = areas.find(
          (item) => this.normalizeText(item.objectName) === this.normalizeText(areaName)
        );

        if (exact) return exact;

        const fuzzy = areas.find((item) => this.isNameRelated(item.objectName, areaName));

        if (fuzzy) return fuzzy;
      }

      return null;
    },
    normalizeAreaType(typeText, areaContent) {
      const text = `${typeText || ''}${areaContent || ''}`.toLowerCase();

      if (text.indexOf('通路') > -1 || text.indexOf('passage') > -1 || text.indexOf('linestring') > -1) {
        return 'passage';
      }

      if (
        text.indexOf('商品') > -1 ||
        text.indexOf('goods') > -1 ||
        text.indexOf('物料') > -1 ||
        text.indexOf('polygon') > -1
      ) {
        return 'goods';
      }

      return 'general';
    },
    inferAreaTypeFromName(name) {
      const text = String(name || '').toLowerCase();

      if (text.indexOf('通路') > -1 || text.indexOf('通道') > -1 || text.indexOf('passage') > -1) {
        return '通路区域';
      }

      if (
        text.indexOf('仓') > -1 ||
        text.indexOf('货') > -1 ||
        text.indexOf('goods') > -1 ||
        text.indexOf('material') > -1
      ) {
        return '商品区域';
      }

      return '';
    },
    normalizeTaskType(value) {
      const text = String(value || '').toLowerCase();

      if (text.indexOf('送') > -1 || text.indexOf('delivery') > -1) return 'delivery';
      if (text.indexOf('取') > -1 || text.indexOf('pickup') > -1) return 'pickup';
      if (text.indexOf('导') > -1 || text.indexOf('nav') > -1 || text.indexOf('ナビ') > -1) {
        return 'nav';
      }

      return 'other';
    },
    normalizeTaskStatus(value) {
      const text = String(value || '').toLowerCase();

      if (text.indexOf('执行') > -1 || text.indexOf('実行') > -1 || text.indexOf('running') > -1) {
        return 'running';
      }

      if (
        text.indexOf('派发') > -1 ||
        text.indexOf('割当') > -1 ||
        text.indexOf('dispatch') > -1
      ) {
        return 'dispatched';
      }

      if (
        text.indexOf('完成') > -1 ||
        text.indexOf('完了') > -1 ||
        text.indexOf('done') > -1 ||
        text.indexOf('arrived') > -1
      ) {
        return 'done';
      }

      return 'other';
    },
    isHandledAlarm(status) {
      return status === true || status === 1 || status === '1';
    },
    pickTimestamp(item, keys) {
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        const value = this.toTimestamp(item[key]);

        if (value) return value;
      }

      return 0;
    },
    toTimestamp(value) {
      if (value === null || value === undefined || value === '') return 0;

      if (typeof value === 'number' && Number.isFinite(value)) {
        return value > 1000000000000 ? value : value * 1000;
      }

      if (typeof value === 'string' && /^\d+$/.test(value)) {
        const num = Number(value);
        return num > 1000000000000 ? num : num * 1000;
      }

      const parsed = new Date(value).getTime();

      return Number.isFinite(parsed) ? parsed : 0;
    },
    parseAreaGeometry(item) {
      const points = this.parseWktPoints(item && item.areaContent ? item.areaContent : '');
      const isLine = this.normalizeAreaType(item && item.belongType, item && item.areaContent) === 'passage';
      const measure = points.length
        ? isLine
          ? this.computePolylineLength(points)
          : this.computePolygonArea(points)
        : 1;
      const centroid = points.length
        ? isLine
          ? this.computeAveragePoint(points)
          : this.computePolygonCentroid(points)
        : { x: 0, y: 0 };

      return {
        centroid,
        measure: measure > 0 ? measure : 1,
        hasGeometry: points.length >= 2 && Number.isFinite(centroid.x) && Number.isFinite(centroid.y)
      };
    },
    parseWktPoints(wkt) {
      if (!wkt || typeof wkt !== 'string') return [];

      let raw = wkt.trim();

      if (!raw) return [];

      raw = raw.replace(/^POLYGON\s*\(\(/i, '').replace(/\)\)$/i, '');
      raw = raw.replace(/^LINESTRING\s*\(/i, '').replace(/\)$/i, '');

      return raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const parts = item.split(/\s+/);
          return {
            x: Number(parts[0]),
            y: Number(parts[1])
          };
        })
        .filter((item) => Number.isFinite(item.x) && Number.isFinite(item.y));
    },
    computePolylineLength(points) {
      return points.reduce((sum, point, index) => {
        if (!index) return sum;
        return sum + Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y);
      }, 0);
    },
    computePolygonArea(points) {
      if (points.length < 3) return 1;

      let total = 0;

      for (let i = 0; i < points.length; i += 1) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        total += current.x * next.y - next.x * current.y;
      }

      return Math.abs(total / 2) || 1;
    },
    computeAveragePoint(points) {
      const total = points.reduce(
        (sum, item) => {
          sum.x += item.x;
          sum.y += item.y;
          return sum;
        },
        { x: 0, y: 0 }
      );

      return {
        x: total.x / points.length,
        y: total.y / points.length
      };
    },
    computePolygonCentroid(points) {
      if (points.length < 3) return this.computeAveragePoint(points);

      let area = 0;
      let cx = 0;
      let cy = 0;

      for (let i = 0; i < points.length; i += 1) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        const factor = current.x * next.y - next.x * current.y;

        area += factor;
        cx += (current.x + next.x) * factor;
        cy += (current.y + next.y) * factor;
      }

      if (!area) return this.computeAveragePoint(points);

      return {
        x: cx / (3 * area),
        y: cy / (3 * area)
      };
    },
    getOverviewCountByType(type) {
      const overview = this.rawData.overview;
      const locationObject = overview && Array.isArray(overview.locationObject) ? overview.locationObject : [];

      return locationObject.reduce((sum, item) => {
        const currentType = Number(item.type);
        const currentCount = Number(item.count) || 0;
        const online = item.online === true || item.online === 1;

        if (currentType === type && online) {
          return sum + currentCount;
        }

        return sum;
      }, 0);
    },
    getRangeBounds() {
      const range = Array.isArray(this.filters.dateRange) ? this.filters.dateRange : [];
      const start = this.toTimestamp(range[0]) || this.toTimestamp(new Date());
      const end = this.toTimestamp(range[1]) || Date.now();

      return {
        start: Math.min(start, end),
        end: Math.max(start, end)
      };
    },
    normalizeText(text) {
      return String(text || '')
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[()_-]/g, '');
    },
    isNameRelated(a, b) {
      const left = this.normalizeText(a);
      const right = this.normalizeText(b);

      if (!left || !right) return false;

      return left.indexOf(right) > -1 || right.indexOf(left) > -1;
    },
    getTopAreaBy(metric) {
      const sorted = [...this.reportData.areas].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
      return sorted[0] || null;
    },
    averageAreaMetric(metric) {
      const list = this.reportData.areas || [];
      if (!list.length) return 0;

      const total = list.reduce((sum, item) => sum + (Number(item[metric]) || 0), 0);

      return Math.round(total / list.length);
    },
    getFocusMetricValue(item) {
      switch (this.filters.analysisType) {
        case 'people':
          return item.peopleDensity || 0;
        case 'material':
          return item.materialDensity || 0;
        case 'alarm':
          return item.alarmCount || 0;
        case 'stay':
          return (item.stayMinutes || 0) + (item.holdMinutes || 0) * 0.65;
        case 'route':
          return item.routeCount || 0;
        default:
          return item.hotspotScore || 0;
      }
    },
    getFocusMetricDisplay(item) {
      const value = this.getFocusMetricValue(item);

      if (this.filters.analysisType === 'people' || this.filters.analysisType === 'material') {
        return this.formatValue(value, 'density');
      }

      return this.formatValue(value, 'count');
    },
    getAreaReason(item) {
      const reasons = [
        { label: this.$t('billReport.analysis.people'), value: item.peopleScore },
        { label: this.$t('billReport.analysis.material'), value: item.materialScore },
        { label: this.$t('billReport.analysis.alarm'), value: item.alarmScore },
        { label: this.$t('billReport.analysis.stay'), value: item.stayScore },
        { label: this.$t('billReport.analysis.route'), value: item.routeScore }
      ]
        .sort((a, b) => b.value - a.value)
        .slice(0, 2);

      return reasons.map((entry) => entry.label).join(' + ');
    },
    getAreaTooltip(item) {
      return [
        `${item.objectName}`,
        `${this.$t('billReport.table.peopleDensity')}: ${this.formatValue(item.peopleDensity, 'density')}`,
        `${this.$t('billReport.table.materialDensity')}: ${this.formatValue(item.materialDensity, 'density')}`,
        `${this.$t('billReport.table.alarm')}: ${item.alarmCount}`,
        `${this.$t('billReport.table.stayHold')}: ${item.stayMinutes}/${item.holdMinutes}`,
        `${this.$t('billReport.table.score')}: ${item.hotspotScore}`
      ].join(' | ');
    },
    getLevelLabel(level) {
      return this.$t(`billReport.level.${level}`);
    },
    getLevelColor(level) {
      if (level === 'high') return 'red';
      if (level === 'medium') return 'orange';
      return 'green';
    },
    getAreaTypeLabel(type) {
      return this.$t(`billReport.type.${type || 'general'}`);
    },
    getAreaTypeColor(type) {
      if (type === 'goods') return 'blue';
      if (type === 'passage') return 'cyan';
      return 'default';
    },
    getNodeWrapStyle(item) {
      return {
        left: `${item.plotX}%`,
        top: `${item.plotY}%`
      };
    },
    getNodeStyle(item) {
      const size = item.nodeSize || this.getNodeSize(item);

      return {
        width: `${size}px`,
        height: `${size}px`
      };
    },
    getNodeSize(item) {
      const score = this.getFocusMetricValue(item);
      const focusMax = Math.max(...(this.reportData.areas || []).map((area) => this.getFocusMetricValue(area)), 1);
      return Math.round(22 + (score / focusMax) * 26);
    },
    formatValue(value, type) {
      const current = Number(value) || 0;

      if (type === 'density') {
        return current.toFixed(1);
      }

      return `${Math.round(current * 10) / 10}`;
    },
    roundNumber(value, digits = 1) {
      const base = Math.pow(10, digits);
      return Math.round((Number(value) || 0) * base) / base;
    },
    formatRank(index) {
      return index < 10 ? `0${index}` : `${index}`;
    },
    truncateText(text, length = 12) {
      const value = String(text || '');
      return value.length > length ? `${value.slice(0, length)}...` : value;
    },
    renderCharts() {
      this.renderRankingChart();
      this.renderAlarmChart();
      this.renderRouteChart();
    },
    renderRankingChart() {
      const list = [...this.reportData.areas]
        .sort((a, b) => this.getFocusMetricValue(b) - this.getFocusMetricValue(a))
        .slice(0, 8);
      const dom = document.getElementById(this.chartIds.ranking);

      if (!dom || !list.length) {
        this.disposeChart('ranking');
        return;
      }

      const chart = this.getChartInstance('ranking', dom);
      const color = this.getFocusChartColor();
      const labels = list.map((item) => this.truncateText(item.objectName, 10));
      const values = list.map((item) => this.getFocusMetricValue(item));

      chart.setOption({
        color: [color],
        grid: {
          top: 20,
          left: 110,
          right: 24,
          bottom: 12,
          containLabel: false
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params) => {
            const current = params[0];
            return `${list[current.dataIndex].objectName}<br/>${this.focusMetricLabel}: ${this.getFocusMetricDisplay(
              list[current.dataIndex]
            )}`;
          }
        },
        xAxis: {
          type: 'value',
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#d7deea'
            }
          },
          axisLabel: {
            color: '#6b7a90'
          }
        },
        yAxis: {
          type: 'category',
          inverse: true,
          data: labels,
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#31435f'
          }
        },
        series: [
          {
            type: 'bar',
            data: values,
            barWidth: 14,
            itemStyle: {
              borderRadius: [0, 10, 10, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color },
                { offset: 1, color: '#8fd3ff' }
              ])
            },
            label: {
              show: true,
              position: 'right',
              color: '#2b3951',
              formatter: ({ dataIndex }) => this.getFocusMetricDisplay(list[dataIndex])
            }
          }
        ]
      });
    },
    renderAlarmChart() {
      const list = this.reportData.trend || [];
      const dom = document.getElementById(this.chartIds.alarm);

      if (!dom || !list.length) {
        this.disposeChart('alarm');
        return;
      }

      const chart = this.getChartInstance('alarm', dom);

      chart.setOption({
        color: ['#ff6b6b'],
        grid: {
          top: 30,
          left: 42,
          right: 18,
          bottom: 26,
          containLabel: true
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: list.map((item) => item.label),
          axisTick: {
            show: false
          },
          axisLine: {
            lineStyle: {
              color: '#cfd7e5'
            }
          },
          axisLabel: {
            color: '#6b7a90',
            hideOverlap: true
          }
        },
        yAxis: {
          type: 'value',
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#d7deea'
            }
          },
          axisLabel: {
            color: '#6b7a90'
          }
        },
        series: [
          {
            type: 'line',
            smooth: true,
            data: list.map((item) => item.count),
            symbolSize: 7,
            lineStyle: {
              width: 3
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255,107,107,0.35)' },
                { offset: 1, color: 'rgba(255,107,107,0.02)' }
              ])
            }
          }
        ]
      });
    },
    renderRouteChart() {
      const list = (this.reportData.routes || []).slice(0, 8);
      const dom = document.getElementById(this.chartIds.route);

      if (!dom || !list.length) {
        this.disposeChart('route');
        return;
      }

      const chart = this.getChartInstance('route', dom);

      chart.setOption({
        color: ['#36cfc9'],
        grid: {
          top: 20,
          left: 126,
          right: 24,
          bottom: 12,
          containLabel: false
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params) => {
            const current = params[0];
            const row = list[current.dataIndex];
            return `${row.label}<br/>${this.$t('billReport.panel.routeFlow')}: ${row.count}`;
          }
        },
        xAxis: {
          type: 'value',
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#d7deea'
            }
          },
          axisLabel: {
            color: '#6b7a90'
          }
        },
        yAxis: {
          type: 'category',
          inverse: true,
          data: list.map((item) => this.truncateText(item.label, 14)),
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#31435f'
          }
        },
        series: [
          {
            type: 'bar',
            data: list.map((item) => item.count),
            barWidth: 14,
            itemStyle: {
              borderRadius: [0, 10, 10, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#23b8b2' },
                { offset: 1, color: '#88efe8' }
              ])
            },
            label: {
              show: true,
              position: 'right',
              color: '#2b3951'
            }
          }
        ]
      });
    },
    getChartInstance(name, dom) {
      if (!this.charts[name]) {
        this.charts[name] = echarts.init(dom);
      }

      return this.charts[name];
    },
    getFocusChartColor() {
      const colorMap = {
        composite: '#3d7eff',
        people: '#13c2c2',
        material: '#fa8c16',
        alarm: '#ff4d4f',
        stay: '#722ed1',
        route: '#2f54eb'
      };

      return colorMap[this.filters.analysisType] || colorMap.composite;
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
      this.disposeChart('ranking');
      this.disposeChart('alarm');
      this.disposeChart('route');
    },
    handleExport() {
      if (!this.reportData.areas.length) {
        this.$Message.warning(this.$t('base.noDataText'));
        return;
      }

      const headers = [
        this.$t('billReport.table.area'),
        this.$t('billReport.table.type'),
        this.$t('billReport.table.map'),
        this.$t('billReport.table.peopleDensity'),
        this.$t('billReport.table.materialDensity'),
        this.$t('billReport.table.alarm'),
        this.$t('billReport.table.stayHold'),
        this.$t('billReport.table.route'),
        this.$t('billReport.table.score'),
        this.$t('billReport.table.level')
      ];
      const rows = this.reportData.areas.map((item) => [
        item.objectName,
        this.getAreaTypeLabel(item.areaTypeKey),
        item.mapNames || this.$t('base.noData'),
        this.formatValue(item.peopleDensity, 'density'),
        this.formatValue(item.materialDensity, 'density'),
        `${item.alarmCount}`,
        `${item.stayMinutes}/${item.holdMinutes}`,
        this.formatValue(item.routeCount, 'count'),
        `${item.hotspotScore}`,
        this.getLevelLabel(item.levelKey)
      ]);
      const csv = ['\uFEFF' + headers.join(',')]
        .concat(rows.map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(',')))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = this.$pub.slTimeFormat(Date.now(), { format: 'YYYYMMDD_HHmmss' });

      link.href = url;
      link.download = `${this.$t('billReport.export.fileName')}_${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      this.$Message.success(this.$t('base.optionSuccess'));
    },
    escapeCsvCell(value) {
      const text = String(value === null || value === undefined ? '' : value).replace(/"/g, '""');
      return `"${text}"`;
    }
  }
};
</script>

<style scoped lang="less">
.bill-report {
  position: relative;
}

.report-filter-card {
  margin-bottom: 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, #fbfdff 0%, #eef5ff 50%, #f9fcff 100%);
  box-shadow: 0 14px 32px rgba(44, 88, 140, 0.08);
}

.report-header {
  display: flex;
  align-items: center;
}

.report-title {
  font-size: 22px;
  font-weight: 700;
  color: #1d2d44;
  line-height: 1.2;
}

.report-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #66788f;
  line-height: 1.6;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.summary-card {
  position: relative;
  overflow: hidden;
  min-height: 132px;
  padding: 20px 20px 18px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(23, 43, 77, 0.08);
}

.summary-card::before {
  position: absolute;
  top: -48px;
  right: -32px;
  width: 120px;
  height: 120px;
  content: '';
  border-radius: 50%;
  opacity: 0.14;
}

.summary-card.accent-hotspot::before {
  background: linear-gradient(135deg, #ff9a62 0%, #ff5e5e 100%);
}

.summary-card.accent-density::before {
  background: linear-gradient(135deg, #45c8ff 0%, #2f54eb 100%);
}

.summary-card.accent-alarm::before {
  background: linear-gradient(135deg, #ff7b7b 0%, #ff3d71 100%);
}

.summary-card.accent-stayRoute::before {
  background: linear-gradient(135deg, #4ed6c9 0%, #1f8f84 100%);
}

.summary-label {
  position: relative;
  z-index: 1;
  font-size: 13px;
  color: #6f8197;
}

.summary-value {
  position: relative;
  z-index: 1;
  margin-top: 14px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
  color: #1d2d44;
}

.summary-desc {
  position: relative;
  z-index: 1;
  margin-top: 12px;
  min-height: 40px;
  color: #5f738d;
  line-height: 1.6;
}

.report-grid {
  display: grid;
  gap: 14px;
  margin-bottom: 14px;
}

.report-grid-top {
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
}

.report-grid-bottom {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.report-panel {
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(20, 44, 79, 0.07);
}

.report-panel ::v-deep .ivu-card-body {
  padding: 18px;
}

.panel-title {
  font-weight: 600;
  color: #1f2f47;
}

.panel-extra {
  color: #72839a;
  font-size: 12px;
}

.range-text {
  position: relative;
  top: 2px;
}

.hotspot-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
  gap: 16px;
}

.hotspot-stage {
  position: relative;
  min-height: 430px;
  overflow: hidden;
  border-radius: 24px;
  background: linear-gradient(155deg, #08182f 0%, #0f2d57 52%, #14446f 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.hotspot-stage::before {
  position: absolute;
  top: -80px;
  left: -60px;
  width: 220px;
  height: 220px;
  content: '';
  border-radius: 50%;
  background: radial-gradient(circle, rgba(64, 196, 255, 0.34) 0%, rgba(64, 196, 255, 0) 70%);
}

.hotspot-stage::after {
  position: absolute;
  right: -70px;
  bottom: -80px;
  width: 250px;
  height: 250px;
  content: '';
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 137, 102, 0.28) 0%, rgba(255, 137, 102, 0) 70%);
}

.stage-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  background-size: 56px 56px;
  opacity: 0.65;
}

.route-svg {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.route-line {
  fill: none;
  stroke: rgba(157, 221, 255, 0.46);
  stroke-linecap: round;
}

.hotspot-node-wrap {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  text-align: center;
}

.hotspot-node {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 12px 28px rgba(9, 14, 25, 0.28);
}

.hotspot-node::after {
  position: absolute;
  inset: -8px;
  content: '';
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.22);
  animation: ripple 2.8s ease-out infinite;
}

.hotspot-node.high {
  background: linear-gradient(135deg, #ff8c5b 0%, #ff4d4f 100%);
}

.hotspot-node.medium {
  background: linear-gradient(135deg, #ffcc67 0%, #ff9f1a 100%);
}

.hotspot-node.stable {
  background: linear-gradient(135deg, #4fe1d5 0%, #2678ff 100%);
}

.hotspot-score {
  position: relative;
  z-index: 1;
}

.hotspot-label {
  max-width: 126px;
  padding: 4px 8px;
  margin-top: 10px;
  overflow: hidden;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-radius: 999px;
  background: rgba(10, 20, 37, 0.58);
  backdrop-filter: blur(6px);
}

.hotspot-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, #f5f9ff 0%, #eef5ff 100%);
}

.legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #51637a;
  font-size: 12px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  margin-right: 8px;
  border-radius: 50%;
}

.legend-dot.high {
  background: #ff5d5d;
}

.legend-dot.medium {
  background: #ffb347;
}

.legend-dot.stable {
  background: #3ec9be;
}

.insight-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
}

.insight-rank {
  min-width: 30px;
  font-size: 16px;
  font-weight: 700;
  color: #2b5be0;
}

.insight-text {
  flex: 1;
  min-width: 0;
}

.insight-name {
  overflow: hidden;
  font-weight: 600;
  color: #203148;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.insight-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #6f8197;
  line-height: 1.5;
}

.chart-box {
  height: 360px;
}

.detail-panel {
  margin-bottom: 12px;
}

@keyframes ripple {
  0% {
    transform: scale(0.84);
    opacity: 0.58;
  }

  100% {
    transform: scale(1.38);
    opacity: 0;
  }
}

@media (max-width: 1360px) {
  .report-grid-top,
  .report-grid-bottom,
  .hotspot-layout {
    grid-template-columns: 1fr;
  }

  .hotspot-stage {
    min-height: 360px;
  }
}

@media (max-width: 768px) {
  .summary-value {
    font-size: 24px;
  }

  .report-title {
    font-size: 18px;
  }

  .hotspot-side {
    padding: 12px;
  }

  .chart-box {
    height: 300px;
  }
}
</style>
