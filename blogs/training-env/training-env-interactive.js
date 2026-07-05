(function () {
  'use strict';

  var galleryState = { items: [], index: 0 };

  function openThemePanel(panel) {
    if (!panel || panel.tagName !== 'DETAILS') return;
    panel.open = true;
    panel.classList.add('theme-panel-highlight');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () {
      panel.classList.remove('theme-panel-highlight');
    }, 1800);
  }

  function resolveThemeId(hash) {
    if (!hash) return '';
    return hash.charAt(0) === '#' ? hash.slice(1) : hash;
  }

  function findThemePanel(root, themeId) {
    if (!themeId) return null;
    if (root) {
      var inRoot = root.querySelector('#' + themeId);
      if (inRoot) return inRoot;
    }
    return document.getElementById(themeId);
  }

  function navigateToTheme(root, themeId) {
    var panel = findThemePanel(root, themeId);
    if (panel) openThemePanel(panel);
  }

  function bindRouteNavigation(root) {
    if (!root) return;
    root.querySelectorAll('a[href^="#theme-"]').forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        var themeId = resolveThemeId(chip.getAttribute('href'));
        var panel = findThemePanel(root, themeId);
        if (!panel) return;
        e.preventDefault();
        navigateToTheme(root, themeId);
        try {
          history.replaceState(null, '', '#' + themeId);
        } catch (err) { /* ignore */ }
      });
    });
  }

  function bindMermaidThemeLinks(root) {
    if (!root) return;
    root.querySelectorAll('.mermaid svg a[href^="#theme-"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var themeId = resolveThemeId(link.getAttribute('href') || link.getAttribute('xlink:href'));
        if (!themeId) return;
        e.preventDefault();
        navigateToTheme(root, themeId);
        try {
          history.replaceState(null, '', '#' + themeId);
        } catch (err) { /* ignore */ }
      });
    });
  }

  function applyThemeHash(root) {
    var themeId = resolveThemeId(window.location.hash);
    if (!themeId || themeId.indexOf('theme-') !== 0) return;
    navigateToTheme(root, themeId);
  }

  function collectGalleryItems(scope) {
    if (!scope) return [];
    var root = scope.closest('.paper-ref-item')
      || scope.closest('.paper-media-gallery')
      || scope;
    var nodes = root.querySelectorAll('.paper-media-thumb[data-image-url]');
    return Array.prototype.map.call(nodes, function (btn) {
      return {
        url: btn.getAttribute('data-image-url'),
        alt: btn.getAttribute('data-image-alt') || '项目配图',
      };
    }).filter(function (item) { return !!item.url; });
  }

  function updateLightboxNav(lightbox) {
    var total = galleryState.items.length;
    var index = galleryState.index;
    var prev = lightbox.querySelector('.te-lightbox-prev');
    var next = lightbox.querySelector('.te-lightbox-next');
    var counter = lightbox.querySelector('.te-lightbox-counter');
    var multi = total > 1;

    if (prev) {
      prev.hidden = !multi;
      prev.disabled = false;
    }
    if (next) {
      next.hidden = !multi;
      next.disabled = false;
    }
    if (counter) {
      counter.hidden = !multi;
      counter.textContent = (index + 1) + ' / ' + total;
    }
  }

  function showLightboxImage(lightbox, index) {
    if (!galleryState.items.length) return;
    var total = galleryState.items.length;
    var safeIndex = index;
    if (total > 1) {
      safeIndex = ((index % total) + total) % total;
    } else {
      safeIndex = Math.max(0, Math.min(index, total - 1));
    }
    galleryState.index = safeIndex;
    var item = galleryState.items[safeIndex];
    var img = lightbox.querySelector('.te-lightbox-img');
    var caption = lightbox.querySelector('.te-lightbox-caption');
    img.src = item.url;
    img.alt = item.alt;
    if (caption) {
      caption.textContent = item.alt;
      caption.hidden = !item.alt;
    }
    updateLightboxNav(lightbox);
  }

  function closeLightbox(lightbox) {
    lightbox.hidden = true;
    var img = lightbox.querySelector('.te-lightbox-img');
    img.removeAttribute('src');
    img.alt = '';
    galleryState.items = [];
    galleryState.index = 0;
  }

  function openLightboxGallery(items, startIndex) {
    if (!items || !items.length) return;
    var lightbox = ensureLightbox();
    galleryState.items = items;
    showLightboxImage(lightbox, startIndex || 0);
    lightbox.hidden = false;
  }

  function stepLightbox(delta) {
    var lightbox = document.getElementById('te-paper-lightbox');
    if (!lightbox || lightbox.hidden || !galleryState.items.length) return;
    showLightboxImage(lightbox, galleryState.index + delta);
  }

  function ensureLightbox() {
    var lightbox = document.getElementById('te-paper-lightbox');
    if (lightbox) return lightbox;

    lightbox = document.createElement('div');
    lightbox.id = 'te-paper-lightbox';
    lightbox.className = 'te-paper-lightbox';
    lightbox.hidden = true;
    lightbox.innerHTML =
      '<button type="button" class="te-lightbox-close" aria-label="关闭">×</button>' +
      '<button type="button" class="te-lightbox-prev" aria-label="上一张" hidden>‹</button>' +
      '<button type="button" class="te-lightbox-next" aria-label="下一张" hidden>›</button>' +
      '<div class="te-lightbox-stage">' +
      '<img class="te-lightbox-img" alt="">' +
      '<p class="te-lightbox-caption" hidden></p>' +
      '<span class="te-lightbox-counter" hidden></span>' +
      '</div>';

    lightbox.querySelector('.te-lightbox-close').addEventListener('click', function () {
      closeLightbox(lightbox);
    });
    lightbox.querySelector('.te-lightbox-prev').addEventListener('click', function (e) {
      e.stopPropagation();
      stepLightbox(-1);
    });
    lightbox.querySelector('.te-lightbox-next').addEventListener('click', function (e) {
      e.stopPropagation();
      stepLightbox(1);
    });
    lightbox.querySelector('.te-lightbox-stage').addEventListener('click', function (e) {
      e.stopPropagation();
    });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox(lightbox);
    });

    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox(lightbox);
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });

    document.body.appendChild(lightbox);
    return lightbox;
  }

  function closePaperPlayers(except) {
    document.querySelectorAll('.paper-media-player').forEach(function (player) {
      if (player === except) return;
      player.hidden = true;
      player.innerHTML = '';
    });
    document.querySelectorAll('.paper-media-play.is-active').forEach(function (btn) {
      if (!except || btn.closest('.paper-ref-media') !== except.closest('.paper-ref-media')) {
        btn.classList.remove('is-active');
      }
    });
  }

  function renderVideoPlayer(btn) {
    var media = btn.closest('.paper-ref-media');
    if (!media) return null;
    var player = media.querySelector('.paper-media-player');
    if (!player) return null;

    var isActive = btn.classList.contains('is-active');
    closePaperPlayers(player);

    if (isActive) {
      player.hidden = true;
      player.innerHTML = '';
      btn.classList.remove('is-active');
      return player;
    }

    var type = btn.getAttribute('data-video-type');
    var html = '';
    if (type === 'youtube') {
      var id = btn.getAttribute('data-video-id');
      if (!id) return player;
      html =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
        '?autoplay=1&rel=0" title="' + (btn.getAttribute('aria-label') || '演示视频') +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>';
    } else if (type === 'mp4') {
      var url = btn.getAttribute('data-video-url');
      if (!url) return player;
      html = '<video controls autoplay playsinline preload="metadata" src="' + url + '"></video>';
    }

    if (!html) return player;
    player.innerHTML = html;
    player.hidden = false;
    btn.classList.add('is-active');
    player.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return player;
  }

  function bindPaperMedia(root) {
    if (!root) return;

    root.querySelectorAll('.paper-media-play').forEach(function (btn) {
      if (btn.dataset.mediaBound === '1') return;
      btn.dataset.mediaBound = '1';
      btn.addEventListener('click', function () {
        renderVideoPlayer(btn);
      });
    });

    root.querySelectorAll('.paper-media-gallery-open').forEach(function (btn) {
      if (btn.dataset.mediaBound === '1') return;
      btn.dataset.mediaBound = '1';
      btn.addEventListener('click', function () {
        var items = collectGalleryItems(btn);
        openLightboxGallery(items, 0);
      });
    });

    root.querySelectorAll('.paper-media-thumb').forEach(function (btn) {
      if (btn.dataset.mediaBound === '1') return;
      if (btn.closest('.paper-media-gallery--deferred')) return;
      btn.dataset.mediaBound = '1';
      btn.addEventListener('click', function () {
        var items = collectGalleryItems(btn);
        var thumbs = btn.parentElement.querySelectorAll('.paper-media-thumb[data-image-url]');
        var index = Array.prototype.indexOf.call(thumbs, btn);
        openLightboxGallery(items, index < 0 ? 0 : index);
      });
    });
  }

  function bindRouteDiagramClusters(root) {
    if (!root) return;
    root.querySelectorAll('.theme-route-diagram').forEach(function (diagram) {
      var clusters = diagram.querySelectorAll('.trm-cluster');
      var rows = diagram.querySelectorAll('.trm-compare-table tbody tr[data-cluster]');
      var legends = diagram.querySelectorAll('.trm-legend-item');

      function highlight(clusterId) {
        clusters.forEach(function (c) {
          c.classList.toggle('is-highlight', c.getAttribute('data-cluster-id') === clusterId);
        });
        rows.forEach(function (r) {
          r.classList.toggle('is-highlight', r.getAttribute('data-cluster') === clusterId);
        });
        legends.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('data-cluster') === clusterId);
        });
      }

      function clearHighlight() {
        clusters.forEach(function (c) { c.classList.remove('is-highlight'); });
        rows.forEach(function (r) { r.classList.remove('is-highlight'); });
        legends.forEach(function (l) { l.classList.remove('is-active'); });
      }

      clusters.forEach(function (cluster) {
        var cid = cluster.getAttribute('data-cluster-id');
        cluster.addEventListener('mouseenter', function () { highlight(cid); });
        cluster.addEventListener('focusin', function () { highlight(cid); });
      });
      rows.forEach(function (row) {
        var cid = row.getAttribute('data-cluster');
        row.addEventListener('mouseenter', function () { highlight(cid); });
        row.addEventListener('focusin', function () { highlight(cid); });
      });
      legends.forEach(function (legend) {
        var cid = legend.getAttribute('data-cluster');
        legend.addEventListener('mouseenter', function () { highlight(cid); });
      });
      diagram.addEventListener('mouseleave', clearHighlight);
    });
  }

  function bindAppendixFilters(root) {
    var appendix = root.querySelector('#appendix-content');
    if (!appendix || appendix.dataset.filtersBound === '1') return;
    appendix.dataset.filtersBound = '1';

    var filters = { paradigm: 'all', stage: 'all', route: 'all' };

    function applyFilters() {
      appendix.querySelectorAll('.theme-panel').forEach(function (panel) {
        var p = panel.getAttribute('data-paradigm') || '';
        var r = panel.getAttribute('data-route') || '';
        var stages = panel.getAttribute('data-stages') || '';
        var show = true;
        if (filters.paradigm !== 'all' && p !== filters.paradigm) show = false;
        if (filters.route !== 'all' && r !== filters.route) show = false;
        if (filters.stage !== 'all' && stages.indexOf(filters.stage) < 0) show = false;
        panel.classList.toggle('is-filter-hidden', !show);
      });
    }

    root.querySelectorAll('.te-filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var type = btn.getAttribute('data-filter-type');
        var value = btn.getAttribute('data-filter-value');
        if (!type || value == null) return;
        filters[type] = value;
        root.querySelectorAll('.te-filter-btn[data-filter-type="' + type + '"]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        applyFilters();
      });
    });
  }

  function initTrainingEnvInteractive(root) {
    if (!root) root = document.querySelector('.blog-embodied-overview-article');
    if (!root) return;

    if (root.dataset.trainingInteractive !== '1') {
      root.dataset.trainingInteractive = '1';
      bindRouteNavigation(root);
      bindAppendixFilters(root);
      applyThemeHash(root);
      window.addEventListener('hashchange', function () {
        applyThemeHash(root);
      });
    }

    bindMermaidThemeLinks(root);
    bindRouteDiagramClusters(root);
    bindPaperMedia(root);
  }

  window.initTrainingEnvInteractive = initTrainingEnvInteractive;

  document.addEventListener('DOMContentLoaded', function () {
    initTrainingEnvInteractive(document.querySelector('.te-papers-detail .te-detail-article')
      || document.querySelector('.blog-training-panel .article'));
  });
})();
