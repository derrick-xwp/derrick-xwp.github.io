(function () {
  'use strict';

  var LEGACY_HASH_ROUTES = {
    '#policy-data': 'policy-data/',
    '#pipeline': 'pipeline/',
    '#method-landscape': 'method-landscape/',
    '#training-env': 'training-env/',
    '#world-model': 'world-model/',
    '#embodied-platforms': 'embodied-platforms/主页.html',
    '#embodied': 'embodied-platforms/主页.html'
  };

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
    var clean = link.replace(/^\.\//, '');
    if (window.SITE_PATHS && window.SITE_PATHS.blogs) {
      if (clean.indexOf('blogs/') === 0) {
        var home = window.SITE_PATHS.home || '/';
        return home.replace(/\/?$/, '/') + clean;
      }
      return window.SITE_PATHS.blogs + clean;
    }
    return link;
  }

  function redirectLegacyHash() {
    var hash = window.location.hash;
    if (!hash || !LEGACY_HASH_ROUTES[hash]) return false;
    window.location.replace(platformHref(LEGACY_HASH_ROUTES[hash]));
    return true;
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

  function renderBlogList(d) {
    var blogs = d.blogs;
    if (!blogs || !blogs.length) return '';

    var groups = d.blogGroups || [];
    var grouped = {};
    var groupOrder = [];

    groups.forEach(function (g) {
      grouped[g.id] = [];
      groupOrder.push(g.id);
    });
    grouped._other = [];

    blogs.forEach(function (b) {
      var gid = b.group && grouped[b.group] ? b.group : '_other';
      if (!grouped[gid]) grouped[gid] = [];
      if (gid !== '_other' && groupOrder.indexOf(gid) < 0) groupOrder.push(gid);
      grouped[gid].push(b);
    });

    function blogCardHtml(b) {
      var href = platformHref(b.link);
      var tags = (b.tags || [])
        .map(function (t) {
          return '<span class="blog-tag">' + t + '</span>';
        })
        .join('');
      var thumb = b.image
        ? '<div class="blog-card-thumb"><img src="' + b.image + '" alt="" loading="lazy" decoding="async"></div>'
        : '<div class="blog-card-thumb blog-card-thumb--empty" aria-hidden="true"></div>';
      return (
        '<article class="blog-card">' +
          '<a class="blog-card-link" href="' + href + '">' +
            thumb +
            '<div class="blog-card-body">' +
              '<time datetime="' + (b.date || '') + '">' + (b.dateLabel || b.date || '') + '</time>' +
              '<h3>' + b.title + '</h3>' +
              '<p>' + (b.summary || '') + '</p>' +
              (tags ? '<div class="blog-tags">' + tags + '</div>' : '') +
            '</div>' +
          '</a>' +
        '</article>'
      );
    }

    function renderGroupSection(gid, meta) {
      var items = grouped[gid];
      if (!items || !items.length) return '';
      var title = meta && meta.title ? meta.title : '';
      var desc = meta && meta.desc ? '<p class="blog-hub-group-desc">' + meta.desc + '</p>' : '';
      var sectionId = gid === '_other' ? '' : ' id="blog-group-' + gid + '"';
      return (
        '<section class="blog-hub-group"' + sectionId + '>' +
          (title
            ? '<header class="blog-hub-group-head"><h2 class="blog-hub-group-title">' + title + '</h2>' + desc + '</header>'
            : '') +
          '<div class="blog-card-grid">' + items.map(blogCardHtml).join('') + '</div>' +
        '</section>'
      );
    }

    var html = '<div class="blog-hub-groups" aria-label="博客导航">';
    groups.forEach(function (g) {
      html += renderGroupSection(g.id, g);
    });
    if (grouped._other.length) {
      html += renderGroupSection('_other', null);
    }
    html += '</div>';
    return html;
  }

  function renderBlogHubSeries(d) {
    var root = document.getElementById('blog-hub-series');
    if (!root) return;
    root.innerHTML = renderBlogList(d);
  }

  function getBlogHubData() {
    return Promise.resolve(window.RESUME && window.RESUME.zh);
  }

  function initPage() {
    if (redirectLegacyHash()) return;

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

      var desc = document.getElementById('blog-hub-desc');
      if (desc && d.blogHubDesc) {
        desc.textContent = d.blogHubDesc;
        desc.hidden = false;
      } else if (desc) {
        desc.hidden = true;
      }

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
