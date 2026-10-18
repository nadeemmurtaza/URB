/* URB motion engine. Everything here is skipped under prefers-reduced-motion, and the page is complete without it.
   Nothing writes an inline style: pointer-driven values go through one constructable stylesheet rule. */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var de = document.documentElement, body = document.body, page = body.getAttribute('data-page');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var D = window.URB_DOODLES;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  de.classList.add('m');

  /* ---- Filters for the line-boil, the floating hearts, scroll progress, trail and burst ---- */
  var filt = function (id, seed) { return '<filter id="boil-' + id + '" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="' + seed + '" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" xChannelSelector="R" yChannelSelector="G"/></filter>'; };
  var floats = ['heart', 'sparkle', 'star', 'daisy', 'heart', 'sparkle', 'heart', 'star', 'daisy'].map(function (n, i) { return D(n, ['doodle--rose', 'doodle--mauve', 'doodle--olive', 'doodle--berry', 'doodle--rose', 'doodle--olive', 'doodle--mauve', 'doodle--rose', 'doodle--berry'][i]); }).join('');
  var floatEl = document.createElement('span'); floatEl.className = 'bg__floats'; floatEl.innerHTML = floats; var bg = $('.bg'); if (bg) bg.appendChild(floatEl);
  body.insertAdjacentHTML('beforeend',
    '<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' + filt('a', 1) + filt('b', 5) + filt('c', 9) + '</defs></svg>' +
    '<span class="progress" aria-hidden="true"></span>' +
    '<span class="burst" id="burst" aria-hidden="true"><i>♥</i><i>✦</i><i>♥</i><i>✦</i><i>♥</i><i>✦</i><i>♥</i><i>✦</i></span>' +
    [1, 2, 3, 4, 5].map(function (n) { return '<span class="trail trail--' + n + '" aria-hidden="true">' + D('sparkle', n % 2 ? 'doodle--rose' : 'doodle--olive') + '</span>'; }).join(''));

  /* ---- One stylesheet rule carries every pointer-driven value ---- */
  var vars = null;
  try { var sheet = new CSSStyleSheet(); sheet.replaceSync(':root{}'); document.adoptedStyleSheets = document.adoptedStyleSheets.concat([sheet]); vars = sheet.cssRules[0].style; } catch (e) { vars = null; }
  var set = function (k, v) { if (vars) vars.setProperty(k, v); };

  /* ---- Cursor: sparkle trail and hero parallax (fine pointers only) ---- */
  if (vars && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var mx = -99, my = -99, tpx = 0, tpy = 0, px = 0, py = 0, run = false, lastMove = 0, f = [];
    for (var i = 0; i < 5; i++) f.push({ x: -99, y: -99 });
    var loop = function (t) {
      var moving = t - lastMove < 900, px0 = px, py0 = py;
      f.forEach(function (p, k) { var tx = k ? f[k - 1].x : mx, ty = k ? f[k - 1].y : my, e = k ? 0.34 : 0.45; p.x += (tx - p.x) * e; p.y += (ty - p.y) * e; set('--t' + (k + 1) + 'x', p.x + 'px'); set('--t' + (k + 1) + 'y', p.y + 'px'); });
      px += (tpx - px) * 0.08; py += (tpy - py) * 0.08; set('--px', px.toFixed(3)); set('--py', py.toFixed(3));
      if (moving || Math.abs(px - px0) > 0.0005 || Math.abs(py - py0) > 0.0005) requestAnimationFrame(loop); else run = false;
    };
    addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      mx = e.clientX; my = e.clientY; tpx = (mx / innerWidth - 0.5) * 2; tpy = (my / innerHeight - 0.5) * 2; lastMove = performance.now();
      if (!run) { run = true; requestAnimationFrame(loop); }
    }, { passive: true });
  }

  /* ---- Burst of hearts when something goes in the bag ---- */
  addEventListener('click', function (e) {
    var t = e.target.closest('[data-action="add"], [data-intent="add"], [data-intent="buy"], #sticky-add'); if (!t) return;
    var b = $('#burst'); set('--bx', e.clientX + 'px'); set('--by', e.clientY + 'px');
    b.removeAttribute('data-go'); void b.offsetWidth; b.setAttribute('data-go', '');
  });

  /* ---- Header slips away when scrolling down, returns on the way up ---- */
  var lastY = scrollY, ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { var y = scrollY, d = y - lastY; if (Math.abs(d) > 8) { de.setAttribute('data-hdr', y > 160 && d > 0 ? 'hide' : 'show'); lastY = y; } ticking = false; });
  }, { passive: true });

  /* ---- Headlines split into letters ---- */
  function split(el) {
    if (el.classList.contains('sp') || el.closest('dialog')) return;
    var label = el.textContent.replace(/\s+/g, ' ').trim(), n = 0, out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { out.push(' '); return; }
          out.push('<span class="wd" aria-hidden="true">' + Array.from(tok).map(function (c) { return '<span class="ch d' + Math.min(n++, 39) + '"><span class="chi">' + esc(c) + '</span></span>'; }).join('') + '</span>');
        });
      } else if (node.nodeType === 1) { out.push('<span class="wd" aria-hidden="true">' + node.outerHTML + '</span>'); }
    });
    el.innerHTML = out.join(''); el.setAttribute('aria-label', label); el.classList.add('sp'); io.observe(el);
  }
  var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }); }, { threshold: 0.2 });
  function splitAll() { $$('.mega, .mega-sm, .page-head .h1, .pdp__title, .tl__quote, [data-split]').forEach(split); }
  splitAll();
  setTimeout(function () { $$('.sp:not(.is-in)').forEach(function (e) { var r = e.getBoundingClientRect(); if (r.top < innerHeight * 1.2) e.classList.add('is-in'); }); }, 2500);
  var raf; new MutationObserver(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(splitAll); }).observe(body, { childList: true, subtree: true });

  /* ---- Numbers count up ---- */
  var cio = new IntersectionObserver(function (en) {
    en.forEach(function (x) {
      if (!x.isIntersecting) return; cio.unobserve(x.target);
      var node = Array.prototype.slice.call(x.target.childNodes).filter(function (n) { return n.nodeType === 3 && /\d/.test(n.textContent); })[0]; if (!node) return;
      var end = parseFloat(node.textContent), dec = (node.textContent.split('.')[1] || '').length, t0 = performance.now();
      (function step(t) { var k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 3); node.textContent = (end * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); else node.textContent = end.toFixed(dec); })(t0);
    });
  }, { threshold: 0.6 });
  $$('.time__n').forEach(function (e) { cio.observe(e); });

  /* ---- Intro on the first visit of a session ---- */
  var seen = false; try { seen = sessionStorage.getItem('urb.intro'); } catch (e) { seen = true; }
  if (page === 'home' && !seen) {
    try { sessionStorage.setItem('urb.intro', '1'); } catch (e) { /* noop */ }
    body.insertAdjacentHTML('beforeend', '<div class="intro" aria-hidden="true"><img class="intro__logo" src="assets/logo.png" alt="" width="640" height="273"><p class="hand hand--rose">ur beloved</p>' + D('sparkle', 'intro__a d-m doodle--rose') + D('heart', 'intro__b d-m doodle--berry') + D('star', 'intro__c d-s doodle--olive') + '</div>');
    var intro = $('.intro'), gone = function () { if (intro.parentNode) intro.parentNode.removeChild(intro); };
    intro.addEventListener('click', gone); setTimeout(gone, 2400);
  }
})();
