/**
 * 4.3 Sim-Ready Assets — Paradigm comparison & macro roadmap view.
 * Vanilla JS component (integrates with existing static site + mermaid).
 */
(function () {
  'use strict';

  var DATA_URL = 'assets-paradigm-data.json';
  var cache = null;

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readEmbeddedData() {
    var tag = document.getElementById('assets-paradigm-data');
    if (!tag || !tag.textContent.trim()) return null;
    try {
      return JSON.parse(tag.textContent);
    } catch (e) {
      console.warn('assets-paradigm-data parse failed', e);
      return null;
    }
  }

  function ensureMermaidReady() {
    if (!window.mermaid || window.__teMermaidReady) return;
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        fontFamily: '"Source Sans 3", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: '13px',
        lineColor: '#7ecbff',
        primaryTextColor: '#e8f4ff',
        secondaryTextColor: '#c7d9f5',
        primaryColor: '#1e3a5f',
        primaryBorderColor: '#60a5fa',
        secondaryColor: '#162544',
        clusterBkg: 'rgba(22,37,68,0.85)',
        clusterBorder: '#3b82f6',
        titleColor: '#7ecbff',
        edgeLabelBackground: '#111d38',
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 18,
        nodeSpacing: 36,
        rankSpacing: 48,
        diagramPadding: 12,
      },
      securityLevel: 'loose',
    });
    window.__teMermaidReady = true;
  }

  function fetchData() {
    if (cache) return Promise.resolve(cache);
    var embedded = readEmbeddedData();
    if (embedded) {
      cache = embedded;
      return Promise.resolve(cache);
    }
    if (typeof fetch !== 'function') {
      return Promise.reject(new Error('no embedded data'));
    }
    return fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('load failed');
        return r.json();
      })
      .then(function (d) {
        cache = d;
        return d;
      });
  }

  function renderLifecycleStrip(lifecycle) {
    var cells = lifecycle.map(function (stage, i) {
      var arrow = i ? '<span class="tpv-stage-arrow" aria-hidden="true">→</span>' : '';
      return (
        arrow +
        '<button type="button" class="tpv-stage-chip" data-stage="' +
        esc(stage.id) +
        '" title="' +
        esc(stage.techniques) +
        '">' +
        '<span class="tpv-stage-label">' +
        esc(stage.label) +
        '</span>' +
        '<span class="tpv-stage-desc">' +
        esc(stage.desc) +
        '</span>' +
        '</button>'
      );
    });
    return (
      '<div class="tpv-lifecycle-strip" role="list" aria-label="宏观生命周期">' +
      cells.join('') +
      '</div>'
    );
  }

  function renderBranchCards(branches) {
    return branches
      .map(function (b) {
        var pros = b.strengths.map(function (s) {
          return '<li>' + esc(s) + '</li>';
        }).join('');
        var cons = b.tradeoffs.map(function (t) {
          return '<li>' + esc(t) + '</li>';
        }).join('');
        return (
          '<article class="tpv-branch-card" data-branch="' +
          esc(b.id) +
          '" style="--tpv-branch-color:' +
          esc(b.color) +
          '">' +
          '<header class="tpv-branch-head">' +
          '<span class="tpv-branch-dot" aria-hidden="true"></span>' +
          '<div>' +
          '<h5 class="tpv-branch-title">' +
          esc(b.label) +
          '</h5>' +
          '<span class="tpv-branch-rep">代表 · ' +
          esc(b.representative) +
          ' · 挂载 ' +
          esc(b.mount) +
          '</span>' +
          '</div>' +
          '</header>' +
          '<p class="tpv-branch-summary">' +
          esc(b.summary) +
          '</p>' +
          '<div class="tpv-branch-cols">' +
          '<div class="tpv-branch-col tpv-branch-pros">' +
          '<span class="tpv-col-label">优势</span><ul>' +
          pros +
          '</ul></div>' +
          '<div class="tpv-branch-col tpv-branch-cons">' +
          '<span class="tpv-col-label">Trade-offs</span><ul>' +
          cons +
          '</ul></div>' +
          '</div>' +
          '<p class="tpv-branch-loop"><strong>闭环：</strong>' +
          esc(b.loop) +
          '</p>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderCompareTable(data) {
    var thead =
      '<tr><th scope="col">流派</th>' +
      data.compare_axes
        .map(function (ax) {
          return '<th scope="col">' + esc(ax.label) + '</th>';
        })
        .join('') +
      '</tr>';
    var branchMap = {};
    data.branches.forEach(function (b) {
      branchMap[b.id] = b.label;
    });
    var rows = data.compare_rows
      .map(function (row) {
        var cells = ['<td><strong>' + esc(branchMap[row.branch] || row.branch) + '</strong></td>'];
        data.compare_axes.forEach(function (ax) {
          cells.push('<td>' + esc(row[ax.key] || '—') + '</td>');
        });
        return '<tr data-branch="' + esc(row.branch) + '">' + cells.join('') + '</tr>';
      })
      .join('');
    return (
      '<div class="tpv-compare-wrap">' +
      '<table class="tpv-compare-table te-data-table">' +
      '<thead>' +
      thead +
      '</thead><tbody>' +
      rows +
      '</tbody></table></div>'
    );
  }

  function renderRoot(data) {
    var pains = data.consensus.pains
      .map(function (p) {
        return '<li>' + esc(p) + '</li>';
      })
      .join('');

    return (
      '<section class="te-paradigm-view" aria-labelledby="te-assets-paradigm-title">' +
      '<div class="tpv-glass">' +
      '<header class="tpv-header">' +
      '<h4 class="tpv-title" id="te-assets-paradigm-title">' +
      esc(data.title) +
      '</h4>' +
      '<p class="tpv-caption">' +
      esc(data.caption) +
      '</p>' +
      '</header>' +
      '<div class="tpv-consensus">' +
      '<h5 class="tpv-section-label">' +
      esc(data.consensus.title) +
      '</h5>' +
      '<p class="tpv-consensus-goal">' +
      esc(data.consensus.goal) +
      '</p>' +
      '<ul class="tpv-consensus-list">' +
      pains +
      '</ul>' +
      '</div>' +
      '<div class="tpv-roadmap-block">' +
      '<h5 class="tpv-section-label">宏观技术路线闭环 · Macro-Roadmap</h5>' +
      renderLifecycleStrip(data.lifecycle) +
      '<div class="tpv-mermaid-wrap mermaid tpv-mermaid">' +
      data.mermaid +
      '</div>' +
      (data.roadmap_caption
        ? '<div class="tpv-roadmap-caption">' +
          (data.roadmap_caption_kicker
            ? '<p class="tpv-roadmap-caption-kicker">' +
              esc(data.roadmap_caption_kicker) +
              '</p>'
            : '') +
          data.roadmap_caption
            .split('\n')
            .filter(function (p) {
              return p.trim();
            })
            .map(function (p) {
              return '<p>' + esc(p.trim()) + '</p>';
            })
            .join('') +
          '</div>'
        : '') +
      '<p class="tpv-mermaid-hint">悬停下方流派卡片可高亮对应技术分支；点击生命周期芯片查看挂载技术。</p>' +
      '</div>' +
      '<div class="tpv-branches-block">' +
      '<h5 class="tpv-section-label">流派与演进分支 · Technical Branches</h5>' +
      '<div class="tpv-branch-legend" role="tablist" aria-label="流派筛选">' +
      data.branches
        .map(function (b, i) {
          return (
            '<button type="button" class="tpv-legend-btn' +
            (i === 0 ? ' is-active' : '') +
            '" role="tab" data-branch="' +
            esc(b.id) +
            '" style="--tpv-branch-color:' +
            esc(b.color) +
            '">' +
            esc(b.label) +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      '<div class="tpv-branch-grid">' +
      renderBranchCards(data.branches) +
      '</div>' +
      '</div>' +
      '<div class="tpv-matrix-block">' +
      '<h5 class="tpv-section-label">范式对比矩阵 · Paradigm Comparison</h5>' +
      renderCompareTable(data) +
      '</div>' +
      '<div class="tpv-stage-detail" id="tpv-stage-detail" hidden>' +
      '<span class="tpv-stage-detail-label"></span>' +
      '<span class="tpv-stage-detail-text"></span>' +
      '</div>' +
      '</div></section>'
    );
  }

  function highlightBranch(root, branchId) {
    root.querySelectorAll('.tpv-branch-card').forEach(function (card) {
      card.classList.toggle('is-highlight', card.getAttribute('data-branch') === branchId);
    });
    root.querySelectorAll('.tpv-compare-table tbody tr').forEach(function (row) {
      row.classList.toggle('is-highlight', row.getAttribute('data-branch') === branchId);
    });
    root.querySelectorAll('.tpv-legend-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-branch') === branchId);
    });
  }

  function bindInteractions(root, data) {
    var stageDetail = root.querySelector('#tpv-stage-detail');
    var stageMap = {};
    data.lifecycle.forEach(function (s) {
      stageMap[s.id] = s;
    });

    root.querySelectorAll('.tpv-stage-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var id = chip.getAttribute('data-stage');
        var stage = stageMap[id];
        if (!stage || !stageDetail) return;
        stageDetail.hidden = false;
        stageDetail.querySelector('.tpv-stage-detail-label').textContent = stage.label + ' · ';
        stageDetail.querySelector('.tpv-stage-detail-text').textContent = stage.techniques;
        root.querySelectorAll('.tpv-stage-chip').forEach(function (c) {
          c.classList.toggle('is-active', c === chip);
        });
      });
    });

    root.querySelectorAll('.tpv-branch-card, .tpv-legend-btn').forEach(function (el) {
      var bid = el.getAttribute('data-branch');
      if (!bid) return;
      el.addEventListener('mouseenter', function () {
        highlightBranch(root, bid);
      });
      el.addEventListener('focus', function () {
        highlightBranch(root, bid);
      });
      if (el.classList.contains('tpv-legend-btn')) {
        el.addEventListener('click', function () {
          highlightBranch(root, bid);
        });
      }
    });

    root.querySelectorAll('.tpv-compare-table tbody tr').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        highlightBranch(root, row.getAttribute('data-branch'));
      });
    });

    var view = root.querySelector('.te-paradigm-view');
    if (view) {
      view.addEventListener('mouseleave', function () {
        highlightBranch(root, '');
      });
    }
  }

  function runMermaid(container) {
    if (!window.mermaid) return Promise.resolve();
    ensureMermaidReady();
    var nodes = container.querySelectorAll('.tpv-mermaid');
    if (!nodes.length) return Promise.resolve();
    return window.mermaid.run({ nodes: nodes }).catch(function (err) {
      console.error('Paradigm mermaid failed:', err);
    });
  }

  function mount(el) {
    if (!el || el.dataset.mounted === '1') return;
    el.setAttribute('aria-busy', 'true');
    fetchData()
      .then(function (data) {
        el.innerHTML = renderRoot(data);
        el.dataset.mounted = '1';
        el.removeAttribute('aria-busy');
        bindInteractions(el, data);
        return runMermaid(el);
      })
      .catch(function (err) {
        el.removeAttribute('aria-busy');
        el.innerHTML =
          '<p class="tpv-error">技术路线图加载失败（' +
          esc(String(err && err.message ? err.message : err)) +
          '）。请通过本地 HTTP 服务打开页面，或刷新重试。</p>';
        console.error(err);
      });
  }

  function initAssetsParadigmView(root) {
    if (!root) root = document;
    var targets = root.querySelectorAll('#te-assets-paradigm-root, [data-paradigm-view="assets"]');
    targets.forEach(mount);

    var panel = document.getElementById('theme-assets');
    if (panel) {
      if (panel.open) {
        var openEl = panel.querySelector('#te-assets-paradigm-root');
        if (openEl) mount(openEl);
      }
      panel.addEventListener('toggle', function () {
        if (panel.open) {
          var el = panel.querySelector('#te-assets-paradigm-root');
          if (el) mount(el);
        }
      });
    }
  }

  window.initAssetsParadigmView = initAssetsParadigmView;

  document.addEventListener('DOMContentLoaded', function () {
    initAssetsParadigmView(document);
  });
})();
