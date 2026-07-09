/**
 * 博客访问控制：密码解锁 + 客户端解密（AES-GCM）。
 */
(function (global) {
  'use strict';

  function getCfg() {
    return global.BLOG_AUTH_CONFIG || {};
  }

  function useEncryption() {
    return getCfg().encryption !== false && !!global.BlogCrypto;
  }

  function storageKey() {
    return getCfg().storageKey || 'hk2026-blog-unlock-v1';
  }

  function sessionMs() {
    return (getCfg().sessionHours || 12) * 60 * 60 * 1000;
  }

  function isBlogProtectedPage() {
    if (global.location.protocol === 'file:') {
      return /[\\/]blogs([\\/]|$)/i.test(global.location.pathname);
    }
    return /\/blogs(\/|$)/.test(global.location.pathname);
  }

  function clearLegacySession() {
    try {
      global.sessionStorage.removeItem(storageKey());
    } catch (e) { /* ignore */ }
  }

  function isUnlocked() {
    if (!isBlogProtectedPage()) return true;
    if (useEncryption()) {
      return global.BlogCrypto.hasKey();
    }
    try {
      var raw = global.sessionStorage.getItem(storageKey());
      if (!raw) return false;
      var data = JSON.parse(raw);
      return !!(data && data.ok && data.exp && Date.now() <= data.exp);
    } catch (e) {
      return false;
    }
  }

  function writeSessionMarker() {
    try {
      global.sessionStorage.setItem(storageKey(), JSON.stringify({
        ok: true,
        exp: Date.now() + sessionMs(),
      }));
    } catch (e) { /* ignore */ }
  }

  function clearSession() {
    clearLegacySession();
    if (global.BlogCrypto && global.BlogCrypto.clearKey) {
      global.BlogCrypto.clearKey();
    }
  }

  function afterUnlock() {
    var chain = Promise.resolve();
    if (useEncryption() && global.BlogCrypto.decryptAllOnPage) {
      chain = global.BlogCrypto.decryptAllOnPage();
    }
    return chain.then(function () {
      global.document.documentElement.classList.remove('blog-auth-pending', 'blog-auth-locked');
      var gate = global.document.getElementById('blog-auth-gate');
      if (gate) gate.remove();
      addLogoutLink();
      global.dispatchEvent(new Event('blog-auth-ready'));
    });
  }

  function unlockPage() {
    return afterUnlock();
  }

  function mountGate() {
    var doc = global.document;
    if (doc.getElementById('blog-auth-gate')) return;

    doc.documentElement.classList.add('blog-auth-locked');
    doc.documentElement.classList.remove('blog-auth-pending');

    var c = getCfg();
    var gate = doc.createElement('div');
    gate.id = 'blog-auth-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'blog-auth-title');

    gate.innerHTML =
      '<div class="blog-auth-card">' +
      '<h2 id="blog-auth-title">' + esc(c.title || '技术博客访问验证') + '</h2>' +
      '<p>' + esc(c.hint || '请输入博客访问密码以继续阅读。') + '</p>' +
      '<form class="blog-auth-form" id="blog-auth-form" autocomplete="off">' +
      '<label for="blog-auth-password">访问密码</label>' +
      '<input id="blog-auth-password" type="password" name="password" autocomplete="current-password" required />' +
      '<p class="blog-auth-error" id="blog-auth-error" aria-live="polite"></p>' +
      '<button type="submit" class="blog-auth-submit" id="blog-auth-submit">解锁</button>' +
      '</form>' +
      '<p class="blog-auth-footnote">会话有效期内无需重复输入。内容为客户端加密，但仍请勿用于高敏感信息。</p>' +
      '</div>';

    doc.body.appendChild(gate);

    var form = doc.getElementById('blog-auth-form');
    var input = doc.getElementById('blog-auth-password');
    var err = doc.getElementById('blog-auth-error');
    var btn = doc.getElementById('blog-auth-submit');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      btn.disabled = true;

      var password = input.value;
      var attempt = useEncryption() && global.BlogCrypto.unlockWithPassword
        ? global.BlogCrypto.unlockWithPassword(password)
        : Promise.reject(new Error('no-crypto'));

      attempt
        .then(function () {
          writeSessionMarker();
          return unlockPage();
        })
        .catch(function (ex) {
          if (ex && ex.message === 'crypto') {
            err.textContent = '当前浏览器不支持 Web Crypto，请更换浏览器。';
          } else if (ex && ex.message === 'locked') {
            err.textContent = '解密失败，请刷新后重试。';
          } else if (
            ex && (
              String(ex.message || ex).indexOf('fetch failed') >= 0 ||
              String(ex.message || ex).indexOf('Failed to fetch') >= 0
            )
          ) {
            err.textContent = '无法加载加密内容，请通过 HTTP 本地服务访问（如 dev-server.bat），勿直接打开 file:// 链接。';
          } else {
            err.textContent = '密码错误，请重试。';
          }
          input.value = '';
          input.focus();
        })
        .finally(function () {
          btn.disabled = false;
        });
    });

    setTimeout(function () { input.focus(); }, 50);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function requireAuth(fn) {
    if (!isBlogProtectedPage() || isUnlocked()) {
      var run = function () {
        if (typeof fn === 'function') fn();
      };
      if (useEncryption() && global.BlogCrypto.hasKey() && global.BlogCrypto.decryptAllOnPage) {
        return global.BlogCrypto.decryptAllOnPage().then(run).catch(function () {
          mountGate();
        });
      }
      run();
      return Promise.resolve(true);
    }
    return new Promise(function (resolve) {
      global.addEventListener('blog-auth-ready', function () {
        if (typeof fn === 'function') fn();
        resolve(true);
      }, { once: true });
    });
  }

  function logout() {
    clearSession();
    global.location.reload();
  }

  function addLogoutLink() {
    if (!isUnlocked()) return;
    var footer = global.document.querySelector('.blog-hub-footer .copyright, .site-footer .copyright, .te-page-footer p');
    if (!footer || footer.querySelector('.blog-auth-logout')) return;
    var btn = global.document.createElement('button');
    btn.type = 'button';
    btn.className = 'blog-auth-logout';
    btn.textContent = '锁定博客';
    btn.addEventListener('click', logout);
    footer.appendChild(btn);
  }

  function boot() {
    if (!isBlogProtectedPage()) return;

    global.document.documentElement.classList.add('blog-auth-pending');

    if (useEncryption()) {
      clearLegacySession();
      try {
        var raw = global.sessionStorage.getItem(storageKey());
        if (raw && !global.BlogCrypto.hasKey()) {
          clearLegacySession();
        }
      } catch (e) { /* ignore */ }
    }

    if (isUnlocked()) {
      var ready = global.document.readyState === 'loading'
        ? new Promise(function (res) {
          global.document.addEventListener('DOMContentLoaded', res, { once: true });
        })
        : Promise.resolve();
      ready.then(unlockPage).catch(function () {
        mountGate();
      });
      return;
    }

    function onReady() {
      mountGate();
    }

    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }

  global.BlogAuth = {
    isUnlocked: isUnlocked,
    requireAuth: requireAuth,
    logout: logout,
  };

  boot();
})(window);
