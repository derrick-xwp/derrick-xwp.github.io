/**
 * Method Landscape — interactive charts (ECharts) for embodied training pipeline survey.
 */
(function () {
  'use strict';

  var L = window.EmbodiedMethodLandscape;
  if (!L) return;

  var RADAR_COLORS = [
    '#7ecbff', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#f97316', '#22d3ee', '#ef4444',
  ];

  var FILTER_ARR_MAP = {
    platform: 'platformFamilies',
    type: 'methodTypes',
    level: 'completenessLevels',
    compute: 'computeLevels',
  };

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function defaultState() {
    return {
      search: '',
      platformFamilies: [],
      methodTypes: [],
      completenessLevels: [],
      computeLevels: [],
      minAvg: 0,
      minCompat: 1,
      viewMode: 'radar',
      radarSelected: L.DEFAULT_RADAR_IDS.slice(),
      detailId: null,
      heatmapSort: 'avg',
      heatmapSortAsc: false,
      heatmapHiddenCols: {},
      clusterShowFamilyLabels: true,
      clusterShowNames: false,
      refSortKey: 'shortName',
      refSortAsc: true,
      radarOnlyFiltered: false,
    };
  }

  function filterMethods(state) {
    var q = (state.search || '').trim().toLowerCase();
    return L.embodiedMethods.filter(function (m) {
      if (q) {
        var hay = [
          m.name, m.shortName, m.type, m.platformFamily,
          m.platforms.join(' '), m.assetFormats.join(' '), m.role, m.citation,
          m.completenessLevel, m.compatibilityLabel, m.computeLabel, m.hardware,
        ].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (state.platformFamilies.length && state.platformFamilies.indexOf(m.platformFamily) === -1) return false;
      if (state.methodTypes.length && state.methodTypes.indexOf(m.type) === -1) return false;
      if (state.completenessLevels.length && state.completenessLevels.indexOf(m.completenessLevel) === -1) return false;
      if (state.computeLevels.length && state.computeLevels.indexOf(m.computeLabel) === -1) return false;
      if (L.getAverageCompleteness(m) < state.minAvg - 0.001) return false;
      if (m.compatibilityScore < state.minCompat) return false;
      return true;
    });
  }

  function clusterPosition(method, idxInFamily) {
    var center = L.platformCenters[method.platformFamily] || { x: 50, y: 50 };
    var angle = ((idxInFamily * 137.508) % 360) * Math.PI / 180;
    var r = 2.5 + (idxInFamily % 5) * 1.8;
    return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r };
  }

  function buildClusterPositions(methods) {
    var counts = {};
    var positions = {};
    methods.forEach(function (m) {
      var c = counts[m.platformFamily] || 0;
      positions[m.id] = clusterPosition(m, c);
      counts[m.platformFamily] = c + 1;
    });
    return positions;
  }

  function methodTooltipHtml(m, dimKey, dimScore) {
    var avg = L.getAverageCompleteness(m).toFixed(2);
    var dimLine = '';
    if (dimKey != null) {
      var dim = L.DIMENSIONS.filter(function (d) { return d.key === dimKey; })[0];
      if (dim) {
        dimLine =
          '<br/>当前维度：<strong>' + esc(dim.label) + '</strong> = ' + dimScore +
          '<br/><span style="opacity:.85;font-size:12px;">' + esc(dim.desc) + '</span>';
      }
    }
    return (
      '<div class="ml-tooltip">' +
      '<strong>' + esc(m.shortName) + '</strong><br/>' +
      '平台族：' + esc(m.platformFamily) + '<br/>' +
      '平均完整度：' + avg + ' / 5<br/>' +
      '兼容度：' + esc(m.compatibilityLabel) + ' (' + m.compatibilityScore + ')<br/>' +
      '算力门槛：' + esc(m.computeLabel) +
      dimLine +
      '</div>'
    );
  }

  function renderConceptCards() {
    return (
      '<div class="ml-concept-cards">' +
      '<article class="ml-concept-card"><h4>完整性 Completeness</h4>' +
      '<p>回答「这篇论文走到了训练链条的哪一步」：从 Task、World、Sim、Reward、Data、Policy 到 Real Transfer。</p></article>' +
      '<article class="ml-concept-card"><h4>兼容度 Compatibility</h4>' +
      '<p>回答「它能接到哪里」：是否绑定 Isaac / SAPIEN / MuJoCo / AI2-THOR，还是能导出 URDF / USD / MJCF 等标准格式。</p></article>' +
      '<article class="ml-concept-card"><h4>算力门槛 Compute</h4>' +
      '<p>回答「复现成本有多高」：单机可跑、需要高端 GPU，还是多卡服务器级数据生成。</p></article>' +
      '</div>'
    );
  }

  function renderFilterPanel(state) {
    var pfChips = L.PLATFORM_FAMILIES.map(function (pf) {
      var on = state.platformFamilies.indexOf(pf) !== -1;
      return (
        '<label class="ml-chip' + (on ? ' is-on' : '') + '" style="--ml-chip-color:' + esc(L.platformColors[pf]) + '">' +
        '<input type="checkbox" data-filter="platform" value="' + esc(pf) + '"' + (on ? ' checked' : '') + ' />' +
        '<span>' + esc(pf) + '</span></label>'
      );
    }).join('');

    var mtChips = L.METHOD_TYPES.map(function (t) {
      var on = state.methodTypes.indexOf(t) !== -1;
      return (
        '<label class="ml-chip ml-chip-sm' + (on ? ' is-on' : '') + '">' +
        '<input type="checkbox" data-filter="type" value="' + esc(t) + '"' + (on ? ' checked' : '') + ' />' +
        '<span>' + esc(t) + '</span></label>'
      );
    }).join('');

    var clChips = L.COMPLETENESS_LEVELS.map(function (c) {
      var on = state.completenessLevels.indexOf(c) !== -1;
      return (
        '<label class="ml-chip ml-chip-sm' + (on ? ' is-on' : '') + '">' +
        '<input type="checkbox" data-filter="level" value="' + esc(c) + '"' + (on ? ' checked' : '') + ' />' +
        '<span>' + esc(c) + '</span></label>'
      );
    }).join('');

    var cpChips = L.COMPUTE_LEVELS.map(function (c) {
      var on = state.computeLevels.indexOf(c) !== -1;
      return (
        '<label class="ml-chip ml-chip-sm' + (on ? ' is-on' : '') + '">' +
        '<input type="checkbox" data-filter="compute" value="' + esc(c) + '"' + (on ? ' checked' : '') + ' />' +
        '<span>' + esc(c) + '</span></label>'
      );
    }).join('');

    var tabs = [
      { id: 'radar', label: 'Radar' },
      { id: 'cluster', label: 'Cluster' },
      { id: 'bubble', label: 'Bubble' },
      { id: 'heatmap', label: 'Heatmap' },
      { id: 'references', label: 'References' },
    ].map(function (t) {
      return (
        '<button type="button" class="ml-tab' + (state.viewMode === t.id ? ' is-active' : '') + '" data-view="' + t.id + '">' +
        esc(t.label) + '</button>'
      );
    }).join('');

    var pool = state.radarOnlyFiltered ? filterMethods(state) : L.embodiedMethods;
    var methodPickers = pool.map(function (m) {
      var sel = state.radarSelected.indexOf(m.id) !== -1;
      return (
        '<label class="ml-method-pick' + (sel ? ' is-on' : '') + '">' +
        '<input type="checkbox" data-radar-pick="' + esc(m.id) + '"' + (sel ? ' checked' : '') + ' />' +
        '<span>' + esc(m.shortName) + '</span></label>'
      );
    }).join('');

    var warn = state.radarSelected.length > 8
      ? '<p class="ml-radar-warn" role="status">建议最多对比 6–8 篇，避免雷达图拥挤（当前 ' + state.radarSelected.length + ' 篇）</p>'
      : '';

    return (
      '<aside class="ml-filter-panel">' +
      '<div class="ml-filter-row">' +
      '<input type="search" class="ml-search" placeholder="搜索论文 / 平台 / 类型" value="' + esc(state.search) + '" aria-label="搜索" />' +
      '<div class="ml-filter-actions">' +
      '<button type="button" class="ml-btn ml-btn-ghost" data-preset="default">默认精选</button>' +
      '<button type="button" class="ml-btn ml-btn-ghost" data-preset="real2sim">只看 Real2Sim2Real</button>' +
      '<button type="button" class="ml-btn ml-btn-ghost" data-preset="factory">只看 Asset Factory</button>' +
      '<button type="button" class="ml-btn ml-btn-ghost" data-preset="policy">只看 Policy-Ready</button>' +
      '<button type="button" class="ml-btn ml-btn-ghost" data-preset="compat">只看高兼容</button>' +
      '<button type="button" class="ml-btn ml-btn-ghost" data-preset="compute">只看高算力</button>' +
      '<button type="button" class="ml-btn ml-btn-reset" data-action="reset">Reset Filters</button>' +
      '</div></div>' +
      '<div class="ml-filter-group"><span class="ml-filter-label">平台族</span><div class="ml-chip-row">' + pfChips + '</div></div>' +
      '<div class="ml-filter-group"><span class="ml-filter-label">方法类型</span><div class="ml-chip-row ml-chip-wrap">' + mtChips + '</div></div>' +
      '<div class="ml-filter-group"><span class="ml-filter-label">完整度等级</span><div class="ml-chip-row ml-chip-wrap">' + clChips + '</div></div>' +
      '<div class="ml-filter-group"><span class="ml-filter-label">算力门槛</span><div class="ml-chip-row">' + cpChips + '</div></div>' +
      '<div class="ml-slider-row">' +
      '<label>最低平均完整度 <output class="ml-slider-val" data-out="minAvg">' + state.minAvg.toFixed(1) + '</output></label>' +
      '<input type="range" min="0" max="5" step="0.1" value="' + state.minAvg + '" data-slider="minAvg" />' +
      '<label>最低兼容度 <output class="ml-slider-val" data-out="minCompat">' + state.minCompat + '</output></label>' +
      '<input type="range" min="1" max="5" step="1" value="' + state.minCompat + '" data-slider="minCompat" />' +
      '</div>' +
      '<div class="ml-view-tabs" role="tablist">' + tabs + '</div>' +
      '<div class="ml-view-extra" id="ml-view-extra">' +
      (state.viewMode === 'radar'
        ? '<div class="ml-radar-picks"><span class="ml-filter-label">雷达图对比选择</span>' +
          '<label class="ml-toggle"><input type="checkbox" data-radar-filtered"' + (state.radarOnlyFiltered ? ' checked' : '') + ' />只看当前筛选结果</label>' +
          warn +
          '<div class="ml-chip-row ml-chip-wrap">' + methodPickers + '</div></div>'
        : '') +
      (state.viewMode === 'cluster'
        ? '<div class="ml-cluster-toggles">' +
          '<label class="ml-toggle"><input type="checkbox" data-cluster-labels"' + (state.clusterShowFamilyLabels ? ' checked' : '') + ' />显示平台族标签</label>' +
          '<label class="ml-toggle"><input type="checkbox" data-cluster-names"' + (state.clusterShowNames ? ' checked' : '') + ' />显示论文名称</label>' +
          '</div>'
        : '') +
      (state.viewMode === 'heatmap'
        ? '<div class="ml-heatmap-controls">' +
          '<label>排序 <select data-heatmap-sort>' +
          '<option value="avg"' + (state.heatmapSort === 'avg' ? ' selected' : '') + '>按平均完整度</option>' +
          L.DIMENSIONS.map(function (d) {
            return '<option value="' + d.key + '"' + (state.heatmapSort === d.key ? ' selected' : '') + '>按 ' + esc(d.short) + '</option>';
          }).join('') +
          '</select></label>' +
          '<label class="ml-toggle"><input type="checkbox" data-heatmap-sort-asc"' + (state.heatmapSortAsc ? ' checked' : '') + ' />升序排列</label>' +
          '</div>'
        : '') +
      '</div>' +
      '</aside>'
    );
  }

  function renderChartArea(state, filtered) {
    var titles = {
      radar: { t: '方法完整度雷达图', s: '比较不同论文在 Task → World / Asset → Sim-Ready → Reward / Program → Data → Policy / Benchmark → Real Transfer 七个环节上的覆盖程度。' },
      cluster: { t: '平台族聚类图', s: '按实现平台生态聚类，观察方法是更偏 Isaac / Omniverse、SAPIEN / ManiSkill、MuJoCo、AI2-THOR，还是跨平台资产工厂。' },
      bubble: { t: '完整度 × 兼容度 × 算力', s: '横轴为平台兼容度，纵轴为全链条平均完整度；气泡大小表示算力门槛，颜色表示平台族。' },
      heatmap: { t: '完整度热力矩阵', s: '行是论文，列是七个完整度维度；用于快速识别链条缺口。' },
      references: { t: '完整引用与链接', s: '可搜索、可筛选、可排序的论文引用表。' },
    };
    var meta = titles[state.viewMode] || titles.radar;
    var chartHtml = '';
    if (filtered.length === 0 && state.viewMode !== 'radar') {
      chartHtml = '<p class="ml-empty-state">当前筛选条件下没有匹配论文，请放宽筛选或点击 Reset Filters。</p>';
    } else if (state.viewMode === 'references') {
      chartHtml = renderReferenceTable(state, filtered);
    } else {
      chartHtml =
        '<div class="ml-chart-wrap ml-chart-' + state.viewMode + '">' +
        '<div class="ml-chart" id="ml-main-chart" aria-label="' + esc(meta.t) + '"></div>' +
        (state.viewMode === 'cluster'
          ? '<p class="ml-chart-note">平台族聚类图不表示论文性能高低，而表示其工程生态相似性。距离相近的方法通常使用相近的 simulator、资产格式或训练接口。点击图例可筛选平台族。</p>'
          : '') +
        (state.viewMode === 'bubble'
          ? '<div class="ml-quadrant-legend">' +
            '<div><strong>左上</strong>：链条完整但平台绑定重，例如 Real2Sim2Real 系统。</div>' +
            '<div><strong>右上</strong>：链条完整且兼容度高，理想但当前较少。</div>' +
            '<div><strong>左下</strong>：平台绑定重且链条短，多为特定 benchmark 或内部生态。</div>' +
            '<div><strong>右下</strong>：兼容度高但链条短，多为 Asset Factory 或跨平台生产层。</div>' +
            '</div>' +
            '<p class="ml-chart-note">有些论文兼容度高但完整度不高，例如 EmbodiedGen / SceneSmith 更像可复用资产或场景生产层；有些论文完整度高但平台绑定较重，例如 RialTo / Re3Sim 更接近真实迁移闭环，但复现成本和生态依赖更高。</p>'
          : '') +
        (state.viewMode === 'heatmap'
          ? '<p class="ml-chart-note">热力矩阵用于快速识别论文的链条缺口。例如 EmbodiedGen 在 World / Asset 与 Sim-Ready 上很强，但 Reward / Program 与 Real Transfer 较弱；RialTo 与 Re3Sim 在 Real Transfer 上强，但平台绑定和算力成本较高。</p>'
          : '') +
        '</div>';
    }
    return (
      '<div class="ml-chart-card">' +
      '<header class="ml-chart-head"><h3>' + esc(meta.t) + '</h3><p>' + esc(meta.s) + '</p></header>' +
      chartHtml +
      '</div>'
    );
  }

  function sortValue(method, key) {
    if (key === 'avg') return L.getAverageCompleteness(method);
    if (key === 'platforms') return method.platforms.join(', ');
    return method[key];
  }

  function renderReferenceTable(state, filtered) {
    if (!filtered.length) {
      return '<p class="ml-empty-state">当前筛选条件下没有匹配论文。</p>';
    }
    var sorted = filtered.slice().sort(function (a, b) {
      var va = sortValue(a, state.refSortKey);
      var vb = sortValue(b, state.refSortKey);
      if (va == null) va = '';
      if (vb == null) vb = '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return state.refSortAsc ? va - vb : vb - va;
      }
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      if (va < vb) return state.refSortAsc ? -1 : 1;
      if (va > vb) return state.refSortAsc ? 1 : -1;
      return 0;
    });

    var cols = [
      { key: 'shortName', label: '论文' },
      { key: 'year', label: '年份' },
      { key: 'type', label: '类型' },
      { key: 'platformFamily', label: '平台族' },
      { key: 'platforms', label: '具体平台' },
      { key: 'completenessLevel', label: '完整度等级' },
      { key: 'avg', label: '平均完整度' },
      { key: 'compatibilityLabel', label: '兼容度' },
      { key: 'computeLabel', label: '算力门槛' },
      { key: 'hardware', label: '硬件信息' },
      { key: 'citation', label: '完整引用' },
      { key: 'url', label: '链接' },
    ];

    var thead = cols.map(function (c) {
      var arrow = state.refSortKey === c.key ? (state.refSortAsc ? ' ↑' : ' ↓') : '';
      return '<th scope="col" data-sort="' + c.key + '" class="ml-sortable">' + esc(c.label) + arrow + '</th>';
    }).join('');

    var tbody = sorted.map(function (m) {
      var avg = L.getAverageCompleteness(m).toFixed(2);
      return (
        '<tr data-method-id="' + esc(m.id) + '" tabindex="0">' +
        '<td><strong>' + esc(m.shortName) + '</strong></td>' +
        '<td>' + esc(m.year) + '</td>' +
        '<td><span class="ml-badge ml-badge-type">' + esc(m.type) + '</span></td>' +
        '<td><span class="ml-badge ml-badge-pf" style="--ml-pf:' + esc(L.platformColors[m.platformFamily]) + '">' + esc(m.platformFamily) + '</span></td>' +
        '<td>' + esc(m.platforms.join(', ')) + '</td>' +
        '<td>' + esc(m.completenessLevel) + '</td>' +
        '<td>' + avg + '</td>' +
        '<td>' + esc(m.compatibilityLabel) + '</td>' +
        '<td>' + esc(m.computeLabel) + '</td>' +
        '<td class="ml-cell-muted">' + esc(m.hardware) + '</td>' +
        '<td class="ml-cell-cite">' + esc(m.citation) + '</td>' +
        '<td><a href="' + esc(m.url) + '" target="_blank" rel="noreferrer" onclick="event.stopPropagation()">打开</a></td>' +
        '</tr>'
      );
    }).join('');

    return (
      '<div class="ml-table-wrap overflow-x-auto">' +
      '<table class="ml-ref-table"><thead><tr>' + thead + '</tr></thead><tbody>' + tbody + '</tbody></table>' +
      '</div>'
    );
  }

  function renderDetailDrawer(state) {
    if (!state.detailId) {
      return '<aside class="ml-drawer ml-drawer-closed" aria-hidden="true"></aside>';
    }
    var m = L.getMethodById(state.detailId);
    if (!m) return '';
    var inRadar = state.radarSelected.indexOf(m.id) !== -1;
    var scoreRows = L.DIMENSIONS.map(function (d) {
      return (
        '<li><span class="ml-score-dim">' + esc(d.short) + '</span>' +
        '<span class="ml-score-bar"><span style="width:' + (m.scores[d.key] / 5 * 100) + '%;background:' + L.SCORE_COLORS[m.scores[d.key]] + '"></span></span>' +
        '<span class="ml-score-val">' + m.scores[d.key] + '</span></li>'
      );
    }).join('');

    return (
      '<aside class="ml-drawer ml-drawer-open" aria-labelledby="ml-drawer-title">' +
      '<div class="ml-drawer-backdrop" data-action="close-drawer"></div>' +
      '<div class="ml-drawer-panel">' +
      '<button type="button" class="ml-drawer-close" data-action="close-drawer" aria-label="关闭">×</button>' +
      '<header class="ml-drawer-head">' +
      '<h3 id="ml-drawer-title">' + esc(m.shortName) + '</h3>' +
      '<p class="ml-drawer-sub">' + esc(m.name) + '</p>' +
      '<div class="ml-drawer-badges">' +
      '<span class="ml-badge ml-badge-type">' + esc(m.type) + '</span>' +
      '<span class="ml-badge ml-badge-pf" style="--ml-pf:' + esc(L.platformColors[m.platformFamily]) + '">' + esc(m.platformFamily) + '</span>' +
      '<span class="ml-badge">' + esc(m.completenessLevel) + '</span>' +
      '<span class="ml-badge">' + esc(m.compatibilityLabel) + '</span>' +
      '<span class="ml-badge">' + esc(m.computeLabel) + '</span>' +
      '</div></header>' +
      '<div class="ml-drawer-body">' +
      '<section><h4>一句话定位</h4><p>' + esc(m.role) + '</p></section>' +
      '<section><h4>平台与格式</h4><p><strong>平台：</strong>' + esc(m.platforms.join(' · ')) + '</p>' +
      '<p><strong>资产格式：</strong>' + esc(m.assetFormats.join(' · ')) + '</p></section>' +
      '<section><h4>完整度评分</h4><ul class="ml-score-list">' + scoreRows + '</ul>' +
      '<div class="ml-mini-radar" id="ml-detail-radar"></div></section>' +
      '<section><h4>优势</h4><p>' + esc(m.strength) + '</p></section>' +
      '<section><h4>短板</h4><p>' + esc(m.limitation) + '</p></section>' +
      '<section><h4>工程现实</h4><p>兼容度：' + m.compatibilityScore + ' / 5（' + esc(m.compatibilityLabel) + '）</p>' +
      '<p>算力：' + m.computeScore + ' / 5（' + esc(m.computeLabel) + '）</p>' +
      '<p class="ml-cell-muted">' + esc(m.hardware) + '</p></section>' +
      '<section><h4>引用</h4><p class="ml-cell-cite">' + esc(m.citation) + '</p>' +
      (m.notes ? '<p class="ml-cell-muted">' + esc(m.notes) + '</p>' : '') +
      '</section></div>' +
      '<footer class="ml-drawer-foot">' +
      '<a class="ml-btn ml-btn-primary" href="' + esc(m.url) + '" target="_blank" rel="noreferrer">打开论文链接</a>' +
      '<button type="button" class="ml-btn ml-btn-ghost" data-radar-toggle="' + esc(m.id) + '">' +
      (inRadar ? '从对比中移除' : '加入对比') + '</button>' +
      '</footer></div></aside>'
    );
  }

  function buildRadarOption(state, filtered) {
    var pool = state.radarOnlyFiltered ? filtered : L.embodiedMethods;
    var ids = state.radarSelected.filter(function (id) {
      return pool.some(function (m) { return m.id === id; });
    });
    var indicators = L.DIMENSIONS.map(function (d) {
      return { name: d.label, max: 5 };
    });
    var radarData = ids.map(function (id, i) {
      var m = L.getMethodById(id);
      if (!m) return null;
      return {
        value: L.DIMENSIONS.map(function (d) { return m.scores[d.key]; }),
        name: m.shortName,
        _methodId: m.id,
        lineStyle: { color: RADAR_COLORS[i % RADAR_COLORS.length] },
        itemStyle: { color: RADAR_COLORS[i % RADAR_COLORS.length] },
        areaStyle: { opacity: 0.07, color: RADAR_COLORS[i % RADAR_COLORS.length] },
      };
    }).filter(Boolean);

    return {
      backgroundColor: 'transparent',
      color: RADAR_COLORS,
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: function (params) {
          var m = L.getMethodById(params.data._methodId);
          if (!m) return '';
          var dimIdx = params.dimensionIndex;
          var dimKey = dimIdx != null && L.DIMENSIONS[dimIdx] ? L.DIMENSIONS[dimIdx].key : null;
          var score = dimKey ? m.scores[dimKey] : null;
          return methodTooltipHtml(m, dimKey, score);
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: '#c7d9f5', fontSize: 12 },
        data: radarData.map(function (d) { return d.name; }),
      },
      toolbox: {
        right: 12,
        top: 0,
        feature: {
          saveAsImage: { title: '导出 PNG', pixelRatio: 2, backgroundColor: '#111d38' },
        },
        iconStyle: { borderColor: '#7ecbff' },
      },
      radar: {
        center: ['50%', '48%'],
        radius: '62%',
        indicator: indicators,
        axisName: { color: '#8ba3c4', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(126,203,255,0.12)' } },
        splitArea: { areaStyle: { color: ['rgba(22,37,68,0.3)', 'rgba(22,37,68,0.15)'] } },
        axisLine: { lineStyle: { color: 'rgba(126,203,255,0.2)' } },
      },
      series: [{
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        emphasis: { lineStyle: { width: 3 } },
        data: radarData,
      }],
    };
  }

  function buildClusterOption(state, filtered) {
    var positions = buildClusterPositions(filtered);
    var seriesByFamily = {};
    filtered.forEach(function (m) {
      if (!seriesByFamily[m.platformFamily]) seriesByFamily[m.platformFamily] = [];
      var pos = positions[m.id];
      seriesByFamily[m.platformFamily].push({
        name: m.shortName,
        value: [pos.x, pos.y],
        _methodId: m.id,
        itemStyle: {
          color: L.platformColors[m.platformFamily],
          opacity: 1 - (m.computeScore - 1) * 0.12,
          borderColor: L.platformColors[m.platformFamily],
          borderWidth: m.compatibilityScore * 0.8 + 0.5,
        },
        symbolSize: 10 + L.getAverageCompleteness(m) * 4,
      });
    });

    var graphics = [];
    if (state.clusterShowFamilyLabels) {
      Object.keys(L.platformCenters).forEach(function (pf) {
        var c = L.platformCenters[pf];
        graphics.push({
          type: 'text',
          left: c.x + '%',
          top: c.y + '%',
          style: {
            text: pf.split(' / ')[0],
            fill: L.platformColors[pf],
            fontSize: 10,
            opacity: 0.55,
          },
          z: 0,
        });
      });
    }

    return {
      backgroundColor: 'transparent',
      grid: { left: 48, right: 24, top: 40, bottom: 72 },
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: function (p) {
          var m = L.getMethodById(p.data._methodId);
          return m ? methodTooltipHtml(m) : '';
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        selectedMode: false,
        textStyle: { color: '#c7d9f5', fontSize: 11 },
        data: Object.keys(seriesByFamily),
      },
      xAxis: { min: 0, max: 100, show: false },
      yAxis: { min: 0, max: 100, show: false },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
        { type: 'inside', yAxisIndex: 0, filterMode: 'none' },
      ],
      graphic: graphics,
      series: Object.keys(seriesByFamily).map(function (pf) {
        return {
          name: pf,
          type: 'scatter',
          data: seriesByFamily[pf],
          emphasis: { focus: 'series' },
          label: {
            show: state.clusterShowNames,
            formatter: '{b}',
            position: 'top',
            color: '#c7d9f5',
            fontSize: 10,
          },
        };
      }),
    };
  }

  function buildBubbleOption(state, filtered) {
    var seriesByFamily = {};
    filtered.forEach(function (m) {
      if (!seriesByFamily[m.platformFamily]) seriesByFamily[m.platformFamily] = [];
      seriesByFamily[m.platformFamily].push({
        name: m.shortName,
        value: [m.compatibilityScore, L.getAverageCompleteness(m), m.computeScore * 12],
        _methodId: m.id,
        itemStyle: { color: L.platformColors[m.platformFamily], opacity: 0.82 },
      });
    });

    return {
      backgroundColor: 'transparent',
      grid: { left: 56, right: 24, top: 48, bottom: 80 },
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: function (p) {
          var m = L.getMethodById(p.data._methodId);
          return m ? methodTooltipHtml(m) : '';
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: '#c7d9f5', fontSize: 11 },
      },
      xAxis: {
        name: '平台兼容度',
        nameLocation: 'middle',
        nameGap: 28,
        min: 0.5,
        max: 5.5,
        splitNumber: 5,
        axisLabel: { color: '#8ba3c4' },
        nameTextStyle: { color: '#c7d9f5' },
        splitLine: { lineStyle: { color: 'rgba(126,203,255,0.08)' } },
      },
      yAxis: {
        name: '全链条平均完整度',
        nameLocation: 'middle',
        nameGap: 40,
        min: 0,
        max: 5,
        axisLabel: { color: '#8ba3c4' },
        nameTextStyle: { color: '#c7d9f5' },
        splitLine: { lineStyle: { color: 'rgba(126,203,255,0.08)' } },
      },
      series: Object.keys(seriesByFamily).map(function (pf) {
        return {
          name: pf,
          type: 'scatter',
          data: seriesByFamily[pf],
          symbolSize: function (val) { return val[2]; },
        };
      }),
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', color: 'rgba(126,203,255,0.25)' },
        data: [{ xAxis: 3 }, { yAxis: 2.5 }],
      },
    };
  }

  function buildHeatmapOption(state, filtered) {
    var asc = state.heatmapSortAsc;
    var sorted = filtered.slice().sort(function (a, b) {
      if (state.heatmapSort === 'avg') {
        var d = L.getAverageCompleteness(a) - L.getAverageCompleteness(b);
        return asc ? d : -d;
      }
      var d2 = a.scores[state.heatmapSort] - b.scores[state.heatmapSort];
      return asc ? d2 : -d2;
    });

    var visibleDims = L.DIMENSIONS.filter(function (d) {
      return !state.heatmapHiddenCols[d.key];
    });

    var yLabels = sorted.map(function (m) { return m.shortName; });
    var xLabels = visibleDims.map(function (d) { return d.short; });
    var data = [];
    sorted.forEach(function (m, yi) {
      visibleDims.forEach(function (d, xi) {
        data.push([xi, yi, m.scores[d.key], m.id, d.key]);
      });
    });

    return {
      backgroundColor: 'transparent',
      grid: { left: 120, right: 24, top: 24, bottom: 64 },
      tooltip: {
        position: 'top',
        confine: true,
        formatter: function (p) {
          var m = L.getMethodById(p.data[3]);
          var dimKey = p.data[4];
          var score = p.data[2];
          return m ? methodTooltipHtml(m, dimKey, score) : '';
        },
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        splitArea: { show: true },
        axisLabel: { color: '#8ba3c4', rotate: 30, fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: yLabels,
        axisLabel: { color: '#c7d9f5', fontSize: 11 },
      },
      visualMap: {
        min: 0,
        max: 5,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: { color: L.SCORE_COLORS },
        textStyle: { color: '#8ba3c4' },
      },
      series: [{
        type: 'heatmap',
        data: data,
        label: { show: true, color: '#0c1428', fontSize: 11, formatter: function (p) { return p.data[2]; } },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.4)' } },
      }],
    };
  }

  function MethodLandscapeView(root) {
    this.root = root;
    this.state = defaultState();
    this.chart = null;
    this.detailChart = null;
    this._resizeHandler = null;
    this._searchTimer = null;
    this._ignoreLegend = false;
    this.bindDelegatedEvents();
  }

  MethodLandscapeView.prototype.getFiltered = function () {
    return filterMethods(this.state);
  };

  MethodLandscapeView.prototype.updateCount = function (filtered) {
    var el = this.root.querySelector('.ml-filter-count');
    if (el) {
      el.innerHTML = '当前筛选：<strong>' + filtered.length + '</strong> / ' + L.embodiedMethods.length + ' 篇';
    }
  };

  MethodLandscapeView.prototype.syncFilterChips = function () {
    var self = this;
    this.root.querySelectorAll('[data-filter]').forEach(function (input) {
      var kind = input.getAttribute('data-filter');
      var arrName = FILTER_ARR_MAP[kind];
      var on = self.state[arrName].indexOf(input.value) !== -1;
      input.checked = on;
      var label = input.closest('.ml-chip');
      if (label) label.classList.toggle('is-on', on);
    });
    this.root.querySelectorAll('[data-radar-pick]').forEach(function (input) {
      var on = self.state.radarSelected.indexOf(input.getAttribute('data-radar-pick')) !== -1;
      input.checked = on;
      var label = input.closest('.ml-method-pick');
      if (label) label.classList.toggle('is-on', on);
    });
  };

  MethodLandscapeView.prototype.render = function () {
    var filtered = this.getFiltered();

    this.root.innerHTML =
      renderConceptCards() +
      '<div class="ml-intro-text">' +
      '<p>全链条具身智能论文之间的差异，不只在于是否生成了场景或任务，也在于它们打通了训练链条的哪一段，以及绑定在哪类仿真平台生态中。</p>' +
      '<p>因此，这里用三个轴来组织方法图谱：① 完整性：从 Task Generation 到 Real Transfer；② 兼容度：是否跨 Isaac、SAPIEN、MuJoCo、AI2-THOR、OmniGibson 等平台复用；③ 算力门槛：复现和大规模数据生成需要多少工程资源。</p>' +
      '<p class="ml-disclaimer-inline"><strong>需要强调：</strong>这些分数不是性能排名，而是结构化阅读工具。它们帮助读者快速判断一篇论文更像资产工厂、任务生成器、数据引擎、benchmark 平台，还是 Real2Sim2Real 闭环系统。</p>' +
      '</div>' +
      '<p class="ml-filter-count">当前筛选：<strong>' + filtered.length + '</strong> / ' + L.embodiedMethods.length + ' 篇</p>' +
      '<div id="ml-filter-mount">' + renderFilterPanel(this.state) + '</div>' +
      '<div id="ml-chart-mount">' + renderChartArea(this.state, filtered) + '</div>' +
      '<div id="ml-drawer-mount">' + renderDetailDrawer(this.state) + '</div>' +
      '<p class="ml-disclaimer-footer">评分为结构完整度评分，用于阅读导航，不代表论文性能排名。</p>';

    this.renderChart(filtered);
    this.renderDetailRadar();
  };

  MethodLandscapeView.prototype.refreshViews = function () {
    var filtered = this.getFiltered();
    this.updateCount(filtered);

    var filterMount = this.root.querySelector('#ml-filter-mount');
    if (filterMount) filterMount.innerHTML = renderFilterPanel(this.state);

    var chartMount = this.root.querySelector('#ml-chart-mount');
    if (chartMount) chartMount.innerHTML = renderChartArea(this.state, filtered);

    var drawerMount = this.root.querySelector('#ml-drawer-mount');
    if (drawerMount) drawerMount.innerHTML = renderDetailDrawer(this.state);

    this.renderChart(filtered);
    this.renderDetailRadar();
  };

  MethodLandscapeView.prototype.applyPreset = function (presetId) {
    this.state = defaultState();
    if (presetId === 'real2sim') {
      this.state.methodTypes = ['Real2Sim2Real', 'Real-to-Sim Reconstruction'];
    } else if (presetId === 'factory') {
      this.state.platformFamilies = ['Multi-platform / Asset Factory', 'Drake / Multi-export'];
      this.state.methodTypes = ['Foundation Model Orchestration', 'Asset / World Factory', 'Agentic World Generation'];
    } else if (presetId === 'policy') {
      this.state.completenessLevels = ['C4 Policy-Ready', 'C5 Real-Ready'];
    } else if (presetId === 'compat') {
      this.state.minCompat = 4;
    } else if (presetId === 'compute') {
      this.state.computeLevels = ['Medium–High', 'High'];
    }
    this.refreshViews();
  };

  MethodLandscapeView.prototype.toggleFilterValue = function (kind, value, checked) {
    var arrName = FILTER_ARR_MAP[kind];
    if (!arrName) return;
    var arr = this.state[arrName].slice();
    if (checked) {
      if (arr.indexOf(value) === -1) arr.push(value);
    } else {
      arr = arr.filter(function (x) { return x !== value; });
    }
    this.state[arrName] = arr;
    this.refreshViews();
  };

  MethodLandscapeView.prototype.bindDelegatedEvents = function () {
    var self = this;
    if (this.root._mlDelegated) return;
    this.root._mlDelegated = true;

    this.root.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !self.root.contains(t)) return;

      if (t.matches('.ml-search')) {
        self.state.search = t.value;
        clearTimeout(self._searchTimer);
        self._searchTimer = setTimeout(function () {
          self.refreshViews();
        }, 180);
        return;
      }

      if (t.matches('[data-slider]')) {
        var key = t.getAttribute('data-slider');
        self.state[key] = parseFloat(t.value);
        var out = self.root.querySelector('[data-out="' + key + '"]');
        if (out) out.textContent = key === 'minAvg' ? self.state[key].toFixed(1) : String(self.state[key]);
        self.updateCount(self.getFiltered());
        self.renderChart(self.getFiltered());
        var chartMount = self.root.querySelector('#ml-chart-mount');
        if (chartMount && self.state.viewMode === 'references') {
          chartMount.innerHTML = renderChartArea(self.state, self.getFiltered());
        }
      }
    });

    this.root.addEventListener('change', function (e) {
      var t = e.target;
      if (!t || !self.root.contains(t)) return;

      if (t.matches('[data-filter]')) {
        self.toggleFilterValue(t.getAttribute('data-filter'), t.value, t.checked);
        return;
      }

      if (t.matches('[data-radar-pick]')) {
        var id = t.getAttribute('data-radar-pick');
        var arr = self.state.radarSelected.slice();
        if (t.checked) {
          if (arr.indexOf(id) === -1) arr.push(id);
        } else {
          arr = arr.filter(function (x) { return x !== id; });
        }
        self.state.radarSelected = arr;
        self.refreshViews();
        return;
      }

      if (t.matches('[data-radar-filtered]')) {
        self.state.radarOnlyFiltered = t.checked;
        self.refreshViews();
        return;
      }

      if (t.matches('[data-cluster-labels]')) {
        self.state.clusterShowFamilyLabels = t.checked;
        self.renderChart(self.getFiltered());
        return;
      }

      if (t.matches('[data-cluster-names]')) {
        self.state.clusterShowNames = t.checked;
        self.renderChart(self.getFiltered());
        return;
      }

      if (t.matches('[data-heatmap-sort]')) {
        self.state.heatmapSort = t.value;
        self.refreshViews();
        return;
      }

      if (t.matches('[data-heatmap-sort-asc]')) {
        self.state.heatmapSortAsc = t.checked;
        self.refreshViews();
      }
    });

    this.root.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !self.root.contains(t)) return;

      var viewBtn = t.closest('[data-view]');
      if (viewBtn) {
        self.state.viewMode = viewBtn.getAttribute('data-view');
        self.refreshViews();
        return;
      }

      if (t.closest('[data-action="reset"]')) {
        self.state = defaultState();
        self.refreshViews();
        return;
      }

      var presetBtn = t.closest('[data-preset]');
      if (presetBtn) {
        self.applyPreset(presetBtn.getAttribute('data-preset'));
        return;
      }

      if (t.closest('[data-action="close-drawer"]')) {
        self.state.detailId = null;
        var drawerMount = self.root.querySelector('#ml-drawer-mount');
        if (drawerMount) drawerMount.innerHTML = renderDetailDrawer(self.state);
        if (self.detailChart) {
          self.detailChart.dispose();
          self.detailChart = null;
        }
        return;
      }

      var radarToggle = t.closest('[data-radar-toggle]');
      if (radarToggle) {
        var rid = radarToggle.getAttribute('data-radar-toggle');
        var arr = self.state.radarSelected.slice();
        var idx = arr.indexOf(rid);
        if (idx === -1) arr.push(rid);
        else arr.splice(idx, 1);
        self.state.radarSelected = arr;
        self.refreshViews();
        return;
      }

      var sortTh = t.closest('.ml-ref-table [data-sort]');
      if (sortTh) {
        var key = sortTh.getAttribute('data-sort');
        if (self.state.refSortKey === key) self.state.refSortAsc = !self.state.refSortAsc;
        else {
          self.state.refSortKey = key;
          self.state.refSortAsc = true;
        }
        var chartMount = self.root.querySelector('#ml-chart-mount');
        if (chartMount) chartMount.innerHTML = renderChartArea(self.state, self.getFiltered());
        return;
      }

      var legendBtn = t.closest('.ml-chip');
      if (legendBtn && t.tagName !== 'INPUT' && legendBtn.querySelector('[data-filter]')) {
        var input = legendBtn.querySelector('[data-filter]');
        if (input) {
          input.checked = !input.checked;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }

      var row = t.closest('.ml-ref-table tbody tr');
      if (row && !t.closest('a')) {
        self.state.detailId = row.getAttribute('data-method-id');
        var dm = self.root.querySelector('#ml-drawer-mount');
        if (dm) dm.innerHTML = renderDetailDrawer(self.state);
        self.renderDetailRadar();
      }
    });

    this.root.addEventListener('keydown', function (e) {
      var row = e.target.closest && e.target.closest('.ml-ref-table tbody tr');
      if (row && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        self.state.detailId = row.getAttribute('data-method-id');
        var dm = self.root.querySelector('#ml-drawer-mount');
        if (dm) dm.innerHTML = renderDetailDrawer(self.state);
        self.renderDetailRadar();
      }
    });
  };

  MethodLandscapeView.prototype.openDetail = function (methodId) {
    this.state.detailId = methodId;
    var dm = this.root.querySelector('#ml-drawer-mount');
    if (dm) dm.innerHTML = renderDetailDrawer(this.state);
    this.renderDetailRadar();
  };

  MethodLandscapeView.prototype.renderChart = function (filtered) {
    var self = this;
    if (this.state.viewMode === 'references') return;
    if (!filtered.length) {
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
      return;
    }
    if (!window.echarts) {
      var el = this.root.querySelector('#ml-main-chart');
      if (el) el.innerHTML = '<p class="ml-error">ECharts 未加载，请检查网络或 CDN。</p>';
      return;
    }

    var chartEl = this.root.querySelector('#ml-main-chart');
    if (!chartEl) return;

    if (this.state.viewMode === 'heatmap') {
      chartEl.style.height = Math.max(500, filtered.length * 30 + 100) + 'px';
    } else {
      chartEl.style.height = '';
    }

    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
    this.chart = window.echarts.init(chartEl, null, { renderer: 'canvas' });

    var option;
    if (this.state.viewMode === 'radar') option = buildRadarOption(this.state, filtered);
    else if (this.state.viewMode === 'cluster') option = buildClusterOption(this.state, filtered);
    else if (this.state.viewMode === 'bubble') option = buildBubbleOption(this.state, filtered);
    else if (this.state.viewMode === 'heatmap') option = buildHeatmapOption(this.state, filtered);

    this.chart.setOption(option, true);

    this.chart.off('click');
    this.chart.on('click', function (params) {
      var id = null;
      if (params.data && params.data._methodId) id = params.data._methodId;
      else if (params.data && params.data[3]) id = params.data[3];
      if (id) self.openDetail(id);
    });

    this.chart.off('legendselectchanged');
    this.chart.on('legendselectchanged', function (params) {
      if (self.state.viewMode !== 'cluster' || self._ignoreLegend) return;
      var pf = params.name;
      if (!L.platformColors[pf]) return;
      self._ignoreLegend = true;
      var arr = self.state.platformFamilies.slice();
      var idx = arr.indexOf(pf);
      if (idx === -1) arr.push(pf);
      else arr.splice(idx, 1);
      self.state.platformFamilies = arr;
      self.refreshViews();
      self._ignoreLegend = false;
    });

    if (!this._resizeHandler) {
      this._resizeHandler = function () {
        if (self.chart) self.chart.resize();
        if (self.detailChart) self.detailChart.resize();
      };
      window.addEventListener('resize', this._resizeHandler);
    }
  };

  MethodLandscapeView.prototype.renderDetailRadar = function () {
    if (!this.state.detailId || !window.echarts) return;
    var el = this.root.querySelector('#ml-detail-radar');
    if (!el) return;
    var m = L.getMethodById(this.state.detailId);
    if (!m) return;

    if (this.detailChart) {
      this.detailChart.dispose();
      this.detailChart = null;
    }
    this.detailChart = window.echarts.init(el, null, { renderer: 'canvas' });
    this.detailChart.setOption({
      backgroundColor: 'transparent',
      radar: {
        indicator: L.DIMENSIONS.map(function (d) { return { name: d.short, max: 5 }; }),
        radius: '65%',
        axisName: { color: '#8ba3c4', fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(126,203,255,0.1)' } },
      },
      series: [{
        type: 'radar',
        data: [{ value: L.DIMENSIONS.map(function (d) { return m.scores[d.key]; }), name: m.shortName }],
        areaStyle: { opacity: 0.2, color: '#7ecbff' },
        lineStyle: { color: '#7ecbff' },
        itemStyle: { color: '#7ecbff' },
      }],
    });
  };

  function initMethodLandscapeView(scope) {
    var root = (scope || document).querySelector('#method-landscape-root');
    if (!root) return;
    root.setAttribute('aria-busy', 'false');

    if (window.__methodLandscapeView && window.__methodLandscapeView.root === root) {
      window.__methodLandscapeView.render();
      return;
    }

    root.setAttribute('data-ml-init', '1');
    root._mlDelegated = false;
    var view = new MethodLandscapeView(root);
    view.render();
    window.__methodLandscapeView = view;
  }

  window.initMethodLandscapeView = initMethodLandscapeView;
})();
