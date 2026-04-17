<template>
  <div class="data-analysis-page">
    <Card class="toolbar-card" :bordered="false" dis-hover>
      <div class="toolbar-row">
        <div class="title-block">
          <h2 class="page-title">{{ $t('billReport.title') }}</h2>
          <p class="page-subtitle">{{ pageSubtitle }}</p>
        </div>

        <div class="toolbar-controls">
          <div class="control-group map-group">
            <span class="control-label">{{ $t('base.map') }}</span>
            <sl-map-cascader
              ref="mapCascader"
              @onChange="handleMapChange"
              @onSetMapData="handleMapReady"
            />
          </div>

          <div class="control-group range-group">
            <span class="control-label">{{ $t('billReport.filter.range') }}</span>
            <DatePicker
              v-model="filters.dateRange"
              transfer
              :editable="false"
              type="datetimerange"
              format="yyyy-MM-dd HH:mm:ss"
              class="range-picker"
            ></DatePicker>
          </div>

          <div class="toolbar-actions">
            <Button type="primary" :loading="loading" @click="loadReport">
              {{ $t('billReport.action.refresh') }}
            </Button>
            <Button @click="handleExportExcel">{{ $t('billReport.action.exportExcel') }}</Button>
            <Button @click="handleExportPdf">{{ $t('billReport.action.exportPdf') }}</Button>
          </div>
        </div>
      </div>

      <div class="toolbar-meta">
        <span class="meta-text">{{ $t('billReport.text.mapLabel') }}: {{ currentMapLabel }}</span>
        <span class="meta-divider"></span>
        <span class="meta-text">{{ $t('billReport.text.generatedAt') }}: {{ generatedLabel }}</span>
      </div>
    </Card>

    <div class="summary-grid">
      <div v-for="card in summaryCards" :key="card.key" class="summary-card">
        <p class="summary-label">{{ card.label }}</p>
        <p class="summary-value">{{ card.value }}</p>
        <p class="summary-desc">{{ card.desc }}</p>
      </div>
    </div>

    <div class="content-grid">
      <Card class="surface-card" :bordered="false" dis-hover>
        <div slot="title" class="panel-head">
          <div>
            <p class="panel-title">{{ localizedText('热点区域', 'ホットスポット') }}</p>
          </div>
        </div>

        <div v-if="hotspotRanking.length" class="area-list">
          <div v-for="(item, index) in hotspotRanking" :key="item.areaId" class="area-item">
            <div class="area-item-head">
              <div class="area-main">
                <span class="area-rank">{{ formatRank(index + 1) }}</span>
                <div class="area-copy">
                  <p class="area-name">{{ item.displayName }}</p>
                  <p class="area-meta">
                    {{ areaTypeLabel(item.areaType) }} / {{ $t(`billReport.level.${item.levelKey}`) }}
                  </p>
                </div>
              </div>

              <div class="score-box">
                <span class="score-label">{{ localizedText('热点评分', 'ホットスコア') }}</span>
                <strong class="score-value">{{ item.hotspotScore }}</strong>
              </div>
            </div>

            <div class="metric-bar">
              <div class="metric-bar-fill score-fill" :style="{ width: `${scoreBarWidth(item)}%` }"></div>
            </div>

            <div class="metric-chip-list">
              <span
                v-for="metric in areaMetricChips(item)"
                :key="`${item.areaId}-${metric.key}`"
                class="metric-chip"
              >
                <strong>{{ metric.label }}</strong>
                <span>{{ metric.value }}</span>
              </span>
            </div>

            <p class="area-reason">{{ hotspotReasonText(item) }}</p>
          </div>
        </div>

        <sl-empty v-else />
      </Card>

      <div class="side-grid">
        <Card class="surface-card side-panel" :bordered="false" dis-hover>
          <div slot="title" class="panel-head">
            <div>
              <p class="panel-title">{{ localizedText('电子围栏告警', '電子フェンスアラーム') }}</p>
              <p class="panel-tip">{{ $t('billReport.text.alarmRateTip') }}</p>
            </div>
          </div>

          <div v-if="alarmRanking.length" class="metric-list">
            <div v-for="item in alarmRanking" :key="`alarm-${item.areaId}`" class="metric-item">
              <div class="metric-item-head">
                <span class="metric-name">{{ item.displayName }}</span>
                <span class="metric-value">{{ alarmCountText(item) }}</span>
              </div>
              <div class="metric-bar">
                <div class="metric-bar-fill danger-fill" :style="{ width: `${alarmBarWidth(item)}%` }"></div>
              </div>
              <div class="metric-foot">
                <span>{{ alarmAverageText(item) }}</span>
                <span>{{ $t('billReport.text.unresolved') }}: {{ item.unresolvedAlarmCount }}</span>
              </div>
            </div>
          </div>

          <sl-empty v-else />
        </Card>

        <Card class="surface-card side-panel" :bordered="false" dis-hover>
          <div slot="title" class="panel-head">
            <div>
              <p class="panel-title">{{ localizedText('滞留 / 放置', '滞留 / 放置') }}</p>
              <p class="panel-tip">
                {{
                  localizedText(
                    '按滞留和放置总时长排序。',
                    '滞留時間と放置時間の合計で並べています。'
                  )
                }}
              </p>
            </div>
          </div>

          <div v-if="stayRanking.length" class="metric-list">
            <div v-for="item in stayRanking" :key="`stay-${item.areaId}`" class="metric-item">
              <div class="metric-item-head">
                <span class="metric-name">{{ item.displayName }}</span>
                <span class="metric-value">{{ stayHoldText(item) }}</span>
              </div>
              <div class="metric-bar">
                <div class="metric-bar-fill stay-fill" :style="{ width: `${stayBarWidth(item)}%` }"></div>
              </div>
              <div class="metric-foot">
                <span>{{ $t('billReport.table.stayMinutes') }}: {{ item.stayMinutes }}</span>
                <span>{{ $t('billReport.table.holdMinutes') }}: {{ item.holdMinutes }}</span>
              </div>
            </div>
          </div>

          <sl-empty v-else />
        </Card>

        <Card class="surface-card side-panel" :bordered="false" dis-hover>
          <div slot="title" class="panel-head">
            <div>
              <p class="panel-title">{{ localizedText('活动 / 搬送路线', '活動 / 搬送ルート') }}</p>
              <p class="panel-tip">{{ $t('billReport.text.routeTip') }}</p>
            </div>
          </div>

          <div v-if="routeRanking.length" class="route-list">
            <div
              v-for="(item, index) in routeRanking"
              :key="`${item.startAreaId}-${item.endAreaId}`"
              class="route-item"
            >
              <div class="route-head">
                <span class="route-rank">{{ formatRank(index + 1) }}</span>
                <span class="route-count">{{ item.count }}</span>
              </div>
              <p class="route-path">{{ item.startDisplayName }} -> {{ item.endDisplayName }}</p>
            </div>
          </div>

          <sl-empty v-else />
        </Card>
      </div>
    </div>

    <Card class="surface-card table-panel" :bordered="false" dis-hover>
      <div slot="title" class="panel-head">
        <div>
          <p class="panel-title">{{ $t('billReport.panel.detail') }}</p>
          <p class="panel-tip">{{ detailCountText }}</p>
        </div>
      </div>

      <Table border :columns="tableColumns" :data="report.areas" :loading="loading"></Table>
    </Card>

    <div ref="pdfSheet" class="pdf-sheet">
      <div class="pdf-head">
        <div>
          <p class="pdf-title">{{ $t('billReport.title') }}</p>
          <p class="pdf-subtitle">{{ pageSubtitle }}</p>
        </div>
        <div class="pdf-meta">
          <p>{{ $t('billReport.text.mapLabel') }}: {{ currentMapLabel }}</p>
          <p>{{ $t('billReport.filter.range') }}: {{ selectedRangeText }}</p>
          <p>{{ $t('billReport.text.generatedAt') }}: {{ generatedLabel }}</p>
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
            <th>{{ $t('billReport.table.map') }}</th>
            <th>{{ $t('billReport.table.peopleDensity') }}</th>
            <th>{{ $t('billReport.table.materialDensity') }}</th>
            <th>{{ $t('billReport.table.alarmCount') }}</th>
            <th>{{ $t('billReport.table.alarmFrequency') }}</th>
            <th>{{ $t('billReport.table.stayMinutes') }}</th>
            <th>{{ $t('billReport.table.holdMinutes') }}</th>
            <th>{{ $t('billReport.table.route') }}</th>
            <th>{{ $t('billReport.table.score') }}</th>
            <th>{{ $t('billReport.table.level') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in report.areas" :key="`pdf-${item.areaId}`">
            <td>{{ item.displayName }}</td>
            <td>{{ areaTypeLabel(item.areaType) }}</td>
            <td>{{ item.mapNames || $t('base.noData') }}</td>
            <td>{{ formatNumber(item.peopleDensity, 2) }}</td>
            <td>{{ formatNumber(item.materialDensity, 2) }}</td>
            <td>{{ alarmCountText(item) }}</td>
            <td>{{ alarmAverageText(item) }}</td>
            <td>{{ item.stayMinutes }}</td>
            <td>{{ item.holdMinutes }}</td>
            <td>{{ item.routeCount }}</td>
            <td>{{ item.hotspotScore }}</td>
            <td>{{ $t(`billReport.level.${item.levelKey}`) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataAnalysisPage',
  data() {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

    return {
      loading: false,
      initialized: false,
      filters: {
        mapId: null,
        dateRange: [start, end]
      },
      report: {
        generatedAt: 0,
        start: 0,
        end: 0,
        areas: [],
        routes: [],
        trends: []
      }
    };
  },
  computed: {
    isJapanese() {
      return String(this.$i18n.locale || '').startsWith('ja');
    },
    pageSubtitle() {
      return this.$t('billReport.subtitle');
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
    detailCountText() {
      return this.localizedText(
        `${this.report.areas.length} 个区域`,
        `${this.report.areas.length} エリア`
      );
    },
    rangeHours() {
      const [start, end] = this.filters.dateRange || [];
      if (!start || !end) return 1;
      return Math.max((new Date(end).getTime() - new Date(start).getTime()) / 3600000, 1);
    },
    rangeDays() {
      return Math.max(this.rangeHours / 24, 1 / 24);
    },
    alarmAverageMode() {
      return this.rangeHours >= 48 ? 'day' : 'hour';
    },
    hotspotRanking() {
      return [...this.report.areas]
        .sort((a, b) => Number(b.hotspotScore || 0) - Number(a.hotspotScore || 0))
        .slice(0, 6);
    },
    alarmRanking() {
      return [...this.report.areas]
        .filter((item) => Number(item.alarmCount || 0) > 0)
        .sort((a, b) => Number(b.alarmCount || 0) - Number(a.alarmCount || 0))
        .slice(0, 6);
    },
    stayRanking() {
      return [...this.report.areas]
        .filter((item) => this.stayHoldTotal(item) > 0)
        .sort((a, b) => this.stayHoldTotal(b) - this.stayHoldTotal(a))
        .slice(0, 6);
    },
    routeRanking() {
      return [...this.report.routes]
        .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
        .slice(0, 6);
    },
    summaryCards() {
      const hotspot = this.hotspotRanking[0] || null;
      const peoplePeak = this.topAreaBy((item) => Number(item.peopleDensity || 0));
      const materialPeak = this.topAreaBy((item) => Number(item.materialDensity || 0));
      const alarmPeak = this.alarmRanking[0] || null;
      const stayPeak = this.stayRanking[0] || null;
      const routePeak = this.routeRanking[0] || null;

      return [
        {
          key: 'hotspot',
          label: this.localizedText('热点区域', 'ホットスポット'),
          value: hotspot ? hotspot.hotspotScore : '--',
          desc: hotspot ? hotspot.displayName : this.$t('billReport.text.none')
        },
        {
          key: 'people',
          label: this.$t('billReport.summary.peoplePeak'),
          value: peoplePeak ? this.formatNumber(peoplePeak.peopleDensity, 2) : '--',
          desc: peoplePeak ? peoplePeak.displayName : this.$t('billReport.text.none')
        },
        {
          key: 'material',
          label: this.$t('billReport.summary.materialPeak'),
          value: materialPeak ? this.formatNumber(materialPeak.materialDensity, 2) : '--',
          desc: materialPeak ? materialPeak.displayName : this.$t('billReport.text.none')
        },
        {
          key: 'alarm',
          label: this.$t('billReport.summary.alarmFrequency'),
          value: alarmPeak ? this.alarmCountText(alarmPeak) : '--',
          desc: alarmPeak
            ? `${alarmPeak.displayName} / ${this.alarmAverageText(alarmPeak)}`
            : this.$t('billReport.text.none')
        },
        {
          key: 'stay',
          label: this.$t('billReport.summary.stayHoldPeak'),
          value: stayPeak ? stayPeak.stayMinutes + stayPeak.holdMinutes : '--',
          desc: stayPeak ? stayPeak.displayName : this.$t('billReport.text.none')
        },
        {
          key: 'route',
          label: this.localizedText('活动 / 搬送路线', '活動 / 搬送ルート'),
          value: routePeak ? routePeak.count : '--',
          desc: routePeak
            ? `${routePeak.startDisplayName} -> ${routePeak.endDisplayName}`
            : this.$t('billReport.text.none')
        }
      ];
    },
    tableColumns() {
      return [
        {
          title: this.$t('billReport.table.area'),
          minWidth: 160,
          render: (h, params) => h('span', params.row.displayName || params.row.objectName)
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
          title: this.$t('billReport.table.map'),
          minWidth: 160,
          render: (h, params) => h('span', params.row.mapNames || this.$t('base.noData'))
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
          title: this.$t('billReport.table.alarmCount'),
          minWidth: 100,
          align: 'center',
          render: (h, params) => h('span', this.alarmCountText(params.row))
        },
        {
          title: this.$t('billReport.table.alarmFrequency'),
          minWidth: 140,
          align: 'center',
          render: (h, params) => h('span', this.alarmAverageText(params.row))
        },
        {
          title: this.$t('billReport.table.stayMinutes'),
          minWidth: 110,
          align: 'center',
          key: 'stayMinutes'
        },
        {
          title: this.$t('billReport.table.holdMinutes'),
          minWidth: 110,
          align: 'center',
          key: 'holdMinutes'
        },
        {
          title: this.$t('billReport.table.route'),
          minWidth: 110,
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
  methods: {
    localizedText(zhText, jaText) {
      return this.isJapanese ? jaText : zhText;
    },
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

        const areas = (Array.isArray(res.areas) ? res.areas : []).map((item, index) => ({
          ...item,
          displayName: this.buildAreaDisplayName(item, index + 1)
        }));
        const areaNameMap = areas.reduce((result, item) => {
          result[item.areaId] = item.displayName;
          return result;
        }, {});
        const routes = (Array.isArray(res.routes) ? res.routes : []).map((item, index) => ({
          ...item,
          startDisplayName: areaNameMap[item.startAreaId] || this.buildRouteDisplayName(item.startName, item.startAreaId, index + 1),
          endDisplayName: areaNameMap[item.endAreaId] || this.buildRouteDisplayName(item.endName, item.endAreaId, index + 1)
        }));

        this.report = {
          generatedAt: res.generatedAt || Date.now(),
          start: res.start || this.$pub.slConvertTimestamp(start),
          end: res.end || this.$pub.slConvertTimestamp(end),
          areas,
          routes,
          trends: Array.isArray(res.trends) ? res.trends : []
        };
      } catch (error) {
        this.$Message.error(error && error.msg ? error.msg : this.$t('base.optionFail'));
      } finally {
        this.loading = false;
      }
    },
    topAreaBy(getter) {
      return [...this.report.areas].sort((a, b) => getter(b) - getter(a))[0] || null;
    },
    isPlaceholderAreaName(name) {
      const text = String(name || '').trim();
      return !text || /^tt$/i.test(text);
    },
    buildAreaDisplayName(item, index) {
      const rawName = String((item && item.objectName) || '').trim();
      if (!this.isPlaceholderAreaName(rawName)) {
        return rawName;
      }

      const typeLabel = this.areaTypeLabel(item && item.areaType);
      return `${typeLabel} ${this.formatRank(index)}`;
    },
    buildRouteDisplayName(name, areaId, index) {
      const rawName = String(name || '').trim();
      if (!this.isPlaceholderAreaName(rawName)) {
        return rawName;
      }

      const label = this.localizedText('区域', 'エリア');
      const suffix = areaId != null ? areaId : this.formatRank(index);
      return `${label} ${suffix}`;
    },
    alarmCountValue(item) {
      return Number(item.alarmCount || 0);
    },
    alarmCountText(item) {
      return `${this.alarmCountValue(item)} ${this.$t('billReport.text.alarmUnit')}`;
    },
    alarmAverage(item) {
      const divisor = this.alarmAverageMode === 'day' ? this.rangeDays : this.rangeHours;
      return (this.alarmCountValue(item) / divisor) || 0;
    },
    alarmAverageText(item) {
      const unitKey = this.alarmAverageMode === 'day' ? 'alarmRateDayUnit' : 'alarmRateUnit';
      return `${this.localizedText('平均', '平均')} ${this.formatNumber(this.alarmAverage(item), 2)} ${this.$t(
        `billReport.text.${unitKey}`
      )}`;
    },
    stayHoldTotal(item) {
      return Number(item.stayMinutes || 0) + Number(item.holdMinutes || 0);
    },
    stayHoldText(item) {
      return `${Number(item.stayMinutes || 0)} / ${Number(item.holdMinutes || 0)} min`;
    },
    scoreBarWidth(item) {
      const max = Math.max(...this.hotspotRanking.map((current) => Number(current.hotspotScore || 0)), 1);
      return Math.max((Number(item.hotspotScore || 0) / max) * 100, 8);
    },
    alarmBarWidth(item) {
      const max = Math.max(...this.alarmRanking.map((current) => this.alarmCountValue(current)), 1);
      return Math.max((this.alarmCountValue(item) / max) * 100, 8);
    },
    stayBarWidth(item) {
      const max = Math.max(...this.stayRanking.map((current) => this.stayHoldTotal(current)), 1);
      return Math.max((this.stayHoldTotal(item) / max) * 100, 8);
    },
    areaMetricChips(item) {
      return [
        {
          key: 'people',
          label: this.localizedText('人员', '人員'),
          value: this.formatNumber(item.peopleDensity, 2)
        },
        {
          key: 'material',
          label: this.localizedText('物料', '物料'),
          value: this.formatNumber(item.materialDensity, 2)
        },
        {
          key: 'alarm',
          label: this.localizedText('告警', 'アラーム'),
          value: this.alarmCountText(item)
        },
        {
          key: 'stay',
          label: this.localizedText('滞留/放置', '滞留/放置'),
          value: this.stayHoldText(item)
        },
        {
          key: 'route',
          label: this.localizedText('路线', 'ルート'),
          value: `${Number(item.routeCount || 0)}`
        }
      ];
    },
    hotspotDrivers(item) {
      return [
        { label: this.$t('billReport.analysis.people'), value: Number(item.peopleDensity || 0) },
        { label: this.$t('billReport.analysis.material'), value: Number(item.materialDensity || 0) },
        { label: this.$t('billReport.analysis.alarm'), value: this.alarmCountValue(item) },
        { label: this.$t('billReport.analysis.stay'), value: this.stayHoldTotal(item) },
        { label: this.$t('billReport.analysis.route'), value: Number(item.routeCount || 0) }
      ]
        .sort((a, b) => b.value - a.value)
        .slice(0, 2)
        .map((entry) => entry.label);
    },
    hotspotReasonText(item) {
      return `${this.localizedText('主要项: ', '主な項目: ')}${this.hotspotDrivers(item).join(' / ')}`;
    },
    async handleExportPdf() {
      if (!this.report.areas.length) {
        this.$Message.warning(this.$t('base.noDataText'));
        return;
      }

      const [{ default: html2canvas }, pdfModule] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const PdfConstructor = pdfModule.jsPDF || (pdfModule.default && pdfModule.default.jsPDF) || pdfModule.default;
      const element = this.$refs.pdfSheet;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth
      });
      const image = canvas.toDataURL('image/png');
      const pdf = new PdfConstructor('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pdfWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      let remaining = imageHeight;
      let position = 0;

      pdf.addImage(image, 'PNG', 0, position, imageWidth, imageHeight);
      remaining -= pdfHeight;

      while (remaining > 0) {
        position = remaining - imageHeight;
        pdf.addPage();
        pdf.addImage(image, 'PNG', 0, position, imageWidth, imageHeight);
        remaining -= pdfHeight;
      }

      pdf.save(`${this.exportBaseName()}.pdf`);
      this.$Message.success(this.$t('base.optionSuccess'));
    },
    async handleExportExcel() {
      if (!this.report.areas.length) {
        this.$Message.warning(this.$t('base.noDataText'));
        return;
      }

      const XLSX = await import('xlsx');
      const rows = this.report.areas.map((item) => ({
        [this.$t('billReport.table.area')]: item.displayName || item.objectName,
        [this.$t('billReport.table.type')]: this.areaTypeLabel(item.areaType),
        [this.$t('billReport.table.map')]: item.mapNames || this.$t('base.noData'),
        [this.$t('billReport.table.peopleDensity')]: this.formatNumber(item.peopleDensity, 2),
        [this.$t('billReport.table.materialDensity')]: this.formatNumber(item.materialDensity, 2),
        [this.$t('billReport.table.alarmCount')]: this.alarmCountText(item),
        [this.$t('billReport.table.alarmFrequency')]: this.alarmAverageText(item),
        [this.$t('billReport.table.stayMinutes')]: item.stayMinutes,
        [this.$t('billReport.table.holdMinutes')]: item.holdMinutes,
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
    areaTypeLabel(type) {
      return this.$t(`billReport.type.${type || 'general'}`);
    },
    areaTypeColor(type) {
      if (type === 'goods') return 'blue';
      if (type === 'passage') return 'cyan';
      return 'default';
    },
    levelColor(level) {
      if (level === 'high') return 'red';
      if (level === 'medium') return 'orange';
      return 'green';
    },
    formatRank(index) {
      return index < 10 ? `0${index}` : `${index}`;
    },
    formatNumber(value, digits = 0) {
      const numeric = Number(value);
      return (Number.isFinite(numeric) ? numeric : 0).toFixed(digits);
    }
  }
};
</script>

<style scoped lang="less">
.data-analysis-page {
  position: relative;
}

.toolbar-card,
.surface-card {
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(20, 42, 74, 0.08);
}

.toolbar-card {
  margin-bottom: 14px;
}

.toolbar-card ::v-deep .ivu-card-body,
.surface-card ::v-deep .ivu-card-body {
  padding: 16px;
}

.toolbar-card ::v-deep .ivu-btn,
.surface-card ::v-deep .ivu-btn {
  border-radius: 6px;
}

.toolbar-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.title-block {
  flex: 1 1 360px;
  min-width: 0;
}

.page-title {
  color: #1f3450;
  font-size: 28px;
  line-height: 1.12;
}

.page-subtitle {
  max-width: 760px;
  margin-top: 8px;
  color: #60758f;
  line-height: 1.7;
}

.toolbar-controls {
  display: grid;
  grid-template-columns: 220px 360px auto;
  gap: 10px;
  align-items: end;
  flex: 0 0 auto;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  color: #60758f;
  font-size: 12px;
  font-weight: 700;
}

.range-picker {
  width: 100%;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  color: #6a809b;
  font-size: 12px;
  line-height: 1.5;
  flex-wrap: wrap;
}

.meta-divider {
  width: 1px;
  height: 12px;
  background: #d8e2ef;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.summary-card {
  min-height: 116px;
  padding: 14px;
  border: 1px solid #e4edf7;
  border-radius: 8px;
  background: #fff;
}

.summary-label {
  color: #6a809b;
  font-size: 12px;
  line-height: 1.5;
}

.summary-value {
  margin-top: 10px;
  color: #1f3450;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.15;
  word-break: break-word;
}

.summary-desc {
  margin-top: 8px;
  color: #60758f;
  line-height: 1.6;
  word-break: break-word;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.92fr);
  gap: 14px;
  margin-bottom: 14px;
}

.side-grid {
  display: grid;
  gap: 12px;
  align-content: start;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  color: #1f3450;
  font-size: 16px;
  font-weight: 700;
}

.panel-tip {
  margin-top: 4px;
  color: #6a809b;
  font-size: 12px;
  line-height: 1.6;
}

.area-list,
.metric-list,
.route-list {
  display: grid;
  gap: 12px;
}

.area-item,
.metric-item,
.route-item {
  padding: 14px;
  border: 1px solid #e4edf7;
  border-radius: 8px;
  background: #fbfdff;
}

.area-item-head,
.metric-item-head,
.route-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.area-main {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.area-rank,
.route-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border-radius: 6px;
  background: #eef4ff;
  color: #2f65e9;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.area-copy {
  min-width: 0;
}

.area-name,
.metric-name,
.route-path {
  color: #1f3450;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
}

.area-meta,
.metric-foot {
  margin-top: 4px;
  color: #6a809b;
  font-size: 12px;
  line-height: 1.6;
}

.score-box {
  min-width: 88px;
  text-align: right;
}

.score-label {
  display: block;
  color: #6a809b;
  font-size: 12px;
}

.score-value {
  display: block;
  margin-top: 4px;
  color: #1f3450;
  font-size: 24px;
  line-height: 1.1;
}

.metric-bar {
  height: 8px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e1eaf6;
}

.metric-bar-fill {
  height: 100%;
  border-radius: inherit;
}

.score-fill {
  background: linear-gradient(90deg, #2f65e9 0%, #28b897 100%);
}

.danger-fill {
  background: linear-gradient(90deg, #ff8e6b 0%, #ff5d5d 100%);
}

.stay-fill {
  background: linear-gradient(90deg, #f5b94b 0%, #ff8e3c 100%);
}

.metric-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.metric-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid #e4edf7;
  border-radius: 6px;
  background: #fff;
  color: #60758f;
  font-size: 12px;
}

.metric-chip strong {
  color: #1f3450;
  font-weight: 700;
}

.area-reason {
  margin-top: 10px;
  color: #6a809b;
  line-height: 1.6;
}

.metric-value,
.route-count {
  color: #1f3450;
  font-weight: 700;
}

.metric-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.route-path {
  margin-top: 10px;
}

.table-panel {
  margin-bottom: 12px;
}

.pdf-sheet {
  position: fixed;
  top: 0;
  left: -10000px;
  width: 1120px;
  padding: 24px;
  background: #fff;
}

.pdf-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid #dce5f1;
}

.pdf-title {
  color: #1f3450;
  font-size: 28px;
  font-weight: 700;
}

.pdf-subtitle {
  max-width: 700px;
  margin-top: 10px;
  color: #60758f;
  line-height: 1.7;
}

.pdf-meta {
  color: #60758f;
  font-size: 13px;
  line-height: 1.8;
}

.pdf-summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
  margin-bottom: 20px;
}

.pdf-summary-card {
  padding: 12px;
  border: 1px solid #e4edf7;
  border-radius: 8px;
  background: #f8fbff;
}

.pdf-summary-label {
  color: #6a809b;
  font-size: 12px;
}

.pdf-summary-value {
  margin-top: 8px;
  color: #1f3450;
  font-size: 20px;
  font-weight: 700;
}

.pdf-summary-desc {
  margin-top: 6px;
  color: #60758f;
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

@media (max-width: 1600px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1380px) {
  .toolbar-row,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-row {
    display: grid;
  }

  .toolbar-controls {
    grid-template-columns: minmax(220px, 0.8fr) minmax(320px, 1fr) auto;
  }
}

@media (max-width: 1080px) {
  .toolbar-controls,
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .toolbar-controls,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .area-item-head,
  .metric-item-head,
  .route-head {
    flex-direction: column;
  }

  .score-box {
    text-align: left;
  }
}
</style>
