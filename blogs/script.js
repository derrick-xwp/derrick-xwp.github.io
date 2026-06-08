(function () {
  'use strict';

  var LANGS = window.LANGS || ['zh', 'zhtw', 'en', 'ja', 'ko', 'th'];
  var COLLAPSE_KEY = 'blog-embodied-open';
  var currentLang = 'zh';

  try {
    var stored = localStorage.getItem('site-lang');
    if (stored && LANGS.indexOf(stored) !== -1) currentLang = stored;
  } catch (e) { /* ignore */ }

  function homeBase() {
    if (window.SITE_PATHS && window.SITE_PATHS.home) return window.SITE_PATHS.home;
    try {
      return new URL('../', window.location.href).pathname;
    } catch (e) {
      return '../';
    }
  }

  function homeHref(hash) {
    var base = homeBase();
    if (!hash) return base;
    return base.replace(/\/?$/, '/') + hash.replace(/^#?/, '#');
  }

  function blogHubHref() {
    if (window.SITE_PATHS && window.SITE_PATHS.blogs) return window.SITE_PATHS.blogs;
    try {
      return new URL('./', window.location.href).pathname;
    } catch (e) {
      return './';
    }
  }

  function platformHref(link) {
    if (!link) return link;
    if (/^https?:\/\//.test(link) || link.charAt(0) === '/') return link;
    if (window.SITE_PATHS && window.SITE_PATHS.blogs) {
      return window.SITE_PATHS.blogs + link.replace(/^\.\//, '');
    }
    return link;
  }

  function renderNav(nav) {
    var el = document.getElementById('main-nav');
    if (!el || !nav) return;
    var piLead = nav.piLead
      ? '<li><a href="' + homeHref('#pi-info') + '">' + nav.piLead + '</a></li>'
      : '';
    var blogHref = blogHubHref();
    var html =
      '<ul>' +
      '<li><a href="' + homeHref('#content') + '">' + nav.home + '</a></li>' +
      '<li><a href="' + homeHref('#news') + '">' + nav.news + '</a></li>' +
      '<li><a href="' + blogHref + '" aria-current="page">' + nav.blogs + '</a></li>' +
      '<li><a href="' + homeHref('#about') + '">' + nav.about + '</a></li>' +
      piLead +
      '<li><a href="' + homeHref('#research') + '">' + nav.research + '</a></li>' +
      '<li><a href="' + homeHref('#people') + '">' + nav.people + '</a></li>' +
      '<li><a href="' + homeHref('#publications') + '">' + nav.papers + '</a></li>' +
      '<li><a href="' + homeHref('#patents') + '">' + nav.patents + '</a></li>' +
      '<li><a href="' + homeHref('#gallery') + '">' + nav.gallery + '</a></li>' +
      '<li><a href="' + homeHref('#contact') + '">' + nav.contact + '</a></li>' +
      '</ul>';
    el.innerHTML = html;
  }

  function renderQuickNav(nav) {
    var el = document.getElementById('quick-nav');
    if (!el || !nav) return;
    var blogHref = blogHubHref();
    var links = [
      { href: homeHref('#news'), label: nav.news },
      { href: blogHref, label: nav.blogs },
      { href: homeHref('#about'), label: nav.about },
      { href: homeHref('#pi-info'), label: nav.piLead || '' },
      { href: homeHref('#research'), label: nav.research },
      { href: homeHref('#people'), label: nav.people },
      { href: homeHref('#publications'), label: nav.papers },
      { href: homeHref('#patents'), label: nav.patents },
      { href: homeHref('#gallery'), label: nav.gallery },
      { href: homeHref('#contact'), label: nav.contact }
    ].filter(function (l) { return l.label; });
    el.innerHTML = links.map(function (l) {
      return '<a href="' + l.href + '">' + l.label + '</a>';
    }).join('');
  }

  function platformCardHtml(p, readMore, compact) {
    var href = platformHref(p.link);
    var tags = (p.tags || []).map(function (t) {
      return '<span class="blog-tag">' + t + '</span>';
    }).join('');
    var updated = p.updatedLabel && !compact
      ? '<time class="blog-platform-updated">' + p.updatedLabel + '</time>'
      : '';
    var cardClass = 'blog-platform-card' + (compact ? ' blog-platform-card--compact' : '');
    var headingTag = compact ? 'h3' : 'h2';
    return (
      '<article class="' + cardClass + '">' +
        '<div class="blog-platform-head">' +
          '<span class="blog-platform-vendor">' + p.vendor + '</span>' +
          updated +
        '</div>' +
        '<' + headingTag + '><a href="' + href + '">' + p.title + '</a></' + headingTag + '>' +
        (tags ? '<div class="blog-tags">' + tags + '</div>' : '') +
        '<p>' + p.summary + '</p>' +
        '<a class="blog-read-more" href="' + href + '">' + readMore + '</a>' +
      '</article>'
    );
  }

  function fixEmbodiedOverviewLinks(root) {
    if (!root) return;
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^https?:\/\//.test(href) || href.charAt(0) === '#') return;
      if (href.indexOf('embodied-platforms/') === 0) return;
      if (href.indexOf('../nvidia/') === 0) {
        a.setAttribute('href', href.replace(/^\.\.\//, ''));
        return;
      }
      if (href.indexOf('nvidia/') === 0) return;
      if (href.indexOf('../') === 0) return;
      a.setAttribute('href', 'embodied-platforms/' + href.replace(/^\.\//, ''));
    });
  }

  function capabilityBadge(text) {
    var level = text.replace(/\s/g, '');
    if (level === '高') return '<span class="cap-badge cap-high">高</span>';
    if (level === '中') return '<span class="cap-badge cap-mid">中</span>';
    if (level === '低') return '<span class="cap-badge cap-low">低</span>';
    if (level === '—' || level === '-') return '<span class="cap-badge cap-none">—</span>';
    return null;
  }

  function enhanceOverviewArticle(root, series) {
    if (!root) return;

    var h1 = root.querySelector('h1');
    if (h1) h1.remove();

    var blockquote = root.querySelector('blockquote');
    if (blockquote) blockquote.classList.add('blog-overview-callout');

    root.querySelectorAll('hr').forEach(function (hr, i) {
      if (i === 0) hr.remove();
    });

    root.querySelectorAll('table').forEach(function (table) {
      var header = table.querySelector('th');
      if (!header) return;
      var headerText = header.textContent.trim();
      if (headerText === '平台' || headerText === 'Platform') {
        table.classList.add('capability-matrix');
        table.querySelectorAll('tbody td').forEach(function (td, index) {
          if (index % (table.rows[0].cells.length) === 0) return;
          var badge = capabilityBadge(td.textContent);
          if (badge) td.innerHTML = badge;
        });
      }
    });

    if (series.overviewLegend) {
      var legend = document.createElement('div');
      legend.className = 'cap-legend';
      legend.innerHTML =
        '<span class="cap-legend-item"><span class="cap-badge cap-high">高</span> ' + series.legendHigh + '</span>' +
        '<span class="cap-legend-item"><span class="cap-badge cap-mid">中</span> ' + series.legendMid + '</span>' +
        '<span class="cap-legend-item"><span class="cap-badge cap-low">低</span> ' + series.legendLow + '</span>' +
        '<span class="cap-legend-item"><span class="cap-badge cap-none">—</span> ' + series.legendNone + '</span>';
      var matrix = root.querySelector('.capability-matrix');
      if (matrix) matrix.parentNode.insertBefore(legend, matrix);
    }

    Array.from(root.querySelectorAll('h2')).forEach(function (h2) {
      var section = document.createElement('div');
      section.className = 'blog-overview-section';
      var parent = h2.parentNode;
      parent.insertBefore(section, h2);
      section.appendChild(h2);
      var node = section.nextSibling;
      while (node && node.nodeName !== 'H2') {
        var next = node.nextSibling;
        section.appendChild(node);
        node = next;
      }
    });
  }

  function initOverviewMermaid(scope) {
    if (!scope) return;
    var nodes = scope.querySelectorAll('.mermaid');
    if (!nodes.length) return;

    function runMermaid() {
      if (!window.mermaid) return;
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
        mindmap: { padding: 18, useMaxWidth: true }
      });
      window.mermaid.run({ nodes: nodes }).catch(function (err) {
        console.error('Mermaid render failed:', err);
      });
    }

    if (window.mermaid) {
      runMermaid();
      return;
    }

    var base = platformHref('embodied-platforms/');
    var script = document.createElement('script');
    script.src = base + 'vendor/mermaid.min.js';
    script.onload = runMermaid;
    document.head.appendChild(script);
  }

  function loadEmbodiedOverview(series) {
    var overviewRoot = document.getElementById('blog-embodied-overview');
    if (!overviewRoot || !series.overviewUrl) return;

    var url = platformHref(series.overviewUrl);
    overviewRoot.innerHTML = '<p class="blog-embodied-loading">' + (series.loadingLabel || '…') + '</p>';

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('fetch failed');
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var article = doc.querySelector('.article');
        if (!article) throw new Error('no article');
        overviewRoot.innerHTML = '';
        var wrap = document.createElement('div');
        wrap.className = 'article blog-embodied-overview-article';
        wrap.innerHTML = article.innerHTML;
        fixEmbodiedOverviewLinks(wrap);
        enhanceOverviewArticle(wrap, series);
        overviewRoot.appendChild(wrap);
        initOverviewMermaid(wrap);
      })
      .catch(function () {
        overviewRoot.innerHTML = '<p class="blog-embodied-error">' + (series.loadErrorLabel || '') + '</p>';
      });
  }

  function renderEmbodiedPanel(d) {
    var root = document.getElementById('blog-hub-series');
    var series = d.embodiedSeries;
    if (!root || !series || !series.platforms || !series.platforms.length) {
      if (root) root.innerHTML = '';
      return;
    }

    var readMore = d.blogHubReadMore || '→';
    var platformCount = series.platformCountLabel || String(series.platforms.length);
    var defaultOpen = series.defaultOpen !== false;
    try {
      var stored = localStorage.getItem(COLLAPSE_KEY);
      if (stored !== null) defaultOpen = stored === 'true';
    } catch (e) { /* ignore */ }

    var platformCards = series.platforms.map(function (p) {
      return platformCardHtml(p, readMore, true);
    }).join('');

    root.innerHTML =
      '<details class="blog-collapsible" id="blog-embodied-collapsible"' + (defaultOpen ? ' open' : '') + '>' +
        '<summary class="blog-collapsible-summary">' +
          '<div class="blog-collapsible-head">' +
            '<div class="blog-collapsible-text">' +
              '<span class="blog-collapsible-badge">' + (series.seriesBadge || 'Embodied AI') + '</span>' +
              '<span class="blog-collapsible-title">' + (series.title || '') + '</span>' +
              '<span class="blog-collapsible-desc">' + (series.summary || '') + '</span>' +
            '</div>' +
            '<div class="blog-collapsible-meta">' +
              '<span class="blog-collapsible-count">' + platformCount + '</span>' +
              '<span class="blog-collapsible-chevron" aria-hidden="true"></span>' +
            '</div>' +
          '</div>' +
        '</summary>' +
        '<div class="blog-collapsible-body">' +
          '<div class="blog-overview-panel">' +
            '<div class="blog-overview-panel-head">' +
              '<h3 class="blog-embodied-platforms-heading">' + (series.overviewHeading || '') + '</h3>' +
            '</div>' +
            '<div class="blog-embodied-overview" id="blog-embodied-overview" aria-live="polite"></div>' +
          '</div>' +
          '<div class="blog-platforms-panel">' +
            '<h3 class="blog-embodied-platforms-heading">' + (series.platformsHeading || '') + '</h3>' +
            '<div class="blog-embodied-platforms">' + platformCards + '</div>' +
          '</div>' +
        '</div>' +
      '</details>';

    var details = document.getElementById('blog-embodied-collapsible');
    if (details) {
      details.addEventListener('toggle', function () {
        try {
          localStorage.setItem(COLLAPSE_KEY, String(details.open));
        } catch (e) { /* ignore */ }
      });
    }

    loadEmbodiedOverview(series);
  }

  function setLang(lang) {
    if (!lang || LANGS.indexOf(lang) === -1) lang = 'zh';
    currentLang = lang;
    try { localStorage.setItem('site-lang', lang); } catch (e) { /* ignore */ }

    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute(
      'lang',
      lang === 'zh' ? 'zh-CN' : lang === 'zhtw' ? 'zh-TW' : lang === 'ja' ? 'ja' : lang === 'ko' ? 'ko' : lang === 'th' ? 'th' : 'en'
    );

    var select = document.getElementById('lang-select');
    if (select) select.value = lang;

    var d = window.RESUME && (window.RESUME[lang] || window.RESUME.en);
    if (!d) return;

    var copyright = document.getElementById('copyright-center-name');
    if (copyright && d.centerName) copyright.textContent = d.centerName;

    var zjuLogo = document.querySelector('.header-zju-logo');
    if (zjuLogo && d.zjuTitle) zjuLogo.setAttribute('title', d.zjuTitle);
    var zjuImg = document.querySelector('.header-zju-logo img');
    if (zjuImg && d.zjuAlt) zjuImg.setAttribute('alt', d.zjuAlt);
    var ibjLogo = document.querySelector('.header-ibj-logo');
    if (ibjLogo && d.ibjTitle) ibjLogo.setAttribute('title', d.ibjTitle);
    var ibjImg = document.querySelector('.header-ibj-logo img');
    if (ibjImg && d.ibjAlt) ibjImg.setAttribute('alt', d.ibjAlt);

    if (d.nav) {
      renderNav(d.nav);
      renderQuickNav(d.nav);
    }

    var mainNav = document.getElementById('main-nav');
    if (mainNav && d.navAriaLabel) mainNav.setAttribute('aria-label', d.navAriaLabel);

    var toggle = document.querySelector('.nav-toggle');
    if (toggle && d.menuAriaLabel) toggle.setAttribute('aria-label', d.menuAriaLabel);

    var title = document.getElementById('blog-hub-title');
    if (title && d.blogHubTitle) title.textContent = d.blogHubTitle;

    document.title = (d.blogHubTitle || 'Blog') + " · " + (d.centerName || "Wenpeng Xing");

    renderEmbodiedPanel(d);
  }

  function setupNavToggle() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setLang(currentLang);
    setupNavToggle();

    var langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', function () {
        setLang(langSelect.value);
      });
    }
  });
})();
