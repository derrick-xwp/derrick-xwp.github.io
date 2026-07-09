/**
 * 博客客户端解密：PBKDF2 + AES-GCM，与 encrypt-blogs.py 输出格式一致。
 */
(function (global) {
  'use strict';

  function cfg() {
    return global.BLOG_AUTH_CONFIG || {};
  }

  function keyStorageName() {
    return (cfg().storageKey || 'hk2026-blog-unlock-v1') + ':key';
  }

  function normalizeB64(b64) {
    var s = String(b64 || '').replace(/\s/g, '');
    while (s.length % 4) s += '=';
    return s;
  }

  function b64ToBytes(b64) {
    var bin = global.atob(normalizeB64(b64));
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return global.btoa(bin);
  }

  function readKeyBytes() {
    try {
      var raw = global.sessionStorage.getItem(keyStorageName());
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.key || !data.exp || Date.now() > data.exp) {
        global.sessionStorage.removeItem(keyStorageName());
        return null;
      }
      return b64ToBytes(data.key);
    } catch (e) {
      return null;
    }
  }

  function writeKeyBytes(keyBytes) {
    var hours = cfg().sessionHours || 12;
    try {
      global.sessionStorage.setItem(keyStorageName(), JSON.stringify({
        key: bytesToB64(keyBytes),
        exp: Date.now() + hours * 60 * 60 * 1000,
      }));
    } catch (e) { /* ignore */ }
  }

  function clearKeyBytes() {
    try {
      global.sessionStorage.removeItem(keyStorageName());
    } catch (e) { /* ignore */ }
  }

  function deriveKeyBytes(password, payload) {
    if (!global.crypto || !global.crypto.subtle) {
      return Promise.reject(new Error('crypto'));
    }
    var c = cfg();
    var salt = b64ToBytes(payload.salt || c.kdfSalt);
    var iterations = payload.iter || c.kdfIterations || 250000;
    var enc = new TextEncoder();
    return global.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    ).then(function (keyMaterial) {
      return global.crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
        keyMaterial,
        256
      );
    }).then(function (bits) {
      return new Uint8Array(bits);
    });
  }

  function importAesKey(keyBytes) {
    return global.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      true,
      ['decrypt']
    );
  }

  function decryptPayloadWithKey(keyBytes, payload) {
    var iv = b64ToBytes(payload.iv);
    var ct = b64ToBytes(payload.ct);
    return importAesKey(keyBytes).then(function (key) {
      return global.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    }).then(function (buf) {
      return new TextDecoder().decode(buf);
    });
  }

  function decryptPayload(password, payload) {
    return deriveKeyBytes(password, payload).then(function (keyBytes) {
      return decryptPayloadWithKey(keyBytes, payload).then(function (text) {
        return { text: text, keyBytes: keyBytes };
      });
    });
  }

  function fetchJson(url) {
    return global.fetch(url, { credentials: 'same-origin' }).then(function (res) {
      if (!res.ok) throw new Error('fetch failed: ' + res.status);
      return res.json();
    });
  }

  function blogsBaseUrl() {
    var path = global.location.pathname;
    var marker = '/blogs/';
    var i = path.indexOf(marker);
    if (i >= 0) {
      return global.location.origin + path.slice(0, i + marker.length);
    }
    try {
      return new URL('./', global.location.href).href;
    } catch (e) {
      return global.location.href;
    }
  }

  function resolveUrl(encPath, baseUrl) {
    if (!encPath) return encPath;
    if (/^https?:\/\//.test(encPath)) return encPath;
    if (encPath.charAt(0) === '/') {
      return global.location.origin + encPath;
    }
    try {
      return new URL(encPath, baseUrl || global.location.href).href;
    } catch (e) {
      return encPath;
    }
  }

  function resolveBlogsRootAsset(assetPath) {
    if (!assetPath) return assetPath;
    if (/^https?:\/\//.test(assetPath)) return assetPath;
    if (assetPath.charAt(0) === '/') {
      return global.location.origin + assetPath;
    }
    try {
      return new URL(assetPath.replace(/^\.\//, ''), blogsBaseUrl()).href;
    } catch (e) {
      return resolveUrl(assetPath, global.location.href);
    }
  }

  function encryptionEnabled() {
    return cfg().encryption !== false;
  }

  function unlockWithPassword(password) {
    var canaryUrl = resolveBlogsRootAsset(cfg().canaryEnc || 'blog-auth.canary.enc.json');
    return fetchJson(canaryUrl).then(function (payload) {
      return decryptPayload(password, payload);
    }).then(function (result) {
      writeKeyBytes(result.keyBytes);
      return result.keyBytes;
    });
  }

  function decryptEncUrl(url) {
    var keyBytes = readKeyBytes();
    if (!keyBytes) return Promise.reject(new Error('locked'));
    return fetchJson(url).then(function (payload) {
      return decryptPayloadWithKey(keyBytes, payload);
    });
  }

  function decryptAllOnPage() {
    var keyBytes = readKeyBytes();
    if (!keyBytes) return Promise.reject(new Error('locked'));
    var nodes = global.document.querySelectorAll('[data-enc]');
    if (!nodes.length) return Promise.resolve(true);

    var tasks = Array.prototype.map.call(nodes, function (el) {
      var encPath = el.getAttribute('data-enc');
      var url = resolveUrl(encPath, global.location.href);
      return fetchJson(url).then(function (payload) {
        return decryptPayloadWithKey(keyBytes, payload);
      }).then(function (html) {
        var mode = el.getAttribute('data-enc-mode') || 'replace';
        if (mode === 'inner') {
          el.innerHTML = html;
          el.removeAttribute('hidden');
          el.removeAttribute('aria-hidden');
          return;
        }
        var tpl = global.document.createElement('template');
        tpl.innerHTML = html.trim();
        var parent = el.parentNode;
        if (!parent) return;
        while (tpl.content.firstChild) {
          parent.insertBefore(tpl.content.firstChild, el);
        }
        parent.removeChild(el);
      });
    });

    return Promise.all(tasks);
  }

  function maybeDecryptFetchedBody(html, pageUrl) {
    if (!encryptionEnabled()) return Promise.resolve(html);
    var keyBytes = readKeyBytes();
    if (!keyBytes) return Promise.reject(new Error('locked'));

    var doc = new DOMParser().parseFromString(html, 'text/html');
    var encEl = doc.querySelector('[data-enc]');
    if (!encEl) return Promise.resolve(html);

    var encUrl = resolveUrl(encEl.getAttribute('data-enc'), pageUrl);
    return decryptEncUrl(encUrl);
  }

  global.BlogCrypto = {
    unlockWithPassword: unlockWithPassword,
    decryptAllOnPage: decryptAllOnPage,
    maybeDecryptFetchedBody: maybeDecryptFetchedBody,
    decryptEncUrl: decryptEncUrl,
    clearKey: clearKeyBytes,
    hasKey: function () { return !!readKeyBytes(); },
    resolveUrl: resolveUrl,
    encryptionEnabled: encryptionEnabled,
  };
})(window);
