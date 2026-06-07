(function () {
  'use strict';

  var LANGS = window.LANGS || ['zh', 'zhtw', 'en', 'ja', 'ko', 'th'];
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

    var centerName = document.getElementById('nav-center-name');
    if (centerName) {
      centerName.textContent = d.centerName || "Xing's Group";
      centerName.href = homeBase();
    }

    var copyright = document.getElementById('copyright-center-name');
    if (copyright && d.centerName) copyright.textContent = d.centerName;

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
    if (desc) desc.textContent = d.blogHubDesc || '';

    document.title = (d.blogHubTitle || 'Blog') + " · " + (d.centerName || "Xing's Group");

    renderPlatforms(d);
  }

  function renderPlatforms(d) {
    var root = document.getElementById('blog-platforms');
    if (!root || !d.blogPlatforms || !d.blogPlatforms.length) {
      if (root) root.innerHTML = '';
      return;
    }

    var readMore = d.blogHubReadMore || '→';
    root.innerHTML = d.blogPlatforms.map(function (p) {
      var href = platformHref(p.link);
      var tags = (p.tags || []).map(function (t) {
        return '<span class="blog-tag">' + t + '</span>';
      }).join('');
      var updated = p.updatedLabel
        ? '<time class="blog-platform-updated">' + p.updatedLabel + '</time>'
        : '';
      return (
        '<article class="blog-platform-card">' +
          '<div class="blog-platform-head">' +
            '<span class="blog-platform-vendor">' + p.vendor + '</span>' +
            updated +
          '</div>' +
          '<h2><a href="' + href + '">' + p.title + '</a></h2>' +
          (tags ? '<div class="blog-tags">' + tags + '</div>' : '') +
          '<p>' + p.summary + '</p>' +
          '<a class="blog-read-more" href="' + href + '">' + readMore + '</a>' +
        '</article>'
      );
    }).join('');
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
