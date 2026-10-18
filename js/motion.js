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

  body.insertAdjacentHTML('beforeend',
    '<span class="progress" aria-hidden="true"></span>' +
    '<span class="burst" id="burst" aria-hidden="true"><i>\u2665</i><i>\u2665</i><i>\u2665</i><i>\u2665</i><i>\u2665</i></span>');

  /* ---- One stylesheet rule carries every pointer-driven value ---- */
  var vars = null;
  try { var sheet = new CSSStyleSheet(); sheet.replaceSync(':root{}'); document.adoptedStyleSheets = document.adoptedStyleSheets.concat([sheet]); vars = sheet.cssRules[0].style; } catch (e) { vars = null; }
  var set = function (k, v) { if (vars) vars.setProperty(k, v); };

  /* ---- Hero parallax (fine pointers only) ---- */
  if (vars && page === 'home' && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, going = false;
    var tick = function () { cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08; set('--px', cx.toFixed(3)); set('--py', cy.toFixed(3)); if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) requestAnimationFrame(tick); else going = false; };
    addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; if (!going) { going = true; requestAnimationFrame(tick); } }, { passive: true });
  }

  /* ---- Burst of hearts when something goes in the bag ---- */
  addEventListener('click', function (e) {
    var t = e.target.closest('[data-action="add"], [data-intent="add"], #sticky-add'); if (!t) return;
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

  /* ---- Notes beside pictures are typed out when they appear, then the arrow or underline draws ---- */
  var tio = new IntersectionObserver(function (en) {
    en.forEach(function (x) {
      if (!x.isIntersecting) return; tio.unobserve(x.target);
      var n = x.target, cs = $$('.tc', n), i = 0;
      var t = setInterval(function () {
        if (i < cs.length) { cs[i++].classList.add('on'); return; }
        clearInterval(t); $$('.doodle', n).forEach(function (d) { d.setAttribute('data-in', ''); }); n.classList.add('go');
      }, 42);
    });
  }, { threshold: 0.9, rootMargin: '0px 0px -8% 0px' });
  $$('.note, .hero__note').forEach(function (n) {
    var h = $('.hand', n); if (!h) return;
    h.innerHTML = h.innerHTML.replace(/(<br\s*\/?>)|([^<]+)/g, function (m, br, txt) { return br ? br : Array.from(txt).map(function (c) { return '<span class="tc">' + esc(c) + '</span>'; }).join(''); });
    n.classList.add('typed'); tio.observe(n);
  });

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

})();
