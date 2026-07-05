(function () {
  'use strict';

  var COLLAPSE_KEY = 'blog-embodied-open';
  var COLLAPSE_KEY_TRAINING = 'blog-training-open';
  var COLLAPSE_KEY_WORLD_MODEL = 'blog-world-model-open';
  var COLLAPSE_KEY_POLICY_DATA = 'blog-policy-data-open';
  var COLLAPSE_KEY_METHOD_LANDSCAPE = 'blog-method-landscape-open';
  var COLLAPSE_KEY_PIPELINE = 'blog-pipeline-open';

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

  function blogsBaseHref() {
    if (window.SITE_PATHS && window.SITE_PATHS.blogs) {
      var blogs = window.SITE_PATHS.blogs;
      if (/^https?:\/\//.test(blogs)) return blogs;
      return window.location.origin + blogs;
    }
    try {
      return new URL('./', window.location.href).href;
    } catch (e) {
      return '';
    }
  }

  function blogAssetUrl(link) {
    if (!link) return link;
    if (/^https?:\/\//.test(link)) return link;
    if (link.charAt(0) === '/') {
      return window.location.origin + link;
    }
    return new URL(link.replace(/^\.\//, ''), blogsBaseHref()).href;
  }

  function overviewEncPath(overviewUrl) {
    return overviewUrl.replace(/\.html?$/i, '') + '.enc.json';
  }

  function blogEncryptionReady() {
    return !!(
      window.BLOG_AUTH_CONFIG &&
      window.BLOG_AUTH_CONFIG.encryption &&
      window.BlogCrypto &&
      window.BlogCrypto.hasKey &&
      window.BlogCrypto.hasKey()
    );
  }

  function whenBlogEncryptionReady(fn) {
    if (!window.BLOG_AUTH_CONFIG || !window.BLOG_AUTH_CONFIG.encryption || !window.BlogCrypto) {
      fn();
      return;
    }
    if (window.BlogCrypto.hasKey && window.BlogCrypto.hasKey()) {
      fn();
      return;
    }
    var done = false;
    function run() {
      if (done || !window.BlogCrypto.hasKey || !window.BlogCrypto.hasKey()) return;
      done = true;
      fn();
    }
    window.addEventListener('blog-auth-ready', run, { once: true });
    setTimeout(run, 0);
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

  function fixTrainingEnvOverviewLinks(root) {
    if (!root) return;
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^https?:\/\//.test(href) || href.charAt(0) === '#') return;
      if (href.indexOf('embodied-platforms/') === 0 || href.indexOf('nvidia/') === 0) return;
      if (href.indexOf('training-env/') === 0) return;
      if (href.indexOf('../embodied-platforms/') === 0) {
        a.setAttribute('href', href.replace(/^\.\.\//, ''));
        return;
      }
      if (href.indexOf('../nvidia/') === 0) {
        a.setAttribute('href', href.replace(/^\.\.\//, ''));
        return;
      }
      if (href.indexOf('../') === 0) return;
    });
  }

  function wrapOverviewTables(root) {
    if (!root) return;
    root.querySelectorAll('table').forEach(function (table) {
      if (table.parentNode && table.parentNode.classList.contains('table-scroll')) return;
      var wrap = document.createElement('div');
      wrap.className = 'table-scroll';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  function wrapOverviewSections(root, startSelector) {
    if (!root) return;
    var startNode = startSelector ? root.querySelector(startSelector) : root;
    if (!startNode) return;
    Array.from(startNode.querySelectorAll('h2')).forEach(function (h2) {
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

  function enhanceTrainingOverviewArticle(root) {
    if (!root) return;

    var hero = root.querySelector('.te-hero');
    if (hero) hero.remove();

    var detail = root.querySelector('.te-papers-detail .te-detail-article')
      || root.querySelector('.te-detail-article')
      || root.querySelector('.te-papers-module');
    if (!detail) return;

    wrapOverviewTables(detail);
    wrapOverviewSections(detail);
  }

  function fixWorldModelOverviewLinks(root) {
    if (!root) return;
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^https?:\/\//.test(href) || href.charAt(0) === '#') return;
      if (href.indexOf('world-model/') === 0 || href.indexOf('training-env/') === 0) return;
      if (href.indexOf('embodied-platforms/') === 0 || href.indexOf('nvidia/') === 0) return;
      if (href.indexOf('../') === 0) return;
    });
  }

  function fixPolicyDataOverviewLinks(root) {
    if (!root) return;
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^https?:\/\//.test(href) || href.charAt(0) === '#') return;
      if (href.indexOf('policy-data/') === 0 || href.indexOf('training-env/') === 0) return;
      if (href.indexOf('world-model/') === 0 || href.indexOf('method-landscape/') === 0) return;
      if (href.indexOf('pipeline/') === 0) return;
      if (href.indexOf('embodied-platforms/') === 0 || href.indexOf('nvidia/') === 0) return;
      if (href.indexOf('../') === 0) return;
    });
  }

  function fixPipelineOverviewLinks(root) {
    if (!root) return;
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^https?:\/\//.test(href) || href.charAt(0) === '#') return;
      if (href.indexOf('pipeline/') === 0 || href.indexOf('policy-data/') === 0) return;
      if (href.indexOf('training-env/') === 0 || href.indexOf('method-landscape/') === 0) return;
      if (href.indexOf('world-model/') === 0) return;
      if (href.indexOf('embodied-platforms/') === 0 || href.indexOf('nvidia/') === 0) return;
      if (href.indexOf('../') === 0) return;
    });
  }

  function enhancePipelineOverviewArticle(root) {
    if (!root) return;
    var hero = root.querySelector('.te-hero');
    if (hero) hero.remove();
    wrapOverviewSections(root, '.te-section');
  }

  function fixMethodLandscapeOverviewLinks(root) {
    if (!root) return;
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^https?:\/\//.test(href) || href.charAt(0) === '#') return;
      if (href.indexOf('method-landscape/') === 0 || href.indexOf('training-env/') === 0) return;
      if (href.indexOf('policy-data/') === 0 || href.indexOf('world-model/') === 0) return;
      if (href.indexOf('embodied-platforms/') === 0 || href.indexOf('nvidia/') === 0) return;
      if (href.indexOf('../') === 0) return;
    });
  }

  function enhanceWorldModelOverviewArticle(root) {
    if (!root) return;

    var hero = root.querySelector('.te-hero');
    if (hero) hero.remove();

    wrapOverviewTables(root);
    wrapOverviewSections(root);
  }

  function enhancePolicyDataOverviewArticle(root) {
    if (!root) return;

    var hero = root.querySelector('.te-hero');
    if (hero) hero.remove();

    wrapOverviewTables(root);
    wrapOverviewSections(root);
  }

  function enhanceMethodLandscapeOverviewArticle(root) {
    if (!root) return;

    var hero = root.querySelector('.te-hero');
    if (hero) hero.remove();

    wrapOverviewSections(root, '.te-section');
  }

  function loadScriptOnce(src, isReady) {
    return new Promise(function (resolve, reject) {
      if (isReady && isReady()) {
        resolve();
        return;
      }
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute('data-loaded') === '1') {
          resolve();
          return;
        }
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', reject);
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.onload = function () {
        script.setAttribute('data-loaded', '1');
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensurePipelineInteractive(scope) {
    if (!scope || !scope.querySelector('#pipeline-method-table-root')) return;
    var base = platformHref('pipeline/');
    loadScriptOnce(base + 'pipelineMethods.js', function () {
      return !!window.PipelineMethods;
    })
      .then(function () {
        return loadScriptOnce(base + 'pipeline-view.js', function () {
          return !!window.initPipelineView;
        });
      })
      .then(function () {
        if (window.initPipelineView) window.initPipelineView(scope);
      })
      .catch(function () { /* ignore */ });
  }

  function ensureMethodLandscapeInteractive(scope) {
    if (!scope || !scope.querySelector('#method-landscape-root')) return;
    var base = platformHref('training-env/');
    var echartsCdn = 'https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js';

    loadScriptOnce(echartsCdn, function () { return !!window.echarts; })
      .then(function () {
        return loadScriptOnce(base + 'embodiedMethodLandscape.js', function () {
          return !!window.EmbodiedMethodLandscape;
        });
      })
      .then(function () {
        return loadScriptOnce(base + 'method-landscape-view.js', function () {
          return !!window.initMethodLandscapeView;
        });
      })
      .then(function () {
        var root = scope.querySelector('#method-landscape-root');
        if (root) {
          root.setAttribute('data-ml-init', '0');
          root._mlDelegated = false;
        }
        if (window.initMethodLandscapeView) window.initMethodLandscapeView(scope);
      })
      .catch(function (err) {
        console.error('Method landscape scripts failed:', err);
      });
  }

  function initOverviewMermaid(scope, vendorBase) {
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
      }).finally(function () {
        if (window.initTrainingEnvInteractive) {
          window.initTrainingEnvInteractive(scope);
        } else {
          var interactiveScript = document.createElement('script');
          interactiveScript.src = (vendorBase || platformHref('training-env/')) + 'training-env-interactive.js';
          interactiveScript.onload = function () {
            if (window.initTrainingEnvInteractive) window.initTrainingEnvInteractive(scope);
          };
          document.head.appendChild(interactiveScript);
        }
      });
    }

    if (window.mermaid) {
      runMermaid();
      return;
    }

    var base = vendorBase || platformHref('embodied-platforms/');
    var script = document.createElement('script');
    script.src = base + 'vendor/mermaid.min.js';
    script.onload = runMermaid;
    document.head.appendChild(script);
  }

  function ensureTrainingEnvInteractive(scope) {
    if (!scope || !scope.querySelector('.theme-panels')) return;
    if (window.initTrainingEnvInteractive) {
      window.initTrainingEnvInteractive(scope);
      return;
    }
    var script = document.createElement('script');
    script.src = platformHref('training-env/') + 'training-env-interactive.js';
    script.onload = function () {
      if (window.initTrainingEnvInteractive) window.initTrainingEnvInteractive(scope);
    };
    document.head.appendChild(script);
  }

  function mountOverviewFromBody(bodyOrHtml, overviewRoot, series, overviewRootId, fixLinksFn, enhanceFn, vendorBase) {
    var doc;
    if (bodyOrHtml.indexOf('<html') >= 0 || bodyOrHtml.indexOf('<!DOCTYPE') >= 0) {
      doc = new DOMParser().parseFromString(bodyOrHtml, 'text/html');
    } else {
      doc = new DOMParser().parseFromString(
        '<!DOCTYPE html><html><body>' + bodyOrHtml + '</body></html>',
        'text/html'
      );
    }
    var article = doc.querySelector('.article');
    if (!article) throw new Error('no article');
    overviewRoot.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'article blog-embodied-overview-article';
    if (article.classList.contains('te-overview-article')) {
      wrap.classList.add('te-overview-article', 'te-overview-main');
    }
    wrap.innerHTML = article.innerHTML;
    if (fixLinksFn) fixLinksFn(wrap);
    if (enhanceFn) enhanceFn(wrap, series);
    overviewRoot.appendChild(wrap);
    initOverviewMermaid(wrap, vendorBase);
    if (overviewRootId === 'blog-training-overview') {
      ensureTrainingEnvInteractive(wrap);
    }
        if (overviewRootId === 'blog-method-landscape-overview') {
          ensureMethodLandscapeInteractive(wrap);
        }
        if (overviewRootId === 'blog-pipeline-overview') {
          ensurePipelineInteractive(wrap);
        }
    if (series.viewFullArticle && (series.fullArticleUrl || series.overviewUrl)) {
      var fullLink = document.createElement('p');
      fullLink.className = 'blog-embodied-full-link';
      fullLink.innerHTML = '<a href="' + platformHref(series.fullArticleUrl || series.overviewUrl) + '">' + series.viewFullArticle + '</a>';
      overviewRoot.appendChild(fullLink);
    }
  }

  function loadSeriesOverview(series, overviewRootId, fixLinksFn, enhanceFn, vendorBase) {
    var overviewRoot = document.getElementById(overviewRootId);
    if (!overviewRoot || !series.overviewUrl) return;

    function startLoad() {
      overviewRoot.innerHTML = '<p class="blog-embodied-loading">' + (series.loadingLabel || '…') + '</p>';

      var bodyPromise;
      if (blogEncryptionReady()) {
        bodyPromise = window.BlogCrypto.decryptEncUrl(
          blogAssetUrl(overviewEncPath(series.overviewUrl))
        );
      } else {
        bodyPromise = fetch(blogAssetUrl(series.overviewUrl))
          .then(function (res) {
            if (!res.ok) throw new Error('fetch failed');
            return res.text();
          })
          .then(function (html) {
            if (window.BlogCrypto && window.BlogCrypto.maybeDecryptFetchedBody) {
              return window.BlogCrypto.maybeDecryptFetchedBody(html, blogAssetUrl(series.overviewUrl));
            }
            return html;
          });
      }

      bodyPromise
        .then(function (bodyOrHtml) {
          mountOverviewFromBody(bodyOrHtml, overviewRoot, series, overviewRootId, fixLinksFn, enhanceFn, vendorBase);
        })
        .catch(function () {
          overviewRoot.innerHTML = '<p class="blog-embodied-error">' + (series.loadErrorLabel || '') + '</p>';
        });
    }

    whenBlogEncryptionReady(startLoad);
  }

  function loadEmbodiedOverview(series) {
    loadSeriesOverview(
      series,
      'blog-embodied-overview',
      fixEmbodiedOverviewLinks,
      enhanceOverviewArticle,
      platformHref('embodied-platforms/')
    );
  }

  function loadTrainingEnvOverview(series) {
    loadSeriesOverview(
      series,
      'blog-training-overview',
      fixTrainingEnvOverviewLinks,
      enhanceTrainingOverviewArticle,
      platformHref('training-env/')
    );
  }

  function loadWorldModelOverview(series) {
    loadSeriesOverview(
      series,
      'blog-world-model-overview',
      fixWorldModelOverviewLinks,
      enhanceWorldModelOverviewArticle,
      platformHref('world-model/')
    );
  }

  function loadPolicyDataOverview(series) {
    loadSeriesOverview(
      series,
      'blog-policy-data-overview',
      fixPolicyDataOverviewLinks,
      enhancePolicyDataOverviewArticle,
      platformHref('policy-data/')
    );
  }

  function loadPipelineOverview(series) {
    loadSeriesOverview(
      series,
      'blog-pipeline-overview',
      fixPipelineOverviewLinks,
      enhancePipelineOverviewArticle,
      platformHref('pipeline/')
    );
  }

  function loadMethodLandscapeOverview(series) {
    loadSeriesOverview(
      series,
      'blog-method-landscape-overview',
      fixMethodLandscapeOverviewLinks,
      enhanceMethodLandscapeOverviewArticle,
      platformHref('method-landscape/')
    );
  }

  function renderTrainingEnvPanel(d) {
    var series = d.trainingEnvSeries;
    if (!series || !series.overviewUrl) return '';

    var paperCount = series.paperCountLabel || '43';
    var defaultOpen = series.defaultOpen !== false;
    try {
      var stored = localStorage.getItem(COLLAPSE_KEY_TRAINING);
      if (stored !== null) defaultOpen = stored === 'true';
    } catch (e) { /* ignore */ }

    if (window.location.hash === '#training-env') defaultOpen = true;

    return (
      '<details class="blog-collapsible" id="blog-training-collapsible"' + (defaultOpen ? ' open' : '') + '>' +
        '<summary class="blog-collapsible-summary">' +
          '<div class="blog-collapsible-head">' +
            '<div class="blog-collapsible-text">' +
              '<span class="blog-collapsible-badge">' + (series.seriesBadge || 'Training Env') + '</span>' +
              '<span class="blog-collapsible-title">' + (series.title || '') + '</span>' +
            '</div>' +
            '<div class="blog-collapsible-meta">' +
              '<span class="blog-collapsible-count">' + paperCount + '</span>' +
              '<span class="blog-collapsible-chevron" aria-hidden="true"></span>' +
            '</div>' +
          '</div>' +
        '</summary>' +
        '<div class="blog-collapsible-body">' +
          '<div class="blog-embodied-overview" id="blog-training-overview" aria-live="polite"></div>' +
        '</div>' +
      '</details>'
    );
  }

  function renderWorldModelPanel(d) {
    var series = d.worldModelSeries;
    if (!series || !series.overviewUrl) return '';

    var paperCount = series.paperCountLabel || '20';
    var defaultOpen = series.defaultOpen !== false;
    try {
      var stored = localStorage.getItem(COLLAPSE_KEY_WORLD_MODEL);
      if (stored !== null) defaultOpen = stored === 'true';
    } catch (e) { /* ignore */ }

    if (window.location.hash === '#world-model') defaultOpen = true;

    return (
      '<details class="blog-collapsible" id="blog-world-model-collapsible"' + (defaultOpen ? ' open' : '') + '>' +
        '<summary class="blog-collapsible-summary">' +
          '<div class="blog-collapsible-head">' +
            '<div class="blog-collapsible-text">' +
              '<span class="blog-collapsible-badge">' + (series.seriesBadge || 'World Model') + '</span>' +
              '<span class="blog-collapsible-title">' + (series.title || '') + '</span>' +
            '</div>' +
            '<div class="blog-collapsible-meta">' +
              '<span class="blog-collapsible-count">' + paperCount + '</span>' +
              '<span class="blog-collapsible-chevron" aria-hidden="true"></span>' +
            '</div>' +
          '</div>' +
        '</summary>' +
        '<div class="blog-collapsible-body">' +
          '<div class="blog-embodied-overview" id="blog-world-model-overview" aria-live="polite"></div>' +
        '</div>' +
      '</details>'
    );
  }

  function renderPipelinePanel(d) {
    var series = d.pipelineSeries;
    if (!series || !series.overviewUrl) return '';

    var paperCount = series.paperCountLabel || '主线 8 篇';
    var defaultOpen = series.defaultOpen !== false;
    try {
      var stored = localStorage.getItem(COLLAPSE_KEY_PIPELINE);
      if (stored !== null) defaultOpen = stored === 'true';
    } catch (e) { /* ignore */ }

    if (window.location.hash === '#pipeline') defaultOpen = true;

    return (
      '<details class="blog-collapsible" id="blog-pipeline-collapsible"' + (defaultOpen ? ' open' : '') + '>' +
        '<summary class="blog-collapsible-summary">' +
          '<div class="blog-collapsible-head">' +
            '<div class="blog-collapsible-text">' +
              '<span class="blog-collapsible-badge">' + (series.seriesBadge || 'Pipeline') + '</span>' +
              '<span class="blog-collapsible-title">' + (series.title || '') + '</span>' +
            '</div>' +
            '<div class="blog-collapsible-meta">' +
              '<span class="blog-collapsible-count">' + paperCount + '</span>' +
              '<span class="blog-collapsible-chevron" aria-hidden="true"></span>' +
            '</div>' +
          '</div>' +
        '</summary>' +
        '<div class="blog-collapsible-body">' +
          '<div class="blog-embodied-overview" id="blog-pipeline-overview" aria-live="polite"></div>' +
        '</div>' +
      '</details>'
    );
  }

  function renderMethodLandscapePanel(d) {
    var series = d.methodLandscapeSeries;
    if (!series || !series.overviewUrl) return '';

    var paperCount = series.paperCountLabel || '17';
    var defaultOpen = series.defaultOpen !== false;
    try {
      var stored = localStorage.getItem(COLLAPSE_KEY_METHOD_LANDSCAPE);
      if (stored !== null) defaultOpen = stored === 'true';
    } catch (e) { /* ignore */ }

    if (window.location.hash === '#method-landscape') defaultOpen = true;

    return (
      '<details class="blog-collapsible" id="blog-method-landscape-collapsible"' + (defaultOpen ? ' open' : '') + '>' +
        '<summary class="blog-collapsible-summary">' +
          '<div class="blog-collapsible-head">' +
            '<div class="blog-collapsible-text">' +
              '<span class="blog-collapsible-badge">' + (series.seriesBadge || 'Method Landscape') + '</span>' +
              '<span class="blog-collapsible-title">' + (series.title || '') + '</span>' +
            '</div>' +
            '<div class="blog-collapsible-meta">' +
              '<span class="blog-collapsible-count">' + paperCount + '</span>' +
              '<span class="blog-collapsible-chevron" aria-hidden="true"></span>' +
            '</div>' +
          '</div>' +
        '</summary>' +
        '<div class="blog-collapsible-body">' +
          '<div class="blog-embodied-overview" id="blog-method-landscape-overview" aria-live="polite"></div>' +
        '</div>' +
      '</details>'
    );
  }

  function renderPolicyDataPanel(d) {
    var series = d.policyDataSeries;
    if (!series || !series.overviewUrl) return '';

    var paperCount = series.paperCountLabel || '10';
    var defaultOpen = series.defaultOpen !== false;
    try {
      var stored = localStorage.getItem(COLLAPSE_KEY_POLICY_DATA);
      if (stored !== null) defaultOpen = stored === 'true';
    } catch (e) { /* ignore */ }

    if (window.location.hash === '#policy-data') defaultOpen = true;

    return (
      '<details class="blog-collapsible" id="blog-policy-data-collapsible"' + (defaultOpen ? ' open' : '') + '>' +
        '<summary class="blog-collapsible-summary">' +
          '<div class="blog-collapsible-head">' +
            '<div class="blog-collapsible-text">' +
              '<span class="blog-collapsible-badge">' + (series.seriesBadge || 'Policy Data') + '</span>' +
              '<span class="blog-collapsible-title">' + (series.title || '') + '</span>' +
            '</div>' +
            '<div class="blog-collapsible-meta">' +
              '<span class="blog-collapsible-count">' + paperCount + '</span>' +
              '<span class="blog-collapsible-chevron" aria-hidden="true"></span>' +
            '</div>' +
          '</div>' +
        '</summary>' +
        '<div class="blog-collapsible-body">' +
          '<div class="blog-embodied-overview" id="blog-policy-data-overview" aria-live="polite"></div>' +
        '</div>' +
      '</details>'
    );
  }

  function bindCollapsiblePersistence(id, storageKey) {
    var details = document.getElementById(id);
    if (!details) return;
    details.addEventListener('toggle', function () {
      try {
        localStorage.setItem(storageKey, String(details.open));
      } catch (e) { /* ignore */ }
    });
  }

  function renderEmbodiedPanelHtml(d) {
    var series = d.embodiedSeries;
    if (!series || !series.platforms || !series.platforms.length) return '';

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

    return (
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
      '</details>'
    );
  }

  function renderBlogHubSeries(d) {
    var root = document.getElementById('blog-hub-series');
    if (!root) return;

    root.innerHTML =
      renderPolicyDataPanel(d) +
      renderPipelinePanel(d) +
      renderMethodLandscapePanel(d) +
      renderTrainingEnvPanel(d) +
      renderWorldModelPanel(d) +
      renderEmbodiedPanelHtml(d);

    bindCollapsiblePersistence('blog-policy-data-collapsible', COLLAPSE_KEY_POLICY_DATA);
    bindCollapsiblePersistence('blog-pipeline-collapsible', COLLAPSE_KEY_PIPELINE);
    bindCollapsiblePersistence('blog-method-landscape-collapsible', COLLAPSE_KEY_METHOD_LANDSCAPE);
    bindCollapsiblePersistence('blog-training-collapsible', COLLAPSE_KEY_TRAINING);
    bindCollapsiblePersistence('blog-world-model-collapsible', COLLAPSE_KEY_WORLD_MODEL);
    bindCollapsiblePersistence('blog-embodied-collapsible', COLLAPSE_KEY);

    if (d.policyDataSeries) loadPolicyDataOverview(d.policyDataSeries);
    if (d.pipelineSeries) loadPipelineOverview(d.pipelineSeries);
    if (d.methodLandscapeSeries) loadMethodLandscapeOverview(d.methodLandscapeSeries);
    if (d.trainingEnvSeries) loadTrainingEnvOverview(d.trainingEnvSeries);
    if (d.worldModelSeries) loadWorldModelOverview(d.worldModelSeries);
    if (d.embodiedSeries && d.embodiedSeries.platforms && d.embodiedSeries.platforms.length) {
      loadEmbodiedOverview(d.embodiedSeries);
    }

    if (window.location.hash === '#policy-data') {
      var policyEl = document.getElementById('blog-policy-data-collapsible');
      if (policyEl) {
        policyEl.open = true;
        setTimeout(function () {
          policyEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }

    if (window.location.hash === '#pipeline') {
      var pipelineEl = document.getElementById('blog-pipeline-collapsible');
      if (pipelineEl) {
        pipelineEl.open = true;
        setTimeout(function () {
          pipelineEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }

    if (window.location.hash === '#method-landscape') {
      var landscapeEl = document.getElementById('blog-method-landscape-collapsible');
      if (landscapeEl) {
        landscapeEl.open = true;
        setTimeout(function () {
          landscapeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }

    if (window.location.hash === '#training-env') {
      var trainingEl = document.getElementById('blog-training-collapsible');
      if (trainingEl) {
        trainingEl.open = true;
        setTimeout(function () {
          trainingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }

    if (window.location.hash === '#world-model') {
      var worldEl = document.getElementById('blog-world-model-collapsible');
      if (worldEl) {
        worldEl.open = true;
        setTimeout(function () {
          worldEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }
  }

  function getBlogHubData() {
    var base = window.RESUME && window.RESUME.zh;
    if (!base) return Promise.resolve(null);

    function loadHub() {
      if (
        window.BLOG_AUTH_CONFIG &&
        window.BLOG_AUTH_CONFIG.encryption &&
        window.BlogCrypto &&
        window.BlogCrypto.decryptEncUrl &&
        blogEncryptionReady()
      ) {
        return window.BlogCrypto.decryptEncUrl(blogAssetUrl('hub-series.enc.json')).then(function (text) {
          var hub = JSON.parse(text);
          var langHub = (hub && hub.zh) || hub || {};
          return Object.assign({}, base, langHub);
        });
      }
      return Promise.resolve(base);
    }

    return new Promise(function (resolve) {
      whenBlogEncryptionReady(function () {
        loadHub().then(resolve).catch(function () {
          resolve(base);
        });
      });
    });
  }

  function initPage() {
    document.documentElement.setAttribute('data-lang', 'zh');
    document.documentElement.setAttribute('lang', 'zh-CN');

    getBlogHubData().then(function (d) {
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

      document.title = (d.blogHubTitle || '技术博客') + ' · ' + (d.centerName || 'Wenpeng Xing');

      renderBlogHubSeries(d);
    });
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
    function boot() {
      initPage();
      setupNavToggle();
    }
    if (window.BlogAuth && window.BlogAuth.requireAuth) {
      window.BlogAuth.requireAuth(boot);
    } else {
      boot();
    }
  });
})();
