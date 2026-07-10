(function () {
  'use strict';

  var LANGS = window.LANGS || ['zh', 'zhtw', 'en', 'ja', 'ko', 'th'];
  var currentLang = 'zh';
  var fromStorage = false;
  try {
    var stored = localStorage.getItem('site-lang');
    if (stored && LANGS.indexOf(stored) !== -1) {
      currentLang = stored;
      fromStorage = true;
    }
  } catch (e) { /* localStorage unavailable */ }

  function setLang(lang) {
    if (!lang || LANGS.indexOf(lang) === -1) lang = 'zh';
    currentLang = lang;
    try { localStorage.setItem('site-lang', lang); } catch (e) { /* ignore */ }
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : lang === 'zhtw' ? 'zh-TW' : lang === 'ja' ? 'ja' : lang === 'ko' ? 'ko' : lang === 'th' ? 'th' : 'en');

    var langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = lang;
    document.querySelectorAll('.skip-link').forEach(function (el) {
      el.hidden = !el.classList.contains('lang-' + lang);
    });

    var d = window.RESUME && (window.RESUME[lang] || window.RESUME.en);
    if (d) {
      renderNav(d.nav);
      renderQuickNav(d.nav);
      renderStaticStrings(d, lang);
    }
    if (window.RESUME) renderDynamicContent(lang);

    var iframe = document.getElementById('research-topology-iframe');
    if (iframe) {
      iframe.src = 'agent-trust-governance.html?embed=1&lang=' + encodeURIComponent(lang);
    }
  }

  function blogHubHref() {
    if (window.SITE_PATHS && window.SITE_PATHS.blogs) return window.SITE_PATHS.blogs;
    try {
      return new URL('blogs/', window.location.href).pathname;
    } catch (e) {
      return 'blogs/';
    }
  }

  function renderNav(nav) {
    var el = document.getElementById('main-nav');
    if (!el || !nav) return;
    var piLead = nav.piLead ? '<li><a href="#pi-info">' + nav.piLead + '</a></li>' : '';
    var blogHref = blogHubHref();
    var html = '<ul><li><a href="#content">' + nav.home + '</a></li><li><a href="#news">' + nav.news + '</a></li><li><a href="' + blogHref + '">' + nav.blogs + '</a></li><li><a href="#about">' + nav.about + '</a></li>' + piLead + '<li><a href="#research">' + nav.research + '</a></li><li><a href="#people">' + nav.people + '</a></li><li><a href="#publications">' + nav.papers + '</a></li><li><a href="#patents">' + nav.patents + '</a></li><li><a href="#gallery">' + nav.gallery + '</a></li><li><a href="#contact">' + nav.contact + '</a></li></ul>';
    el.innerHTML = html;
  }

  function renderQuickNav(nav) {
    var el = document.getElementById('quick-nav');
    if (!el || !nav) return;
    var blogHref = blogHubHref();
    var links = [
      { href: '#news', label: nav.news },
      { href: blogHref, label: nav.blogs },
      { href: '#about', label: nav.about },
      { href: '#pi-info', label: nav.piLead || '' },
      { href: '#research', label: nav.research },
      { href: '#people', label: nav.people },
      { href: '#publications', label: nav.papers },
      { href: '#patents', label: nav.patents },
      { href: '#gallery', label: nav.gallery },
      { href: '#contact', label: nav.contact }
    ].filter(function (l) { return l.label; });
    el.innerHTML = links.map(function (l) {
      return '<a href="' + l.href + '">' + l.label + '</a>';
    }).join('');
  }

  function resolveAboutCopy(d, lang) {
    if (d.aboutContent) return d;
    if (lang === 'zhtw' && window.RESUME && window.RESUME.zh && window.RESUME.zh.aboutContent) {
      return Object.assign({}, d, { aboutTitle: '實習生招聘啟事', aboutContent: window.RESUME.zh.aboutContent });
    }
    if (window.RESUME && window.RESUME.en && window.RESUME.en.aboutContent) {
      return Object.assign({}, d, {
        aboutTitle: window.RESUME.en.aboutTitle,
        aboutContent: window.RESUME.en.aboutContent
      });
    }
    return d;
  }

  function renderStaticStrings(d, lang) {
    var dAbout = resolveAboutCopy(d, lang || currentLang);
    if (d.centerName) {
      var logoEl = document.querySelector('.logo');
      if (logoEl) logoEl.textContent = d.centerName;
      var heroTitle = document.querySelector('.hero h1');
      if (heroTitle) heroTitle.textContent = d.centerName;
      document.title = d.centerName;
      var footerCenter = document.getElementById('footer-center-name');
      if (footerCenter) footerCenter.textContent = d.centerName;
      var copyrightCenter = document.getElementById('copyright-center-name');
      if (copyrightCenter) copyrightCenter.textContent = d.centerName;
    }
    var heroSub = document.getElementById('hero-subtitle');
    if (heroSub && d.heroSubtitle) heroSub.textContent = d.heroSubtitle;
    var heroDesc = document.getElementById('hero-desc');
    if (heroDesc && d.heroDesc) heroDesc.textContent = d.heroDesc;
    var heroPi = document.getElementById('hero-pi');
    if (heroPi && d.heroPi) heroPi.innerHTML = d.heroPi;
    var aboutTitle = document.getElementById('about-title');
    if (aboutTitle && dAbout.aboutTitle) aboutTitle.textContent = dAbout.aboutTitle;
    var aboutContent = document.getElementById('about-content');
    if (aboutContent && dAbout.aboutContent) aboutContent.innerHTML = dAbout.aboutContent;
    var researchTitle = document.getElementById('research-title');
    if (researchTitle && d.researchTitle) researchTitle.textContent = d.researchTitle;
    var researchIntro = document.getElementById('research-topology-intro');
    if (researchIntro) {
      if (d.researchTopologyIntro) {
        researchIntro.textContent = d.researchTopologyIntro;
        researchIntro.style.display = '';
      } else {
        researchIntro.textContent = '';
        researchIntro.style.display = 'none';
      }
    }
    var researchIframe = document.getElementById('research-topology-iframe');
    if (researchIframe && d.researchTopologyIframeTitle) researchIframe.setAttribute('title', d.researchTopologyIframeTitle);
    var peopleTitle = document.getElementById('people-title');
    if (peopleTitle && d.peopleTitle) peopleTitle.textContent = d.peopleTitle;
    var peopleIntro = document.getElementById('people-intro');
    if (peopleIntro) {
      if (d.peopleIntro) {
        peopleIntro.textContent = d.peopleIntro;
      } else {
        peopleIntro.style.display = 'none';
      }
    }
    var newsTitle = document.getElementById('news-title');
    if (newsTitle && d.newsTitle) newsTitle.textContent = d.newsTitle;
    var pubTitle = document.getElementById('pub-title');
    if (pubTitle && d.pubTitle) pubTitle.textContent = d.pubTitle;
    var pubJournalLabel = document.getElementById('pub-journal-label');
    if (pubJournalLabel && d.pubJournalLabel) pubJournalLabel.textContent = d.pubJournalLabel;
    var pubConfLabel = document.getElementById('pub-conf-label');
    if (pubConfLabel && d.pubConfLabel) pubConfLabel.textContent = d.pubConfLabel;
    var pubPreprintLabel = document.getElementById('pub-preprint-label');
    if (pubPreprintLabel && d.pubPreprintLabel) pubPreprintLabel.textContent = d.pubPreprintLabel;
    var patentsTitle = document.getElementById('patents-title');
    if (patentsTitle && d.patentsTitle) patentsTitle.textContent = d.patentsTitle;
    var galleryTitle = document.getElementById('gallery-title');
    if (galleryTitle && d.galleryTitle) galleryTitle.textContent = d.galleryTitle;
    var leadersTitle = document.getElementById('leaders-title');
    if (leadersTitle && d.leadersTitle) leadersTitle.textContent = d.leadersTitle;
    var postdocsTitle = document.getElementById('postdocs-title');
    if (postdocsTitle && d.postdocsTitle) postdocsTitle.textContent = d.postdocsTitle;
    var scholarsTitleEl = document.getElementById('scholars-title');
    if (scholarsTitleEl && d.scholarsTitle) scholarsTitleEl.textContent = d.scholarsTitle;
    var alumniTitleEl = document.getElementById('alumni-title');
    if (alumniTitleEl && d.alumniTitle) alumniTitleEl.textContent = d.alumniTitle;
    var collaboratorsTitleEl = document.getElementById('collaborators-title');
    if (collaboratorsTitleEl && d.collaboratorsTitle) collaboratorsTitleEl.textContent = d.collaboratorsTitle;
    var footerAffiliation = document.getElementById('footer-affiliation');
    if (footerAffiliation && d.footerAffiliation) footerAffiliation.textContent = d.footerAffiliation;
    var footerContactLabel = document.getElementById('footer-contact-label');
    if (footerContactLabel && d.footerContactLabel) footerContactLabel.textContent = d.footerContactLabel;
    var footerLocation = document.getElementById('footer-location');
    if (footerLocation && d.footerLocation) footerLocation.textContent = d.footerLocation;

    // Set aria-labels and other accessibility attributes
    var navEl = document.getElementById('main-nav');
    if (navEl && d.navAriaLabel) navEl.setAttribute('aria-label', d.navAriaLabel);
    var menuToggle = document.querySelector('.nav-toggle');
    if (menuToggle && d.menuAriaLabel) menuToggle.setAttribute('aria-label', d.menuAriaLabel);
    var heroSection = document.querySelector('.hero');
    if (heroSection && d.heroAriaLabel) heroSection.setAttribute('aria-label', d.heroAriaLabel);
    var heroBg = document.querySelector('.hero-bg');
    if (heroBg && d.heroBgAriaLabel) heroBg.setAttribute('aria-label', d.heroBgAriaLabel);
    var zjuLogo = document.querySelector('.header-zju-logo');
    if (zjuLogo && d.zjuTitle) zjuLogo.setAttribute('title', d.zjuTitle);
    var zjuImg = document.querySelector('.header-zju-logo img');
    if (zjuImg && d.zjuAlt) zjuImg.setAttribute('alt', d.zjuAlt);
    var ibjLogo = document.querySelector('.header-ibj-logo');
    if (ibjLogo && d.ibjTitle) ibjLogo.setAttribute('title', d.ibjTitle);
    var ibjImg = document.querySelector('.header-ibj-logo img');
    if (ibjImg && d.ibjAlt) ibjImg.setAttribute('alt', d.ibjAlt);
    var lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg && d.lightboxImageAlt) lightboxImg.setAttribute('alt', d.lightboxImageAlt);
    
    // Update gallery image alt texts
    var galleryImages = document.querySelectorAll('.gallery-item img');
    if (galleryImages && d.galleryImageAlt) {
      galleryImages.forEach(function(img) {
        img.setAttribute('alt', d.galleryImageAlt);
      });
    }
  }

  function renderDynamicContent(lang) {
    if (!window.RESUME) return;
    var d = window.RESUME[lang] || window.RESUME.en;
    if (!d) return;

    if (d.leaders) renderPeople(d.leaders, 'leaders-list');
    if (d.postdocs) renderPeople(d.postdocs, 'postdocs-list');
    renderScholars(d.scholars || []);
    renderAlumni(d.alumni || []);
    renderCollaborators(d.collaborators || []);
    setPeopleBlockVisible('leaders-title', 'leaders-list', !!(d.leaders && d.leaders.length));
    setPeopleBlockVisible('postdocs-title', 'postdocs-list', !!(d.postdocs && d.postdocs.length));
    setPeopleBlockVisible('collaborators-title', 'collaborators-list', !!(d.collaborators && d.collaborators.length));
    if (d.news) renderNews(d.news);

    if (d.pi) renderPiDetail(d.pi, lang, d.nav && d.nav.piLead);

    var pf = window.PATENTS_FULL && (window.PATENTS_FULL[lang] || window.PATENTS_FULL.en);
    if (pf) renderPatentsFull(pf);

    if (window.PAPERS) renderPapers(lang);
    
    // Render gallery with current language
    renderGallery();
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parsePatentItem(item) {
    var str = String(item).trim();
    var m = str.match(/^(.+?)\s*\[(已授权|受理中|Granted|Pending)\]\s*$/i);
    if (m) {
      var raw = m[2];
      var granted = /已授权|Granted/i.test(raw);
      var statusKey = granted ? 'granted' : 'pending';
      var status = granted
        ? (/Granted/i.test(raw) ? 'Granted' : '已授权')
        : (/Pending/i.test(raw) ? 'Pending' : '受理中');
      return { title: m[1].trim(), status: status, statusKey: statusKey };
    }
    var granted2 = /已授权|Granted/i.test(str);
    var pending2 = /在审|Submitted|受理中|Pending/i.test(str);
    var titleMatch = str.match(/^(.+?)。/);
    var title = titleMatch ? titleMatch[1] + '。' : str;
    if (granted2 || pending2) {
      return {
        title: title,
        status: granted2 ? (langStatusLabel('granted', currentLang)) : langStatusLabel('pending', currentLang),
        statusKey: granted2 ? 'granted' : 'pending'
      };
    }
    return { title: str, status: null, statusKey: 'unknown' };
  }

  function langStatusLabel(key, lang) {
    if (key === 'granted') {
      return (lang === 'en' || lang === 'ja' || lang === 'ko' || lang === 'th') ? 'Granted' : '已授权';
    }
    return (lang === 'en' || lang === 'ja' || lang === 'ko' || lang === 'th') ? 'Pending' : '在审';
  }

  function renderPatentCard(item) {
    var p = parsePatentItem(item);
    var cls = 'patent-card patent-' + p.statusKey;
    var html = '<article class="' + cls + '">';
    html += '<div class="patent-card-badges' + (p.status ? '' : ' is-empty') + '">';
    if (p.status) {
      html += '<span class="patent-card-status patent-status-' + p.statusKey + '">' + escHtml(p.status) + '</span>';
    }
    html += '</div>';
    html += '<span class="patent-card-title">' + escHtml(p.title) + '</span></article>';
    return html;
  }

  function renderPatentsFull(data) {
    var el = document.getElementById('patents-content');
    if (!data || !el) return;
    if (!data.categories || !data.categories.length) return;
    var html = '<div class="patents-layout">';
    data.categories.forEach(function (cat) {
      if (!cat || !cat.items || !cat.items.length) return;
      html += '<section class="patent-panel"><h3 class="patent-panel-title">' + escHtml(cat.title || '') + '</h3>';
      html += '<div class="patents-grid">';
      cat.items.forEach(function (item) {
        html += renderPatentCard(item);
      });
      html += '</div></section>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  var JOURNAL_IF_RULES = [
    { re: /ACM Computing Surveys/i, if: 23.8 },
    { re: /IEEE Transactions on Image Processing|\bIEEE TIP\b/i, if: 13.7 },
    { re: /Machine Intelligence Research|\bMIR\b/i, if: 8.7 },
    { re: /IEEE TIFS|Transactions on Information Forensics and Security/i, if: 8.0 },
    { re: /SCIENTIA SINICA Informationis|SCIENCE CHINA Information Sciences/i, if: 7.6 },
    { re: /Computers in Human Behavior/i, if: 9.9 }
  ];

  var JOURNAL_SCI_RULES = [
    { re: /ACM Computing Surveys/i, sci: 1, sciTop: true },
    { re: /SCIENTIA SINICA Informationis|SCIENCE CHINA Information Sciences/i, sci: 1, sciTop: true },
    { re: /IEEE TIFS|Transactions on Information Forensics and Security/i, sci: 1, sciTop: true },
    { re: /Machine Intelligence Research|\bMIR\b/i, sci: 2 },
    { re: /IEEE Transactions on Image Processing|\bIEEE TIP\b/i, sci: 1, sciTop: true },
    { re: /Computers in Human Behavior/i, sci: 1, sciTop: true }
  ];

  function formatIFLabel(ifVal, ifNote, lang) {
    var n = Number(ifVal);
    if (!isFinite(n)) return '';
    var s = (Math.round(n * 100) / 100).toString();
    if (s.indexOf('.') !== -1) s = s.replace(/\.?0+$/, '');
    if (ifNote === 'composite') {
      return (lang === 'en') ? ('IF ' + s + ' (composite)') : ('IF ' + s + '（综合）');
    }
    return 'IF ' + s;
  }

  function resolveJournalIF(item, text) {
    if (item && item.if != null && isFinite(Number(item.if))) {
      return { value: Number(item.if), note: item.ifNote || null };
    }
    for (var i = 0; i < JOURNAL_IF_RULES.length; i++) {
      var rule = JOURNAL_IF_RULES[i];
      if (rule.re.test(text)) {
        return { value: rule.if, note: rule.ifNote || null };
      }
    }
    return null;
  }

  function formatSciLabel(sciMeta, lang) {
    if (!sciMeta || !sciMeta.zone) return '';
    var en = lang === 'en' || lang === 'ja' || lang === 'ko' || lang === 'th';
    var zoneLabel = en ? ('Zone ' + sciMeta.zone) : (sciMeta.zone + '区');
    var label = en ? ('SCI ' + zoneLabel) : ('SCI ' + zoneLabel);
    if (sciMeta.top) label += ' TOP';
    return label;
  }

  function resolveJournalSci(item, text) {
    if (item && item.sci != null && isFinite(Number(item.sci))) {
      return { zone: Number(item.sci), top: !!item.sciTop };
    }
    for (var i = 0; i < JOURNAL_SCI_RULES.length; i++) {
      var rule = JOURNAL_SCI_RULES[i];
      if (rule.re.test(text)) {
        return { zone: rule.sci, top: !!rule.sciTop };
      }
    }
    return null;
  }

  function parsePaperCite(item, section, lang) {
    var cite = (item && item.cite) ? item.cite : String(item);
    var html = String(cite);
    var badges = [];
    var text = html;
    var isFindings = /\bFindings\b/i.test(text);
    var isWorkshop = /\bworkshop\b/i.test(text);

    var ccf = text.match(/\bCCF-([ABC])\b/i);
    if (ccf) {
      var tier = ccf[1].toUpperCase();
      if (isFindings) {
        badges.push({ label: 'Findings', key: 'findings' });
      } else {
        badges.push({ label: 'CCF-' + tier, key: 'ccf-' + tier.toLowerCase() });
      }
      text = text.replace(/\s*\.?\s*CCF-[ABC]\s*\.?\s*/gi, ' ');
    } else if (isFindings) {
      badges.push({ label: 'Findings', key: 'findings' });
    }

    if (isWorkshop) {
      badges.push({ label: 'Workshop', key: 'workshop' });
    }

    text = text.replace(/\s*\.?\s*IF[:\s]+[\d.]+\s*\.?\s*/gi, ' ');
    text = text.replace(/\s*\.?\s*高IF\s*\.?\s*/g, ' ');
    text = text.replace(/\s*\.?\s*SCI\s*[1-4]\s*区(?:\s*TOP)?\s*\.?\s*/gi, ' ');

    if (section === 'journal') {
      var sciMeta = resolveJournalSci(typeof item === 'object' ? item : null, text);
      if (sciMeta) {
        badges.push({
          label: formatSciLabel(sciMeta, lang),
          key: sciMeta.top ? 'sci-top' : 'sci'
        });
      }
      var ifMeta = resolveJournalIF(typeof item === 'object' ? item : null, text);
      if (ifMeta) {
        badges.push({
          label: formatIFLabel(ifMeta.value, ifMeta.note, lang),
          key: ifMeta.note === 'composite' ? 'if-composite' : 'if'
        });
      }
    }

    if (section === 'preprints') {
      if (/\barXiv\b/i.test(text)) {
        badges.push({ label: 'arXiv', key: 'arxiv' });
      }
      text = text.replace(/\s*\.?\s*arXiv,?\s*\d{4}\s*\.?\s*/gi, ' ');
      text = text.replace(/\s*\.?\s*\[Under review\]\s*\.?\s*/gi, ' ');
    }

    text = text.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').replace(/\.\s*\./g, '.').trim();
    return { bodyHtml: text, badges: badges };
  }

  function renderPaperCard(item, sectionKey, lang) {
    var parsed = parsePaperCite(item, sectionKey, lang);
    var html = '<article class="paper-card">';
    html += '<div class="paper-card-badges' + (parsed.badges.length ? '' : ' is-empty') + '">';
    parsed.badges.forEach(function (b) {
      if (b.stacked && b.sublabel) {
        html += '<span class="paper-card-badge paper-card-badge-stack paper-badge-' + b.key + '">'
          + '<span class="paper-card-badge-line">' + escHtml(b.label) + '</span>'
          + '<span class="paper-card-badge-line paper-card-badge-sub">' + escHtml(b.sublabel) + '</span>'
          + '</span>';
      } else {
        html += '<span class="paper-card-badge paper-badge-' + b.key + '">' + escHtml(b.label) + '</span>';
      }
    });
    html += '</div>';
    html += '<span class="paper-card-title">' + parsed.bodyHtml + '</span></article>';
    return html;
  }

  function renderPapers(lang) {
    var P = window.PAPERS;
    if (!P) return;
    lang = lang || currentLang;
    var keyToId = { journal: 'papers-journal', conference: 'papers-conf', preprints: 'papers-preprints' };

    function getYear(cite) {
      var match = cite.match(/\b(20\d{2})\b/);
      return match ? parseInt(match[1], 10) : 0;
    }

    function sortPapersByYear(papers) {
      return papers.slice().sort(function (a, b) {
        return getYear(b.cite) - getYear(a.cite);
      });
    }

    ['journal', 'conference', 'preprints'].forEach(function (key) {
      var el = document.getElementById(keyToId[key]);
      if (!el || !P[key]) return;
      var sortedPapers = sortPapersByYear(P[key]);
      el.innerHTML = sortedPapers.map(function (item) {
        return renderPaperCard(item, key, lang);
      }).join('');
    });
  }

  function escapeHtml(s) {
    if (s == null || s === '') return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function piDetailLabels(lang) {
    var map = {
      zh: { work: '工作经历', edu: '教育背景' },
      zhtw: { work: '工作經歷', edu: '教育背景' },
      en: { work: 'Work experience', edu: 'Education' },
      ja: { work: '職歴', edu: '学歴' },
      ko: { work: '경력', edu: '학력' },
      th: { work: 'ประสบการณ์การทำงาน', edu: 'การศึกษา' }
    };
    return map[lang] || map.en;
  }

  function renderPiDetail(pi, lang, sectionHeading) {
    var el = document.getElementById('pi-detail-content');
    if (!el) return;
    if (!pi || !pi.name) {
      el.innerHTML = '';
      return;
    }
    var L = piDetailLabels(lang);
    var photoSrc = (pi.avatar && String(pi.avatar).trim()) ? pi.avatar.trim() : getAvatarUrl(pi.gender, pi.name);
    var scholarHtml = pi.scholar ? '<a href="' + escapeHtml(pi.scholar) + '" target="_blank" rel="noopener">Google Scholar</a>' : '';
    var emailHtml = pi.email ? '<a href="mailto:' + escapeHtml(pi.email) + '">' + escapeHtml(pi.email) + '</a>' : '';
    var contactParts = [emailHtml, scholarHtml].filter(Boolean);
    var contactRow = contactParts.length ? '<p class="pi-contact">' + contactParts.join(' · ') + '</p>' : '';

    var html = '';
    if (sectionHeading) {
      html += '<h2 class="section-heading pi-section-heading">' + escapeHtml(sectionHeading) + '</h2>';
    }
    html += '<div class="pi-profile-layout">';
    html += '<div class="pi-photo-wrap"><img class="pi-photo" src="' + escapeHtml(photoSrc) + '" alt="" loading="lazy"></div>';
    html += '<div class="pi-profile-body">';
    html += '<h3 class="pi-name">' + escapeHtml(pi.name) + '</h3>';
    if (pi.role) html += '<p class="pi-role">' + escapeHtml(pi.role) + '</p>';
    if (pi.bio) html += '<p class="pi-bio">' + escapeHtml(pi.bio) + '</p>';
    html += contactRow;

    if (pi.workExperience && pi.workExperience.length) {
      html += '<div class="research-block pi-exp-block"><h4 class="research-block-title">' + escapeHtml(L.work) + '</h4><ul class="pi-timeline">';
      pi.workExperience.forEach(function (w) {
        html += '<li><span class="pi-timeline-period">' + escapeHtml(w.period || '') + '</span>';
        html += '<span class="pi-timeline-body"><strong>' + escapeHtml(w.position || '') + '</strong>';
        if (w.organization) html += ' · ' + escapeHtml(w.organization);
        if (w.location) html += ' · ' + escapeHtml(w.location);
        if (w.description) html += '<span class="pi-timeline-desc">' + escapeHtml(w.description) + '</span>';
        html += '</span></li>';
      });
      html += '</ul></div>';
    }

    if (pi.education && pi.education.length) {
      html += '<div class="research-block pi-exp-block"><h4 class="research-block-title">' + escapeHtml(L.edu) + '</h4><ul class="pi-timeline">';
      pi.education.forEach(function (ed) {
        html += '<li><span class="pi-timeline-period">' + escapeHtml(ed.period || '') + '</span>';
        html += '<span class="pi-timeline-body"><strong>' + escapeHtml(ed.degree || '') + '</strong>';
        if (ed.institution) html += ' · ' + escapeHtml(ed.institution);
        if (ed.location) html += ' · ' + escapeHtml(ed.location);
        if (ed.supervisor) html += '<span class="pi-timeline-desc">' + escapeHtml(ed.supervisor) + '</span>';
        html += '</span></li>';
      });
      html += '</ul></div>';
    }

    html += '</div></div>';
    el.innerHTML = html;
  }

  function hashCode(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
    return h;
  }
  function getAvatarUrl(gender, name) {
    var n = (name || '').trim() || 'M';
    // 对于中文名字，只取第一个字（姓氏）
    if (/^[\u4e00-\u9fa5]/.test(n)) {
      n = n.charAt(0);
    }
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(n) + '&background=0a0e14&color=58a6ff&size=128&bold=true';
  }
  function buildPersonCard(p) {
    var avatarUrl = (p.avatar && p.avatar.trim()) ? p.avatar : getAvatarUrl(p.gender, p.name);
    var emailPart = p.email ? '<a href="mailto:' + p.email + '" class="person-email">' + p.email + '</a>' : '';
    return '<div class="person-card"><div class="person-avatar" aria-hidden="true"><img src="' + avatarUrl + '" alt="" loading="lazy"></div><div class="person-info"><strong class="person-name">' + p.name + '</strong><span class="person-role">' + p.role + '</span>' + emailPart + '</div></div>';
  }
  function renderPeople(people, targetId) {
    var el = document.getElementById(targetId || 'people-list');
    if (!el) return;
    if (!people || !people.length) {
      el.innerHTML = '';
      return;
    }
    var html = '';
    people.forEach(function (p) { html += buildPersonCard(p); });
    el.innerHTML = html;
  }

  function setPeopleBlockVisible(titleId, listId, show) {
    var h = document.getElementById(titleId);
    var g = document.getElementById(listId);
    if (h) {
      h.hidden = !show;
      h.style.display = show ? '' : 'none';
    }
    if (g) {
      g.hidden = !show;
      g.style.display = show ? '' : 'none';
    }
  }
  function renderScholars(scholars) {
    var el = document.getElementById('scholars-list');
    if (!el) return;
    var html = (scholars && scholars.length) ? scholars.map(function (p) { return buildPersonCard(p); }).join('') : '';
    el.innerHTML = html;
  }
  function renderAlumni(alumni) {
    var el = document.getElementById('alumni-list');
    if (!el) return;
    var html = (alumni && alumni.length) ? alumni.map(function (p) { return buildPersonCard(p); }).join('') : '';
    el.innerHTML = html;
  }
  function renderCollaborators(collaborators) {
    var el = document.getElementById('collaborators-list');
    if (!el) return;
    var html = (collaborators && collaborators.length) ? collaborators.map(function (p) { return buildPersonCard(p); }).join('') : '';
    el.innerHTML = html;
  }

  function renderNews(news) {
    var el = document.getElementById('news-list');
    if (!el || !news || !news.length) return;
    var html = '';
    news.forEach(function (n) {
      html += '<article class="news-item"><time datetime="' + n.date + '">' + n.dateLabel + '</time><h3>' + (n.link ? '<a href="' + n.link + '">' + n.title + '</a>' : n.title) + '</h3><p>' + n.summary + '</p></article>';
    });
    el.innerHTML = html;
  }

  function renderTagCloud(data) {
    var el = document.getElementById('highlights-content');
    if (!data || !el) return;
    
    // Extract paper titles from window.PAPERS
    function extractPaperTitles() {
      var titles = [];
      if (window.PAPERS) {
        ['journal', 'conference', 'preprints'].forEach(function(type) {
          if (window.PAPERS[type]) {
            window.PAPERS[type].forEach(function(paper) {
              if (paper.cite) {
                // Extract title from <a> tag in cite string
                var match = paper.cite.match(/<a[^>]*>([^<]+)<\/a>/);
                if (match && match[1]) {
                  var title = match[1].trim();
                  if (titles.indexOf(title) === -1) {
                    titles.push(title);
                  }
                }
              }
            });
          }
        });
      }
      return titles;
    }
    
    // Extract patent titles from window.PATENTS_FULL
    function extractPatentTitles(lang) {
      var titles = [];
      if (window.PATENTS_FULL && window.PATENTS_FULL[lang]) {
        var categories = window.PATENTS_FULL[lang].categories || [];
        categories.forEach(function(category) {
          if (category.items) {
            category.items.forEach(function(patent) {
              // Extract title (text before first period or Chinese period)
              var title = patent.split('。')[0] || patent.split('.')[0];
              if (title && titles.indexOf(title) === -1) {
                titles.push(title.trim());
              }
            });
          }
        });
      }
      return titles;
    }
    
    // Get current language (use global currentLang variable)
    var lang = currentLang || 'zh';
    var allPaperTitles = extractPaperTitles();
    var allPatentTitles = extractPatentTitles(lang);
    
    // Match papers/patents to research directions based on keywords from HIGHLIGHTS items
    function matchPapersToDirection(blockTitle, subareaTitle, items) {
      var matchedTitles = [];
      if (!items || items.length === 0) return matchedTitles;
      
      // Use items as keywords to search in papers and patents
      items.forEach(function(item) {
        // Extract key terms from item (remove colons and common prefixes)
        var keywords = item.replace(/^[^：:]+[：:]?\s*/, '').split(/[，,、]/);
        keywords.push(item); // Also search the full item
        
        keywords.forEach(function(keyword) {
          var searchTerm = keyword.trim().toLowerCase();
          if (searchTerm.length < 3) return;
          
          // Match papers
          allPaperTitles.forEach(function(title) {
            var titleLower = title.toLowerCase();
            // Check if keyword appears in title
            if (titleLower.indexOf(searchTerm) !== -1 || searchTerm.indexOf(titleLower.substring(0, 20)) !== -1) {
              var exists = matchedTitles.some(function(m) {
                return m.type === 'paper' && m.title === title;
              });
              if (!exists) {
                matchedTitles.push({ type: 'paper', title: title });
              }
            }
          });
          
          // Match patents
          allPatentTitles.forEach(function(patentTitle) {
            var patentLower = patentTitle.toLowerCase();
            if (patentLower.indexOf(searchTerm) !== -1 || searchTerm.indexOf(patentLower.substring(0, 20)) !== -1) {
              var exists = matchedTitles.some(function(m) {
                return m.type === 'patent' && m.title === patentTitle;
              });
              if (!exists) {
                matchedTitles.push({ type: 'patent', title: patentTitle });
              }
            }
          });
        });
      });
      
      return matchedTitles;
    }
    
    // Color palette based on theme colors - blue/cyan variations
    var colorPalette = [
      '#58a6ff', // --color-accent (primary blue)
      '#00d4ff', // --color-cyan (cyan)
      '#79b8ff', // --color-accent-hover (light blue)
      '#4a9eff', // darker blue
      '#00b8e6', // darker cyan
      '#5cc8ff', // light cyan
      '#6ba3ff', // medium blue
      '#00e5ff', // bright cyan
      '#8cc8ff', // very light blue
      '#3d8eff'  // deep blue
    ];
    
    var html = '<div class="tagcloud-layout">';
    html += '<div class="tagcloud-tags">';
    
    var allTags = [];
    var tagIndex = 0;
    
    data.forEach(function (block, blockIdx) {
      // Assign color based on block index
      var blockColor = colorPalette[blockIdx % colorPalette.length];
      
      // Collect all items from subareas for this block
      var allBlockItems = [];
      if (block.subareas) {
        block.subareas.forEach(function (subarea) {
          if (subarea.items) {
            allBlockItems = allBlockItems.concat(subarea.items);
          }
        });
      }
      
      // Match papers/patents to this research direction using items
      var blockItems = matchPapersToDirection(block.title, '', allBlockItems);
      
      allTags.push({
        text: block.title, 
        size: 2, 
        type: 'main',
        items: blockItems,
        index: tagIndex++,
        color: blockColor
      });
      
      if (block.subareas) {
        block.subareas.forEach(function (subarea) {
          var subareaItems = matchPapersToDirection(block.title, subarea.title, subarea.items || []);
          allTags.push({
            text: subarea.title, 
            size: 1, 
            type: 'sub',
            items: subareaItems,
            index: tagIndex++,
            color: blockColor // Same color as parent block
          });
        });
      }
    });
    
    // Shuffle for visual effect
    allTags.sort(function() { return Math.random() - 0.5; });
    
    allTags.forEach(function (tag) {
      var size = tag.size === 2 ? 'large' : 'medium';
      
      html += '<span class="tag tag-' + size + ' tag-' + tag.type + '" style="border-color: ' + tag.color + '; box-shadow: 0 0 8px ' + tag.color + '40;">';
      html += tag.text;
      html += '</span>';
    });
    
    html += '</div></div>';
    el.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (fromStorage) {
      setLang(currentLang);
    } else {
      setLang('zh');
    }

    var langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', function () {
        setLang(langSelect.value);
      });
    }

    window.addEventListener('message', function (ev) {
      var data = ev.data;
      if (!data || data.type !== 'ifrc-topology-height') return;
      var iframe = document.getElementById('research-topology-iframe');
      if (!iframe) return;
      var h = parseInt(data.height, 10);
      if (h >= 400 && h <= 24000) iframe.style.height = h + 'px';
    });

    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !expanded);
        nav.classList.toggle('is-open');
      });
      /* 手机端：点击导航链接后关闭菜单 */
      nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    var header = document.querySelector('.site-header');
    var hero = document.querySelector('.hero');
    if (header && hero) {
      function updateHeaderOverHero() {
        var heroBottom = hero.getBoundingClientRect().bottom;
        var headerHeight = header.offsetHeight || 72;
        header.classList.toggle('is-over-hero', heroBottom > headerHeight);
      }
      updateHeaderOverHero();
      window.addEventListener('scroll', updateHeaderOverHero);
      window.addEventListener('resize', updateHeaderOverHero);
    }

    // Setup lightbox (gallery will be rendered by renderDynamicContent)
    setupLightbox();
  });


  function encodeGalleryPath(relPath) {
    return relPath.split('/').map(function (seg) {
      return encodeURIComponent(seg);
    }).join('/');
  }

  function renderGallery() {
    var el = document.getElementById('gallery-content');
    if (!el) return;
    
    // Get current language for alt text
    var d = window.RESUME && (window.RESUME[currentLang] || window.RESUME.en);
    var altText = (d && d.galleryImageAlt) ? d.galleryImageAlt : 'Lab photo';
    
    var images = [
      'gallery_photo/1.png',
      'gallery_photo/2.png',
      'gallery_photo/3.png',
      'gallery_photo/4.png',
      'gallery_photo/5.png',
      'gallery_photo/6.png',
      'gallery_photo/7.gif',
      'gallery_photo/8.png',
      'gallery_photo/9.png',
      'gallery_photo/10.png',
      'gallery_photo/11.png',
      'gallery_photo/12.png',
      'gallery_photo/13.png',
      'gallery_photo/gallery_A.png',
      'gallery_photo/gallery_B.png',
      'gallery_photo/gallery_C.png'
    ];
    
    var html = '';
    images.forEach(function(img) {
      var src = encodeGalleryPath(img);
      html += '<div class="gallery-item">';
      html += '<img src="' + src + '" alt="' + escapeHtml(altText) + '" loading="lazy">';
      html += '</div>';
    });
    el.innerHTML = html;
  }

  function setupLightbox() {
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    var lightboxClose = document.getElementById('lightbox-close');
    var galleryContent = document.getElementById('gallery-content');
    
    if (!lightbox || !lightboxImg) return;
    
    if (galleryContent) {
      galleryContent.addEventListener('click', function (e) {
        var img = e.target && e.target.closest ? e.target.closest('.gallery-item img') : null;
        if (!img || !galleryContent.contains(img)) return;
        lightboxImg.src = img.currentSrc || img.src;
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      });
    }
    
    function closeLightbox() {
      lightbox.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
    
    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }
    
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && lightbox.style.display === 'flex') {
        closeLightbox();
      }
    });
  }
})();
