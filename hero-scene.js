/**
 * Hero background: interactive rhythmic polylines + subtle LLM cues.
 * Pauses off-screen; avoids full scene reset on mobile viewport height changes.
 */
(function () {
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var hero = canvas.closest('.hero');
  if (!hero) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.classList.add('hero-canvas--static');
    return;
  }

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0;
  var h = 0;
  var lastLayoutW = 0;
  var animId = 0;
  var visible = true;
  var time = 0;
  var lastFrame = 0;
  var lines = [];
  var vocab = [];
  var target = { x: 0.5, y: 0.5, active: false };
  var pointer = { x: 0.5, y: 0.5 };

  var VOCAB_WORDS = ['token', 'embed', 'LLM', 'attn', 'context', 'align', 'infer'];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function initVocab() {
    var count = w < 768 ? 4 : 6;
    vocab = [];
    for (var i = 0; i < count; i++) {
      vocab.push({
        text: VOCAB_WORDS[i % VOCAB_WORDS.length],
        x: rand(0.08, 0.88),
        y: rand(0.18, 0.78),
        drift: rand(0.00004, 0.0001),
        opacity: rand(0.05, 0.1)
      });
    }
  }

  function initLines() {
    var count = w < 768 ? 5 : 7;
    lines = [];
    for (var i = 0; i < count; i++) {
      var t = i / Math.max(1, count - 1);
      var line = {
        baseY: 0.28 + t * 0.44,
        amp: rand(14, 28),
        freq: rand(0.0045, 0.0075),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.35, 0.65),
        opacity: rand(0.14, 0.32),
        width: rand(1, 1.6),
        hue: i % 3 === 0 ? 265 : 195,
        tokens: [],
        nodes: []
      };

      var tokenCount = w < 768 ? 1 : 2;
      for (var k = 0; k < tokenCount; k++) {
        line.tokens.push({
          pos: Math.random(),
          speed: rand(0.035, 0.08),
          size: rand(2, 3.2)
        });
      }

      var nodeCount = w < 768 ? 2 : 3;
      for (var n = 0; n < nodeCount; n++) {
        line.nodes.push({
          xFrac: rand(0.12, 0.88),
          phase: rand(0, Math.PI * 2)
        });
      }

      lines.push(line);
    }
  }

  function applyCanvasSize(newW, newH, rebuildScene) {
    if (newW < 1 || newH < 1) return;

    var widthChanged = Math.abs(newW - lastLayoutW) > 10;
    w = newW;
    h = newH;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (rebuildScene || widthChanged || !lines.length) {
      lastLayoutW = w;
      initLines();
      initVocab();
    }
  }

  function measureHero() {
    applyCanvasSize(hero.clientWidth, hero.clientHeight, false);
  }

  function waveY(line, x, t, mx, my) {
    var y0 = line.baseY * h;
    var wave = Math.sin(x * line.freq + t * line.speed + line.phase) * line.amp;
    wave += Math.sin(x * line.freq * 1.7 + t * line.speed * 0.6 + line.phase) * (line.amp * 0.35);

    var dx = x - mx;
    var dy = y0 - my;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var radius = Math.max(40, Math.min(w, h) * (target.active ? 0.28 : 0.18));
    var pull = Math.exp(-(dist * dist) / (radius * radius));
    var interact = target.active ? 1 : 0.3;

    return y0 + wave + (my - y0) * pull * 0.18 * interact;
  }

  function drawAttentionField(mx, my) {
    var radius = Math.max(60, Math.min(w, h) * (target.active ? 0.32 : 0.2));
    var grad = ctx.createRadialGradient(mx, my, 0, mx, my, radius);
    grad.addColorStop(0, 'rgba(0, 229, 255, ' + (target.active ? 0.07 : 0.03) + ')');
    grad.addColorStop(0.55, 'rgba(126, 203, 255, 0.02)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawLine(line, t, mx, my) {
    var step = w < 768 ? 14 : 10;
    ctx.beginPath();
    for (var x = 0; x <= w; x += step) {
      var y = waveY(line, x, t, mx, my);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'hsla(' + line.hue + ', 85%, 68%, ' + line.opacity + ')';
    ctx.lineWidth = line.width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawTokenRunners(line, t, dt, mx, my) {
    line.tokens.forEach(function (tok) {
      tok.pos += tok.speed * dt;
      if (tok.pos > 1) tok.pos -= 1;

      var x = tok.pos * w;
      var y = waveY(line, x, t, mx, my);
      var glow = 0.35 + 0.25 * Math.sin(t * 3 + tok.pos * 12);

      ctx.fillStyle = 'rgba(0, 229, 255, ' + glow + ')';
      ctx.beginPath();
      ctx.arc(x, y, tok.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawAttentionNodes(line, t, mx, my) {
    var attnDenom = Math.max(1, Math.min(w, h) * 0.16);
    line.nodes.forEach(function (node) {
      var x = node.xFrac * w;
      var y = waveY(line, x, t, mx, my);
      var dx = x - mx;
      var dy = y - my;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var attn = Math.exp(-(dist * dist) / (attnDenom * attnDenom));
      var pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + node.phase);
      var alpha = 0.12 + 0.22 * pulse + attn * (target.active ? 0.35 : 0.12);

      ctx.strokeStyle = 'rgba(126, 203, 255, ' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 4 + attn * 5, 0, Math.PI * 2);
      ctx.stroke();

      if (attn > 0.35 && target.active) {
        ctx.strokeStyle = 'rgba(0, 229, 255, ' + (attn * 0.25) + ')';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mx, my);
        ctx.stroke();
      }
    });
  }

  function drawVocab(dt) {
    ctx.font = '500 11px ui-monospace, "Source Sans 3", monospace';
    vocab.forEach(function (item) {
      item.y -= item.drift * h * dt * 60;
      if (item.y < 0.1) item.y = 0.92;

      var dx = item.x * w - pointer.x * w;
      var dy = item.y * h - pointer.y * h;
      var near = Math.exp(-(dx * dx + dy * dy) / Math.max(1, w * w * 0.04));
      var alpha = item.opacity + near * (target.active ? 0.12 : 0.04);

      ctx.fillStyle = 'rgba(126, 203, 255, ' + alpha + ')';
      ctx.fillText(item.text, item.x * w, item.y * h);
    });
  }

  function frame(now) {
    animId = 0;
    if (!visible || w < 1 || h < 1) return;

    if (!lastFrame) lastFrame = now;
    var dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    time += dt;
    pointer.x += (target.x - pointer.x) * Math.min(1, dt * 6);
    pointer.y += (target.y - pointer.y) * Math.min(1, dt * 6);

    var mx = pointer.x * w;
    var my = pointer.y * h;

    ctx.clearRect(0, 0, w, h);
    drawAttentionField(mx, my);

    lines.forEach(function (line) {
      drawLine(line, time, mx, my);
      drawAttentionNodes(line, time, mx, my);
      drawTokenRunners(line, time, dt, mx, my);
    });

    drawVocab(dt);

    animId = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (animId || !visible) return;
    lastFrame = 0;
    animId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    if (!animId) return;
    cancelAnimationFrame(animId);
    animId = 0;
    lastFrame = 0;
  }

  function releasePointer() {
    target.active = false;
    target.x = 0.5;
    target.y = 0.5;
  }

  function setPointer(clientX, clientY) {
    var rect = hero.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    target.x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    target.y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    target.active = true;
  }

  hero.addEventListener('mousemove', function (e) {
    setPointer(e.clientX, e.clientY);
  }, { passive: true });

  hero.addEventListener('mouseleave', releasePointer);

  hero.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches[0]) {
      setPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  hero.addEventListener('touchend', releasePointer, { passive: true });

  window.addEventListener('scroll', releasePointer, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopLoop();
    } else if (visible) {
      startLoop();
    }
  });

  if (typeof ResizeObserver !== 'undefined') {
    var resizeObserver = new ResizeObserver(function (entries) {
      var rect = entries[0] && entries[0].contentRect;
      if (!rect) return;
      applyCanvasSize(rect.width, rect.height, false);
      if (visible) startLoop();
    });
    resizeObserver.observe(hero);
  } else {
    window.addEventListener('resize', measureHero);
  }

  if (typeof IntersectionObserver !== 'undefined') {
    var intersectionObserver = new IntersectionObserver(function (entries) {
      visible = !!(entries[0] && entries[0].isIntersecting);
      if (visible) {
        measureHero();
        startLoop();
      } else {
        stopLoop();
        releasePointer();
      }
    }, { threshold: 0.01 });
    intersectionObserver.observe(hero);
  }

  applyCanvasSize(hero.clientWidth, hero.clientHeight, true);
  startLoop();
})();
