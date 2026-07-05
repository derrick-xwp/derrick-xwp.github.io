/**
 * Training Scene Pipeline — interactive table, flow, matrix, task example.
 */
(function () {
  'use strict';

  var D = window.PipelineMethods;
  if (!D) return;

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function defaultTableState() {
    return { filter: 'all', sortKey: 'rank', sortDir: 'asc' };
  }

  function filterMethods(state) {
    return D.METHODS.filter(function (m) {
      if (state.filter === 'mainline') return m.mainline;
      if (state.filter === 'support') return !m.mainline;
      if (state.filter === 'task-program') return m.tags.indexOf('task-program') >= 0;
      if (state.filter === 'asset-world') return m.tags.indexOf('asset-world') >= 0;
      if (state.filter === 'data-bench') return m.tags.indexOf('data-bench') >= 0;
      if (state.filter === 'real2sim') return m.tags.indexOf('real2sim') >= 0;
      return true;
    });
  }

  function sortMethods(list, state) {
    var key = state.sortKey;
    var dir = state.sortDir === 'desc' ? -1 : 1;
    return list.slice().sort(function (a, b) {
      var av = a[key];
      var bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), 'zh-CN') * dir;
    });
  }

  function renderMethodTable(root, state) {
    if (!root) return;
    var rows = sortMethods(filterMethods(state), state);
    var filters = [
      { id: 'all', label: '全部' },
      { id: 'mainline', label: '主线论文' },
      { id: 'support', label: '支撑模块' },
      { id: 'task-program', label: 'Task / Program' },
      { id: 'asset-world', label: 'Asset / World' },
      { id: 'data-bench', label: 'Data / Benchmark' },
      { id: 'real2sim', label: 'Real2Sim2Real' },
    ];

    var filterHtml = filters.map(function (f) {
      var active = state.filter === f.id ? ' is-active' : '';
      return '<button type="button" class="pl-filter-btn' + active + '" data-pl-filter="' + f.id + '">' + esc(f.label) + '</button>';
    }).join('');

    var sortHtml =
      '<button type="button" class="pl-sort-btn' + (state.sortKey === 'completeness' ? ' is-active' : '') + '" data-pl-sort="completeness">按完整度</button>' +
      '<button type="button" class="pl-sort-btn' + (state.sortKey === 'reproducibility' ? ' is-active' : '') + '" data-pl-sort="reproducibility">按可复现性</button>' +
      '<button type="button" class="pl-sort-btn' + (state.sortKey === 'rank' ? ' is-active' : '') + '" data-pl-sort="rank">推荐优先级</button>';

    var rowHtml = rows.map(function (m) {
      var badge = m.mainline
        ? '<span class="pl-badge pl-badge-main">主线</span>'
        : '<span class="pl-badge pl-badge-support">支撑</span>';
      return (
        '<tr data-pl-method="' + esc(m.id) + '">' +
        '<td data-label="Rank">' + m.rank + '</td>' +
        '<td data-label="方法"><strong>' + esc(m.name) + '</strong> ' + badge + '</td>' +
        '<td data-label="Pipeline 角色">' + esc(m.role) + '</td>' +
        '<td data-label="最适合解决的问题">' + esc(m.problem) + '</td>' +
        '<td data-label="覆盖阶段">' + esc(m.stages) + '</td>' +
        '<td data-label="平台 / 后端">' + esc(m.platform) + '</td>' +
        '<td data-label="完整度"><span class="pl-score">' + m.completeness + '</span></td>' +
        '<td data-label="可复现性"><span class="pl-score">' + m.reproducibility + '</span></td>' +
        '<td data-label="主要短板">' + esc(m.weakness) + '</td>' +
        '</tr>'
      );
    }).join('');

    root.innerHTML =
      '<div class="pl-table-controls">' +
      '<div class="pl-filter-group" role="group" aria-label="筛选">' + filterHtml + '</div>' +
      '<div class="pl-sort-group" role="group" aria-label="排序">' + sortHtml + '</div>' +
      '</div>' +
      '<div class="table-scroll pl-table-wrap">' +
      '<table class="te-core-paper-table pl-method-table">' +
      '<thead><tr>' +
      '<th>Rank</th><th>方法</th><th>Pipeline 角色</th><th>最适合解决的问题</th>' +
      '<th>覆盖阶段</th><th>平台 / 后端</th><th>完整度</th><th>可复现性</th><th>主要短板</th>' +
      '</tr></thead><tbody>' + rowHtml + '</tbody></table></div>' +
      '<p class="pl-table-count">' + rows.length + ' 篇方法</p>';
  }

  function renderFlow(root) {
    if (!root) return;
    var nodes = D.FLOW_NODES.map(function (n, i) {
      return (
        '<article class="pl-flow-node" tabindex="0" data-pl-flow="' + esc(n.id) + '">' +
        '<span class="pl-flow-step">' + (i + 1) + '</span>' +
        '<h4 class="pl-flow-title">' + esc(n.title) + '</h4>' +
        '<p class="pl-flow-methods">' + esc(n.methods) + '</p>' +
        '<div class="pl-flow-detail" hidden>' +
        '<p><strong>输入：</strong>' + esc(n.input) + '</p>' +
        '<p><strong>输出：</strong>' + esc(n.output) + '</p>' +
        '<p class="pl-flow-risk"><strong>若缺失：</strong>' + esc(n.risk) + '</p>' +
        '</div></article>' +
        (i < D.FLOW_NODES.length - 1 ? '<div class="pl-flow-connector" aria-hidden="true"></div>' : '')
      );
    }).join('');
    root.innerHTML = '<div class="pl-flow-track">' + nodes + '</div>';
  }

  function matrixCellClass(v) {
    if (v >= 3) return 'pl-mx-3';
    if (v === 2) return 'pl-mx-2';
    if (v === 1) return 'pl-mx-1';
    return 'pl-mx-0';
  }

  function renderRoleMatrix(root) {
    if (!root) return;
    var names = Object.keys(D.ROLE_MATRIX);
    var head = '<tr><th>方法</th>' + D.STAGES.map(function (s) {
      return '<th>' + esc(s.label) + '</th>';
    }).join('') + '</tr>';

    var body = names.map(function (name) {
      var scores = D.ROLE_MATRIX[name];
      var cells = scores.map(function (v) {
        return '<td class="' + matrixCellClass(v) + '" data-score="' + v + '" title="覆盖强度 ' + v + '">' + v + '</td>';
      }).join('');
      return '<tr><th scope="row">' + esc(name) + '</th>' + cells + '</tr>';
    }).join('');

    root.innerHTML =
      '<p class="pl-matrix-note">评分不是性能排名，而是结构完整度导航，用于判断每篇论文适合放在 pipeline 的哪个位置。</p>' +
      '<div class="table-scroll pl-matrix-wrap">' +
      '<table class="te-core-paper-table pl-role-matrix"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="pl-matrix-legend" aria-hidden="true">' +
      '<span class="pl-mx-0">0 不覆盖</span><span class="pl-mx-1">1 弱</span><span class="pl-mx-2">2 中</span><span class="pl-mx-3">3 强</span></div>';
  }

  function renderTaskExample(root) {
    if (!root) return;
    var panels = [
      { id: 'lang', title: 'Language Task', body: '<p>「打开抽屉，把苹果放进去。」</p>' },
      { id: 'spec', title: 'Task Spec', body: '<ul><li><strong>initial:</strong> drawer closed, apple on table, gripper empty</li><li><strong>goal:</strong> apple inside drawer, gripper released</li><li><strong>subtasks:</strong> reach handle → open → reach apple → grasp → place → release</li><li><strong>constraints:</strong> do not knock over cup; avoid collision</li></ul>' },
      { id: 'program', title: 'Task Program', body: '<pre class="pl-code">reset(seed)\nsample_initial_state()\ncompute_observation()\ncompute_reward()\ncheck_success()\ncheck_failure()\nterminate()</pre>' },
      { id: 'reward', title: 'Reward', body: '<ul><li>reach handle reward</li><li>drawer open reward</li><li>grasp reward</li><li>apple-in-drawer reward</li><li>release success bonus</li><li>collision penalty</li></ul>' },
      { id: 'data', title: 'Data', body: '<ul><li>expert demo</li><li>failed rollout</li><li>successful rollout</li><li>hard case replay</li></ul>' },
      { id: 'bench', title: 'Benchmark', body: '<ul><li>seen drawer / seen apple</li><li>unseen drawer geometry</li><li>unseen object category</li><li>cluttered table</li><li>changed friction / lighting / distractors</li></ul>' },
      { id: 'real', title: 'Real Feedback', body: '<ul><li>real robot fails to pull drawer handle</li><li>update joint friction and handle geometry in sim</li><li>retrain with harder drawer-opening curriculum</li></ul>' },
    ];

    root.innerHTML = panels.map(function (p, i) {
      var open = i === 0 ? ' open' : '';
      return (
        '<details class="pl-task-panel"' + open + '>' +
        '<summary>' + esc(p.title) + '</summary>' +
        '<div class="pl-task-body">' + p.body + '</div></details>'
      );
    }).join('');
  }

  function bindTableEvents(root, state, rerender) {
    if (!root || root.getAttribute('data-pl-bound')) return;
    root.setAttribute('data-pl-bound', '1');

    root.addEventListener('click', function (e) {
      var fb = e.target.closest('[data-pl-filter]');
      if (fb) {
        state.filter = fb.getAttribute('data-pl-filter');
        rerender();
        return;
      }
      var sb = e.target.closest('[data-pl-sort]');
      if (sb) {
        var key = sb.getAttribute('data-pl-sort');
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortKey = key;
          state.sortDir = key === 'rank' ? 'asc' : 'desc';
        }
        rerender();
      }
    });
  }

  function bindFlowEvents(root) {
    if (!root || root.getAttribute('data-pl-flow-bound')) return;
    root.setAttribute('data-pl-flow-bound', '1');
    root.addEventListener('click', function (e) {
      var node = e.target.closest('.pl-flow-node');
      if (!node) return;
      var detail = node.querySelector('.pl-flow-detail');
      if (!detail) return;
      var open = !detail.hidden;
      root.querySelectorAll('.pl-flow-detail').forEach(function (d) { d.hidden = true; });
      root.querySelectorAll('.pl-flow-node').forEach(function (n) { n.classList.remove('is-open'); });
      if (!open) {
        detail.hidden = false;
        node.classList.add('is-open');
      }
    });
  }

  function initPipelineView(doc) {
    var scope = doc || document;
    var tableRoot = scope.querySelector('#pipeline-method-table-root');
    var flowRoot = scope.querySelector('#pipeline-flow-root');
    var matrixRoot = scope.querySelector('#pipeline-role-matrix-root');
    var taskRoot = scope.querySelector('#pipeline-task-example-root');

    if (!tableRoot && !flowRoot && !matrixRoot && !taskRoot) return;

    var tableState = defaultTableState();
    function rerenderTable() {
      renderMethodTable(tableRoot, tableState);
    }

    if (tableRoot) {
      rerenderTable();
      bindTableEvents(tableRoot, tableState, rerenderTable);
    }
    if (flowRoot) {
      renderFlow(flowRoot);
      bindFlowEvents(flowRoot);
    }
    if (matrixRoot) renderRoleMatrix(matrixRoot);
    if (taskRoot) renderTaskExample(taskRoot);
  }

  window.initPipelineView = initPipelineView;
})();
