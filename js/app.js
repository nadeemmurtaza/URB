/* URB: demo front end. No backend: cart, saved items and orders live in localStorage. */
(function () {
  'use strict';
  var D = window.URB_DATA, PRODUCTS = D.products;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var byId = function (id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; };
  var fmt = function (n) { return 'Rs ' + Math.round(n).toLocaleString('en-US'); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var read = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var write = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: state lasts for the page only */ } };
  var mem = { cart: null, wish: null };
  var getCart = function () { return mem.cart || (mem.cart = read('urb.cart', [])); };
  var setCart = function (c) { mem.cart = c; write('urb.cart', c); sync(); };
  var getWish = function () { return mem.wish || (mem.wish = read('urb.wish', [])); };
  var setWish = function (w) { mem.wish = w; write('urb.wish', w); sync(); };
  var page = document.body.getAttribute('data-page');
  var params = new URLSearchParams(location.search);

  /* ---------- Pictures: products show their original shop photo; story cut-outs sit straight on the page ---------- */
  function art(p, eager) {
    return '<img class="art art--orig" src="' + p.photo + '" alt="' + esc(p.name) + ', crocheted by URB" width="400" height="400" decoding="async"' + (eager ? '' : ' loading="lazy"') + '>';
  }
  function itemArt(it) { return '<img class="art' + (it.soft ? ' art--soft' : '') + '" src="' + it.img + '" alt="' + esc(it.name) + ', crocheted by URB" width="800" height="800" loading="lazy" decoding="async">'; }
  function DOOD(n, c) { return window.URB_DOODLES(n, c); }
  function btnDoodles(root) {
    $$('.btn:not(.btn--text):not([data-d])', root || document).forEach(function (b) {
      b.setAttribute('data-d', '');
      b.insertAdjacentHTML('beforeend', '<i data-doodle="sparkle" class="btn__d ' + (b.classList.contains('btn--ink') ? 'doodle--rose' : 'doodle--mauve') + '"></i>');
    });
  }
  function doodles(root) {
    $$('[data-doodle]', root || document).forEach(function (el) {
      var t = document.createElement('template'); t.innerHTML = DOOD(el.getAttribute('data-doodle'), el.className);
      if (t.content.firstChild) el.replaceWith(t.content.firstChild);
    });
  }

  /* ---------- Cart maths (display only: this is a demo) ---------- */
  function lines() { return getCart().map(function (l) { var p = byId(l.id); return p ? { p: p, qty: l.qty } : null; }).filter(Boolean); }
  /* Promo codes come from the back office once it has been opened; before that, the built-in one. */
  function promoList() { var p = D.db.read('promos'); return D.db.seeded('promos') && Array.isArray(p) ? p : [D.promo]; }
  function findPromo(code) {
    code = String(code || '').trim().toUpperCase(); var today = new Date().toISOString().slice(0, 10);
    return promoList().filter(function (p) { return String(p.code).toUpperCase() === code && p.active !== false && (!p.expires || p.expires >= today) && (!p.limit || (p.used || 0) < p.limit); })[0] || null;
  }
  function totals() {
    var ls = lines(), sub = 0, fee = 0, count = 0, was = 0;
    ls.forEach(function (l) { sub += l.p.price * l.qty; was += (l.p.was || l.p.price) * l.qty; count += l.qty; fee = Math.max(fee, l.p.fee); });
    var promo = findPromo(read('urb.promo', null)), disc = promo ? Math.round(sub * promo.pct / 100) : 0;
    return { ls: ls, sub: sub, fee: ls.length ? fee : 0, count: count, saved: was - sub, disc: disc, total: sub - disc + (ls.length ? fee : 0), promo: !!promo, promoCode: promo ? promo.code : '', promoPct: promo ? promo.pct : 0 };
  }
  function addToCart(id, qty) {
    var p = byId(id); if (!p) return;
    if (p.stock <= 0) { toast(p.name + ' is sold out.'); return; }
    var c = getCart().slice(), l = c.filter(function (x) { return x.id === id; })[0];
    var next = Math.min(p.stock, (l ? l.qty : 0) + (qty || 1));
    if (l && l.qty >= p.stock) { toast('That is all we have of ' + p.name + '.'); return; }
    if (l) l.qty = next; else c.push({ id: id, qty: next });
    setCart(c); toast(p.name + ' added to your bag.');
  }
  function setQty(id, q) {
    var p = byId(id), c = getCart().map(function (l) { return l.id === id ? { id: id, qty: Math.max(0, Math.min(q, p.stock)) } : l; }).filter(function (l) { return l.qty > 0; });
    setCart(c);
  }
  function stockNote(p) { return p.stock <= 0 ? 'Sold out' : p.stock === 1 ? 'Only 1 left' : p.stock <= 3 ? 'Only ' + p.stock + ' left' : 'In stock'; }

  /* ---------- Shared chrome ---------- */
  var icon = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  var NAV = [['shop.html', 'Bouquets'], ['collection.html?c=stems', 'Stems'], ['collection.html?c=plushies', 'Plushies'], ['collection.html?c=wear', 'Wear'], ['collection.html?c=little', 'Little things'], ['about.html', 'Her story']];
  var MORE = [['contact.html', 'Contact'], ['delivery.html', 'Delivery & care'], ['track.html', 'Track an order'], ['wishlist.html', 'Saved']];
  function chrome() {
    var cur = (location.pathname.split('/').pop() || 'index.html') + (page === 'collection' ? location.search.split('&')[0] : '');
    var nav = NAV.map(function (n) { return '<a href="' + n[0] + '"' + (cur === n[0] ? ' aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('');
    var h = '<a class="skip" href="#main">Skip to content</a>' +
      '<header class="header"><div class="header__in container">' +
      '<button class="icon-btn header__menu" data-action="open-menu" aria-label="Open menu">' + icon.menu + '</button>' +
      '<a class="logo" href="index.html" aria-label="URB home"><img class="logo__img" src="assets/logo.png" alt="URB" width="640" height="273"></a>' +
      '<nav class="header__nav" aria-label="Main">' + nav + '</nav>' +
      '<div class="header__tools">' +
      '<button class="icon-btn" data-action="open-search" aria-label="Search">' + icon.search + '</button>' +
      '<a class="icon-btn header__wish" href="wishlist.html" aria-label="Saved bouquets">' + icon.heart + '<span class="badge" data-count="wish" hidden>0</span></a>' +
      '<button class="icon-btn" data-action="open-cart" aria-label="Open bag">' + icon.bag + '<span class="badge" data-count="cart" hidden>0</span></button>' +
      '</div></div></header>';
    document.body.insertAdjacentHTML('afterbegin', '<div class="bg" aria-hidden="true"><span class="bg__orb bg__orb--a"></span><span class="bg__orb bg__orb--b"></span><span class="bg__orb bg__orb--c"></span><span class="bg__orb bg__orb--d"></span></div>' + h);
    var f = '<footer class="footer"><div class="container footer__grid">' +
      '<div class="footer__brand"><a class="logo logo--on-dark" href="index.html" aria-label="URB home"><img class="logo__img" src="assets/logo.png" alt="URB" width="640" height="273"></a><p>ur beloved. Handmade crochet bouquets that never wilt.</p>' +
      '<form class="newsletter" data-form="newsletter" novalidate><label class="sr" for="nl-email">Email address</label><input id="nl-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="Your email" required><button class="btn btn--ink" type="submit">Join</button><p class="field__error" data-error hidden></p></form></div>' +
      '<div><h2 class="eyebrow">Shop</h2><ul class="list"><li><a href="shop.html">Bouquets</a></li><li><a href="collection.html?c=stems">Single stems</a></li><li><a href="collection.html?c=plushies">Plushies</a></li><li><a href="collection.html?c=wear">Wear</a></li><li><a href="collection.html?c=little">Little things</a></li><li><a href="shop.html?cat=under10">Bouquets under Rs 10,000</a></li></ul></div>' +
      '<div><h2 class="eyebrow">Help</h2><ul class="list"><li><a href="delivery.html">Delivery & care</a></li><li><a href="track.html">Track an order</a></li><li><a href="contact.html">Contact</a></li><li><a href="contact.html#custom">Custom bouquet</a></li><li><a href="wishlist.html">Saved bouquets</a></li></ul></div>' +
      '<div><h2 class="eyebrow">Follow</h2><ul class="list"><li><a href="' + D.brand.instagram + '" target="_blank" rel="noopener">Instagram</a></li><li><a href="' + D.brand.tiktok + '" target="_blank" rel="noopener">TikTok</a></li><li><a href="' + D.brand.facebook + '" target="_blank" rel="noopener">Facebook</a></li><li><a href="' + D.brand.pluto + '" target="_blank" rel="noopener">Also on Pluto</a></li></ul></div>' +
      '</div><div class="container footer__base"><p>© 2026 URB. A design demonstration: no real orders are taken.</p><a href="#top">Back to top</a></div></footer>';
    document.body.insertAdjacentHTML('beforeend', f);
    document.body.insertAdjacentHTML('beforeend',
      '<dialog class="sheet sheet--menu" id="dlg-menu" aria-label="Menu"><div class="sheet__head"><a class="logo" href="index.html" aria-label="URB home"><img class="logo__img" src="assets/logo.png" alt="URB" width="640" height="273"></a><button class="icon-btn" data-action="close" aria-label="Close menu">' + icon.close + '</button></div><nav class="menu" aria-label="Mobile">' + [['index.html', 'Home']].concat(NAV).concat(MORE).map(function (n) { return '<a href="' + n[0] + '">' + n[1] + '</a>'; }).join('') + '</nav></dialog>' +
      '<dialog class="sheet sheet--search" id="dlg-search" aria-label="Search"><div class="sheet__head"><label class="sr" for="q">Search bouquets</label><input id="q" class="search__input" type="search" placeholder="Search by name or flower" autocomplete="off"><button class="icon-btn" data-action="close" aria-label="Close search">' + icon.close + '</button></div><div class="search__out" id="search-out" aria-live="polite"></div></dialog>' +
      '<dialog class="sheet sheet--cart" id="dlg-cart" aria-label="Your bag"><div class="sheet__head"><h2 class="sheet__title">Your bag</h2><button class="icon-btn" data-action="close" aria-label="Close bag">' + icon.close + '</button></div><div class="sheet__body" id="cart-body"></div></dialog>' +
      '<dialog class="sheet sheet--peek" id="dlg-peek" aria-label="Piece details"><div class="sheet__head"><span class="eyebrow" id="peek-eyebrow"></span><button class="icon-btn" data-action="close" aria-label="Close">' + icon.close + '</button></div><div class="peek" id="peek"></div></dialog>' +
      '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>');
  }
  var toastT;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.hidden = false; t.setAttribute('data-show', ''); clearTimeout(toastT); toastT = setTimeout(function () { t.removeAttribute('data-show'); setTimeout(function () { t.hidden = true; }, 240); }, 2600); }

  function card(p, i) {
    var saved = getWish().indexOf(p.id) > -1;
    return '<article class="card" data-reveal><a class="card__media" href="product.html?id=' + p.id + '" aria-label="' + esc(p.name) + '">' + art(p) + (p.was ? '<span class="tag">−10%</span>' : '') + (p.stock <= 0 ? '<span class="tag tag--low tag--out">sold out</span>' : p.stock === 1 ? '<span class="tag tag--low">last one!</span>' : '') + '</a>' +
      '<button class="card__save icon-btn" data-action="wish" data-id="' + p.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Remove ' : 'Save ') + esc(p.name) + (saved ? ' from saved' : ' to saved') + '">' + icon.heart + '</button>' +
      '<div class="card__body"><h3 class="card__name"><a href="product.html?id=' + p.id + '">' + esc(p.name) + '</a></h3><p class="price"><bdi dir="ltr"><span class="price__now">' + fmt(p.price) + '</span>' + (p.was ? ' <s class="price__was">' + fmt(p.was) + '</s>' : '') + '</bdi></p>' +
      '<button class="btn btn--line btn--block" data-action="add" data-id="' + p.id + '"' + (p.stock <= 0 ? ' disabled' : '') + '>' + (p.stock <= 0 ? 'Sold out' : 'Add to bag') + '</button></div></article>';
  }
  var empty = function (t, d, href, label) { return '<div class="empty"><h2 class="empty__t">' + t + '</h2><p>' + d + '</p><a class="btn btn--ink" href="' + href + '">' + label + '</a></div>'; };

  /* ---------- Cart sheet ---------- */
  function cartLines(editable) {
    return totals().ls.map(function (l) {
      return '<li class="line"><a class="line__img" href="product.html?id=' + l.p.id + '" aria-hidden="true" tabindex="-1">' + art(l.p) + '</a><div class="line__main"><a class="line__name" href="product.html?id=' + l.p.id + '">' + esc(l.p.name) + '</a><p class="line__meta"><bdi dir="ltr">' + fmt(l.p.price) + '</bdi></p>' +
        (editable ? '<div class="qty" role="group" aria-label="Quantity of ' + esc(l.p.name) + '"><button class="qty__b" data-action="dec" data-id="' + l.p.id + '" aria-label="Decrease">−</button><output class="qty__n">' + l.qty + '</output><button class="qty__b" data-action="inc" data-id="' + l.p.id + '" aria-label="Increase"' + (l.qty >= l.p.stock ? ' disabled' : '') + '>+</button></div>' : '<p class="line__meta">Qty ' + l.qty + '</p>') + '</div>' +
        '<div class="line__side"><bdi dir="ltr" class="line__total">' + fmt(l.p.price * l.qty) + '</bdi>' + (editable ? '<button class="link" data-action="remove" data-id="' + l.p.id + '">Remove</button>' : '') + '</div></li>';
    }).join('');
  }
  function renderCartSheet() {
    var t = totals(), b = $('#cart-body');
    if (!t.ls.length) { b.innerHTML = empty('Your bag is empty', 'Every bouquet is crocheted by hand, one stem at a time.', 'shop.html', 'Browse bouquets'); return; }
    b.innerHTML = '<ul class="lines">' + cartLines(true) + '</ul><div class="sheet__foot"><p class="row"><span>Subtotal</span><bdi dir="ltr">' + fmt(t.sub) + '</bdi></p><p class="note">Delivery and promo code are added at checkout.</p><a class="btn btn--ink btn--block" href="checkout.html">Checkout</a><a class="btn btn--line btn--block" href="cart.html">View full bag</a></div>';
  }

  /* ---------- Sync counts and any live views ---------- */
  function sync() {
    var c = totals().count, w = getWish().length;
    $$('[data-count="cart"]').forEach(function (e) { if (String(c) !== e.textContent && c) { e.setAttribute('data-bump', ''); setTimeout(function () { e.removeAttribute('data-bump'); }, 800); } e.textContent = c; e.hidden = !c; });
    $$('[data-count="wish"]').forEach(function (e) { e.textContent = w; e.hidden = !w; });
    renderCartSheet();
    $$('[data-action="wish"]').forEach(function (b) { var s = getWish().indexOf(b.getAttribute('data-id')) > -1, p = byId(b.getAttribute('data-id')); b.setAttribute('aria-pressed', s); if (p && b.classList.contains('card__save')) b.setAttribute('aria-label', (s ? 'Remove ' : 'Save ') + p.name + (s ? ' from saved' : ' to saved')); });
    if (page === 'cart') renderCartPage();
    if (page === 'checkout') renderCheckoutSummary();
    if (page === 'wishlist') renderWishlist();
  }

  /* ---------- Search ---------- */
  function runSearch(q) {
    q = q.trim().toLowerCase(); var out = $('#search-out');
    var list = q ? PRODUCTS.filter(function (p) { return (p.name + ' ' + p.inside.join(' ')).toLowerCase().indexOf(q) > -1; }) : PRODUCTS.slice(0, 4);
    if (!list.length) { out.innerHTML = empty('Nothing matches “' + esc(q) + '”', 'Try a flower, such as lily, peony or lavender, or see everything.', 'shop.html', 'See all bouquets'); return; }
    out.innerHTML = '<p class="eyebrow">' + (q ? list.length + ' result' + (list.length > 1 ? 's' : '') : 'Popular right now') + '</p><ul class="results">' + list.slice(0, 8).map(function (p) { return '<li><a class="result" href="product.html?id=' + p.id + '"><span class="result__img">' + art(p) + '</span><span class="result__t">' + esc(p.name) + '</span><bdi dir="ltr" class="result__p">' + fmt(p.price) + '</bdi></a></li>'; }).join('') + '</ul>' + (q ? '<a class="btn btn--line btn--block" href="shop.html?q=' + encodeURIComponent(q) + '">See all in shop</a>' : '');
  }

  /* ---------- Pages ---------- */
  function mountIndex() {
    var P = function (id) { return byId(id); };
    /* The admin can hide or delete anything, so a highlight is the preferred piece if it still exists and otherwise the first one that does */
    var bq = PRODUCTS.filter(function (p) { return p.kind === 'bouquet'; });
    var star = P('the-love') || bq[0];
    var coll = function (i, j) { var c = D.collections[i], it = c && (c.items[j] || c.items[0]); return it ? { img: it.img, alt: it.name } : {}; };
    var rows = [
      { href: 'shop.html', w: 'Bouquets', sub: bq.length + ' designs, from ' + fmt(bq.reduce(function (m, p) { return Math.min(m, p.price); }, Infinity)), img: star && star.cut, alt: star && star.name },
      Object.assign({ href: 'collection.html?c=stems', w: 'Single stems', sub: '11 inch long, never wilt' }, coll(0, 0)),
      Object.assign({ href: 'collection.html?c=plushies', w: 'Plushies', sub: 'soft and huggable' }, coll(1, 0)),
      Object.assign({ href: 'collection.html?c=wear', w: 'Wear', sub: 'cardigans and tops' }, coll(2, 0)),
      Object.assign({ href: 'collection.html?c=little', w: 'Little things', sub: 'keyrings, swans, gifts' }, coll(3, 1))
    ].filter(function (r) { return r.img; });
    $('#idx').innerHTML = rows.map(function (r, i) { return '<a class="index__row" data-reveal href="' + r.href + '"><span class="index__n">0' + (i + 1) + '</span><span class="index__w">' + r.w + '<span class="index__sub">' + r.sub + '</span></span><img class="index__img" src="' + r.img + '" alt="' + esc(r.alt) + '" width="400" height="400" loading="lazy"><svg class="index__wave" viewBox="0 0 2160 12" preserveAspectRatio="xMinYMid slice" aria-hidden="true"><path pathLength="1" d="M0 6 C9 0 27 12 36 6 C45 0 63 12 72 6 C81 0 99 12 108 6 C117 0 135 12 144 6 C153 0 171 12 180 6 C189 0 207 12 216 6 C225 0 243 12 252 6 C261 0 279 12 288 6 C297 0 315 12 324 6 C333 0 351 12 360 6 C369 0 387 12 396 6 C405 0 423 12 432 6 C441 0 459 12 468 6 C477 0 495 12 504 6 C513 0 531 12 540 6 C549 0 567 12 576 6 C585 0 603 12 612 6 C621 0 639 12 648 6 C657 0 675 12 684 6 C693 0 711 12 720 6 C729 0 747 12 756 6 C765 0 783 12 792 6 C801 0 819 12 828 6 C837 0 855 12 864 6 C873 0 891 12 900 6 C909 0 927 12 936 6 C945 0 963 12 972 6 C981 0 999 12 1008 6 C1017 0 1035 12 1044 6 C1053 0 1071 12 1080 6 C1089 0 1107 12 1116 6 C1125 0 1143 12 1152 6 C1161 0 1179 12 1188 6 C1197 0 1215 12 1224 6 C1233 0 1251 12 1260 6 C1269 0 1287 12 1296 6 C1305 0 1323 12 1332 6 C1341 0 1359 12 1368 6 C1377 0 1395 12 1404 6 C1413 0 1431 12 1440 6 C1449 0 1467 12 1476 6 C1485 0 1503 12 1512 6 C1521 0 1539 12 1548 6 C1557 0 1575 12 1584 6 C1593 0 1611 12 1620 6 C1629 0 1647 12 1656 6 C1665 0 1683 12 1692 6 C1701 0 1719 12 1728 6 C1737 0 1755 12 1764 6 C1773 0 1791 12 1800 6 C1809 0 1827 12 1836 6 C1845 0 1863 12 1872 6 C1881 0 1899 12 1908 6 C1917 0 1935 12 1944 6 C1953 0 1971 12 1980 6 C1989 0 2007 12 2016 6 C2025 0 2043 12 2052 6 C2061 0 2079 12 2088 6 C2097 0 2115 12 2124 6 C2133 0 2151 12 2160 6"/></svg></a>'; }).join('');
  }
  function mountHome() {
    mountIndex();
    var P = function (id) { return byId(id); };
    var feat = ['white-muse', 'velvet-sun', 'blue-hour', 'forget-me-not'].map(P).filter(Boolean);
    PRODUCTS.filter(function (p) { return p.kind === 'bouquet' && feat.indexOf(p) < 0; }).slice(0, 4 - feat.length).forEach(function (p) { feat.push(p); });
    $('#feat').innerHTML = feat.map(card).join('');
    $('#occ').innerHTML = D.occasions.map(function (o) { return '<a class="occ" data-reveal href="shop.html?occ=' + o.id + '">' + o.label + '</a>'; }).join('');
  }
  function mountShop() {
    var st = { cat: params.get('cat') || 'all', occ: params.get('occ') || '', q: params.get('q') || '', sort: 'featured' };
    $('#chips').innerHTML = D.cats.map(function (c) { return '<button class="chip" data-cat="' + c.id + '" aria-pressed="' + (st.cat === c.id) + '">' + c.label + '</button>'; }).join('');
    $('#occ-sel').innerHTML = '<option value="">Any occasion</option>' + D.occasions.map(function (o) { return '<option value="' + o.id + '"' + (st.occ === o.id ? ' selected' : '') + '>' + o.label + '</option>'; }).join('');
    $('#shop-q').value = st.q;
    function draw() {
      var l = PRODUCTS.filter(function (p) { return (st.cat === 'all' || p.tags.indexOf(st.cat) > -1) && (!st.occ || p.occ.indexOf(st.occ) > -1) && (!st.q || (p.name + ' ' + p.inside.join(' ')).toLowerCase().indexOf(st.q.toLowerCase()) > -1); });
      if (st.sort === 'low') l.sort(function (a, b) { return a.price - b.price; });
      if (st.sort === 'high') l.sort(function (a, b) { return b.price - a.price; });
      $$('#chips .chip').forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-cat') === st.cat); });
      $('#count').textContent = l.length + (l.length === 1 ? ' flower' : ' flowers');
      $('#grid').innerHTML = l.length ? l.map(card).join('') : '<div class="grid__empty">' + empty('Nothing matches that', 'Loosen a filter and the garden opens up again.', 'shop.html', 'Clear all filters') + '</div>';
      reveal();
    }
    $('#chips').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (b) { st.cat = b.getAttribute('data-cat'); draw(); } });
    $('#occ-sel').addEventListener('change', function (e) { st.occ = e.target.value; draw(); });
    $('#sort').addEventListener('change', function (e) { st.sort = e.target.value; draw(); });
    $('#shop-q').addEventListener('input', function (e) { st.q = e.target.value; draw(); });
    $('#reset').addEventListener('click', function () { st = { cat: 'all', occ: '', q: '', sort: 'featured' }; $('#occ-sel').value = ''; $('#sort').value = 'featured'; $('#shop-q').value = ''; draw(); });
    draw();
  }
  function peekHTML(c, it) {
    return '<div class="peek__img">' + itemArt(it).replace(' loading="lazy"', '') + '</div><div class="peek__body"><h2 class="h1">' + esc(it.name) + '</h2><p class="lede">' + esc(it.note) + '</p><ul class="peek__facts">' + (it.facts || []).map(function (f) { return '<li><i data-doodle="check" class="d-xs"></i>' + esc(f) + '</li>'; }).join('') + '</ul>' + (it.colors && it.colors.length ? '<p class="hand hand--rose">available colours: ' + it.colors.join(', ') + '</p>' : '') + '<p class="note">Made to order. Price on request.</p><a class="btn btn--ink" href="contact.html?c=' + c.id + '&item=' + encodeURIComponent(it.name) + '#custom">Ask about this piece</a><a class="btn btn--text" href="collection.html?c=' + c.id + '">more in ' + esc(c.label).toLowerCase() + '</a></div>';
  }
  function mountCollection() {
    var c = D.collections.filter(function (x) { return x.id === params.get('c'); })[0], root = $('#coll');
    if (!c) { root.innerHTML = empty('We could not find that collection', 'Choose one of our crafts instead.', 'index.html#crafts', 'See all crafts'); return; }
    document.title = c.label + ' \u00B7 URB';
    $('#coll-eyebrow').textContent = c.label; $('#coll-title').textContent = c.title; $('#coll-lede').textContent = c.lede;
    root.innerHTML = c.items.map(function (it, i) { return '<article class="card" data-reveal><button class="card__media card__media--btn" data-action="peek" data-c="' + c.id + '" data-i="' + i + '" aria-label="View ' + esc(it.name) + '">' + itemArt(it) + '</button><div class="card__body"><h3 class="card__name">' + esc(it.name) + '</h3><p class="hand hand--olive">' + esc((it.facts || [''])[0]) + '</p><p class="note">Made to order \u00B7 price on request</p><a class="btn btn--line btn--block" href="contact.html?c=' + c.id + '&item=' + encodeURIComponent(it.name) + '#custom">Enquire</a></div></article>'; }).join('');
  }
  function mountProduct() {
    var p = byId(params.get('id')), root = $('#pdp');
    if (!p) { $('.sticky-buy').hidden = true; $('.related').hidden = true; root.innerHTML = empty('We could not find that bouquet', 'It may have sold out or moved. The rest of the garden is open.', 'shop.html', 'Browse bouquets'); document.title = 'Not found · URB'; return; }
    document.title = p.name + ' · URB';
    var min = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    var saved = getWish().indexOf(p.id) > -1;
    root.innerHTML = '<div class="pdp__gallery"><div class="pdp__main" id="pdp-main">' + art(p, true) + '</div></div>' +
      '<div class="pdp__info"><nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="shop.html">Shop</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(p.name) + '</span></nav>' +
      '<h1 class="pdp__title">' + esc(p.name) + '</h1><p class="price price--lg"><bdi dir="ltr"><span class="price__now">' + fmt(p.price) + '</span>' + (p.was ? ' <s class="price__was">' + fmt(p.was) + '</s> <span class="tag tag--inline">Save ' + fmt(p.was - p.price) + '</span>' : '') + '</bdi></p>' +
      '<p class="lede">' + esc(p.line) + '</p><p class="stock" data-low="' + (p.stock <= 3) + '">' + stockNote(p) + '</p>' +
      (p.inside.length ? '<h2 class="hand">what is inside</h2><ul class="inside">' + p.inside.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : '') +
      '<form class="buy" id="buy" novalidate><div class="field"><label for="date">Delivery date</label><input id="date" name="date" type="date" min="' + min + '" required><p class="field__hint">Pick any day from tomorrow.</p><p class="field__error" data-error hidden></p></div>' +
      '<div class="field"><label for="msg">Card message <span class="opt">optional</span></label><textarea id="msg" name="msg" rows="3" maxlength="160" placeholder="Written by hand, 160 characters"></textarea></div>' +
      '<div class="buy__row"><div class="qty qty--lg" role="group" aria-label="Quantity"><button type="button" class="qty__b" data-action="pdp-dec" aria-label="Decrease">−</button><output class="qty__n" id="pq">1</output><button type="button" class="qty__b" data-action="pdp-inc" aria-label="Increase">+</button></div><button class="btn btn--ink btn--grow" type="submit" data-intent="add">Add to bag</button></div>' +
      '<button class="btn btn--line btn--block" type="submit" data-intent="buy">Buy now</button>' +
      '<button class="btn btn--text btn--block" type="button" data-action="wish" data-id="' + p.id + '" aria-pressed="' + saved + '">' + icon.heart + '<span data-wish-label>' + (saved ? 'Saved' : 'Save for later') + '</span></button></form>' +
      '<div class="acc"><details><summary>Delivery</summary><p>Delivery is <bdi dir="ltr">' + fmt(p.fee) + '</bdi> for this ' + (p.kind === 'bouquet' ? 'bouquet. Each bouquet is wrapped and ribboned, then packed to arrive upright' : 'item. Every piece is packed with care to arrive in shape') + '. <a href="delivery.html">Full delivery details</a>.</p></details><details><summary>Care</summary><p>Crochet never wilts and needs no water. Keep it dry and out of direct sun, and dust it with a soft brush. <a href="delivery.html#care">Care guide</a>.</p></details><details><summary>Made by hand</summary><p>Each stem is crocheted by hand, so small differences in shape or yarn shade are part of the piece. Ask us about colour changes on the <a href="contact.html#custom">custom bouquet form</a>.</p></details></div></div>';
    if (p.stock <= 0) { $$('#buy [type="submit"]').forEach(function (b) { b.disabled = true; }); }
    var qty = 1;
    root.addEventListener('click', function (e) {
      var a = e.target.closest('[data-action]'); if (!a) return;
      if (a.dataset.action === 'pdp-inc') qty = Math.min(p.stock, qty + 1);
      if (a.dataset.action === 'pdp-dec') qty = Math.max(1, qty - 1);
      $('#pq').textContent = qty;
      if (a.dataset.action === 'wish') setTimeout(function () { $('[data-wish-label]').textContent = a.getAttribute('aria-pressed') === 'true' ? 'Saved' : 'Save for later'; }, 0);
    });
    $('#buy').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = $('#date'), err = $('[data-error]', $('#buy')), intent = e.submitter ? e.submitter.getAttribute('data-intent') : 'add';
      if (!d.value || d.value < min) { err.textContent = 'Please choose a delivery date from tomorrow.'; err.hidden = false; d.setAttribute('aria-invalid', 'true'); d.focus(); return; }
      err.hidden = true; d.removeAttribute('aria-invalid');
      write('urb.pdp.' + p.id, { date: d.value, msg: $('#msg').value }); write('urb.prefill', { date: d.value, msg: $('#msg').value });
      addToCart(p.id, qty);
      if (intent === 'buy') location.href = 'checkout.html'; else openDlg('dlg-cart');
    });
    $('#related').innerHTML = PRODUCTS.filter(function (x) { return x.id !== p.id && x.tags.some(function (t) { return p.tags.indexOf(t) > -1; }); }).slice(0, 4).map(card).join('');
    $('#sticky-name').textContent = p.name; $('#sticky-price').textContent = fmt(p.price);
    if (p.stock <= 0) { $('#sticky-add').disabled = true; $('#sticky-add').textContent = 'Sold out'; }
    $('#sticky-add').addEventListener('click', function () { $('#buy').requestSubmit($('#buy [data-intent="add"]')); });
  }
  function summaryHTML(t, withLines) {
    return (withLines === false ? '' : '<ul class="lines lines--ro">' + cartLines(false) + '</ul>') + '<dl class="sum"><div><dt>Subtotal</dt><dd><bdi dir="ltr">' + fmt(t.sub) + '</bdi></dd></div>' + (t.disc ? '<div><dt>Promo ' + t.promoCode + '</dt><dd><bdi dir="ltr">−' + fmt(t.disc) + '</bdi></dd></div>' : '') + '<div><dt>Delivery</dt><dd><bdi dir="ltr">' + fmt(t.fee) + '</bdi></dd></div><div class="sum__total"><dt>Total</dt><dd><bdi dir="ltr">' + fmt(t.total) + '</bdi></dd></div></dl>' + (t.saved ? '<p class="note note--ok">You are saving ' + fmt(t.saved) + ' on this bag.</p>' : '');
  }
  function hintPromo() { return promoList().filter(function (p) { return p.active !== false && findPromo(p.code); })[0]; }
  function promoForm(t) {
    return '<form class="promo" data-form="promo" novalidate><label for="promo-in">Promo code</label><div class="promo__row"><input id="promo-in" name="code" autocomplete="off" placeholder="Enter a code"' + (t.promo ? ' value="' + t.promoCode + '" readonly' : '') + '><button class="btn btn--line" type="submit">' + (t.promo ? 'Remove' : 'Apply') + '</button></div><p class="field__error" data-error hidden></p>' + (hintPromo() ? '<p class="field__hint">Try ' + hintPromo().code + ' for ' + hintPromo().pct + '% off.</p>' : '') + '</form>';
  }
  function renderCartPage() {
    var t = totals(), r = $('#cart-root');
    if (!t.ls.length) { r.innerHTML = empty('Your bag is empty', 'Choose a bouquet and it will wait for you here.', 'shop.html', 'Browse bouquets'); return; }
    r.innerHTML = '<div class="split"><section aria-labelledby="bag-h"><h2 class="sr" id="bag-h">Items</h2><ul class="lines">' + cartLines(true) + '</ul><a class="btn btn--text" href="shop.html">← Keep browsing</a></section><aside class="panel" aria-label="Order summary"><h2 class="panel__t">Summary</h2>' + summaryHTML(t, false) + promoForm(t) + '<a class="btn btn--ink btn--block" href="checkout.html">Checkout</a></aside></div>';
  }
  function renderCheckoutSummary() {
    var t = totals(), r = $('#co-summary'); if (!r) return;
    if (!t.ls.length) { $('#co-root').innerHTML = empty('Nothing to check out yet', 'Add a bouquet and come straight back.', 'shop.html', 'Browse bouquets'); return; }
    r.innerHTML = summaryHTML(t) + promoForm(t);
  }
  function mountCheckout() {
    if (!$('#co')) return;
    var pre = read('urb.prefill', {}), prof = read('urb.profile', {});
    $('#city').innerHTML = '<option value="">Select city</option>' + D.cities.map(function (c) { return '<option>' + c + '</option>'; }).join('');
    var dt = $('#c-date'); dt.min = new Date(Date.now() + 864e5).toISOString().slice(0, 10); if (pre.date) dt.value = pre.date; if (pre.msg) $('#c-msg').value = pre.msg;
    ['name', 'phone', 'email', 'city', 'address'].forEach(function (k) { if (prof[k]) $('[name="' + k + '"]').value = prof[k]; });
    renderCheckoutSummary();
    $('#co').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, rules = {
        name: function (v) { return v.trim().length < 2 ? 'Please tell us who the order is for.' : ''; },
        phone: function (v) { return !/^(\+92|0)?3\d{9}$/.test(v.replace(/[\s-]/g, '')) ? 'Enter a Pakistani mobile number, like 0300 1234567.' : ''; },
        email: function (v) { return v && !/^\S+@\S+\.\S+$/.test(v) ? 'That email does not look right.' : ''; },
        city: function (v) { return !v ? 'Choose a city.' : ''; },
        address: function (v) { return v.trim().length < 10 ? 'Add a full address so the rider can find you.' : ''; },
        date: function (v) { return !v || v < dt.min ? 'Choose a delivery date from tomorrow.' : ''; }
      }, first = null;
      Object.keys(rules).forEach(function (k) {
        var el = f.elements[k], m = rules[k](el.value), er = $('[data-for="' + k + '"]'); er.textContent = m; er.hidden = !m;
        if (m) { el.setAttribute('aria-invalid', 'true'); first = first || el; } else el.removeAttribute('aria-invalid');
      });
      if (first) { first.focus(); return; }
      var t = totals(); if (!t.ls.length) return;
      var id = 'URB-' + (100000 + Math.floor(Math.random() * 899999)), o = { id: id, at: Date.now(), name: f.elements.name.value.trim(), phone: f.elements.phone.value, city: f.elements.city.value, address: f.elements.address.value.trim(), date: f.elements.date.value, slot: f.elements.slot.value, pay: f.elements.pay.value, msg: f.elements.msg.value, items: t.ls.map(function (l) { return { id: l.p.id, name: l.p.name, qty: l.qty, price: l.p.price }; }), sub: t.sub, disc: t.disc, fee: t.fee, total: t.total };
      var orders = read('urb.orders', []); orders.unshift(o); write('urb.orders', orders);
      /* The same order, in the back office's shape, so it shows up in admin/ straight away. */
      var now = o.at, dbo = read('urb.db.orders', []);
      dbo.unshift({ id: o.id, at: now, createdAt: now, status: 'new', payment: 'unpaid', pay: o.pay, customer: { name: o.name, phone: o.phone, email: f.elements.email.value.trim(), city: o.city, address: o.address }, items: o.items, sub: t.sub, disc: t.disc, fee: t.fee, total: t.total, date: o.date, slot: o.slot, msg: o.msg, notes: [], history: [{ at: now, status: 'new', by: 'storefront' }], source: 'storefront', reserved: D.db.seeded('products') });
      write('urb.db.orders', dbo);
      if (D.db.seeded('products')) {
        var dbp = read('urb.db.products', []), mv = read('urb.db.stockmoves', []);
        o.items.forEach(function (i) { dbp.forEach(function (p) { if (p.id === i.id) { var n = Math.max(0, (p.stock || 0) - i.qty); mv.unshift({ id: 'sm_' + now.toString(36) + i.id, at: now, productId: p.id, name: p.name, delta: n - (p.stock || 0), reason: 'Order ' + o.id, by: 'storefront' }); p.stock = n; } }); });
        write('urb.db.products', dbp); write('urb.db.stockmoves', mv);
      }
      if (t.promoCode && D.db.seeded('promos')) { write('urb.db.promos', read('urb.db.promos', []).map(function (p) { return String(p.code).toUpperCase() === t.promoCode ? Object.assign({}, p, { used: (p.used || 0) + 1 }) : p; })); }
      write('urb.profile', { name: o.name, phone: o.phone, email: f.elements.email.value, city: o.city, address: o.address });
      setCart([]); try { localStorage.removeItem('urb.promo'); localStorage.removeItem('urb.prefill'); } catch (x) { /* noop */ }
      location.href = 'order-confirmed.html?o=' + id;
    });
    $('#co').addEventListener('input', function (e) { var er = $('[data-for="' + e.target.name + '"]'); if (er && !er.hidden) { er.hidden = true; e.target.removeAttribute('aria-invalid'); } });
    $('#co').addEventListener('change', function (e) { if (e.target.name === 'pay') $$('[data-pay]').forEach(function (n) { n.hidden = n.getAttribute('data-pay') !== e.target.value; }); });
  }
  function findOrder(id) { return read('urb.orders', []).filter(function (o) { return o.id.toLowerCase() === (id || '').toLowerCase(); })[0]; }
  function mountConfirmed() {
    var o = findOrder(params.get('o')), r = $('#done');
    if (!o) { r.innerHTML = empty('We could not find that order', 'Orders live in this browser. Check the number, or track it by order number.', 'track.html', 'Track an order'); return; }
    r.innerHTML = '<p class="eyebrow">Order placed</p><h1 class="h1">Thank you, ' + esc(o.name.split(' ')[0]) + '.</h1><p class="lede">Your order number is <strong>' + o.id + '</strong>. We will deliver your bouquet on ' + esc(o.date) + ' and message you when it leaves.</p><div class="panel"><ul class="lines lines--ro">' + o.items.map(function (i) { var p = byId(i.id); return '<li class="line"><span class="line__img">' + (p ? art(p) : '') + '</span><div class="line__main"><p class="line__name">' + esc(i.name) + '</p><p class="line__meta">Qty ' + i.qty + '</p></div><bdi dir="ltr" class="line__total">' + fmt(i.price * i.qty) + '</bdi></li>'; }).join('') + '</ul><dl class="sum"><div><dt>Delivery</dt><dd><bdi dir="ltr">' + fmt(o.fee) + '</bdi></dd></div><div class="sum__total"><dt>Total</dt><dd><bdi dir="ltr">' + fmt(o.total) + '</bdi></dd></div></dl><p class="note">Payment: ' + ({ cod: 'Cash on delivery', bank: 'Bank transfer (details sent by message)', card: 'Card (link sent by message)' }[o.pay] || o.pay) + '</p></div><div class="parcel"><img class="art art--soft" src="' + D.brand.box + '" alt="The URB parcel box with its pink handle" width="1000" height="1250" loading="lazy"><p class="note">Your order arrives in the berry-pink urb box.</p></div><div class="actions"><a class="btn btn--ink" href="track.html?o=' + o.id + '">Track this order</a><a class="btn btn--line" href="shop.html">Keep browsing</a></div>';
  }
  function mountTrack() {
    var form = $('#track'), out = $('#track-out'), steps = ['Order received', 'Bouquet checked', 'Wrapped and ribboned', 'Out for delivery', 'Delivered'];
    function show(id) {
      var o = findOrder(id), stage;
      if (o) stage = Math.min(4, Math.floor((Date.now() - o.at) / 6e4 / 2) + 1); else if (/^URB-\d{6}$/i.test(id)) stage = 3; else { out.innerHTML = empty('No order with that number', 'Order numbers look like URB-123456. You can also try a demo order.', 'track.html?o=URB-100000', 'Try a demo order'); return; }
      out.innerHTML = '<div class="panel"><h2 class="panel__t">' + id.toUpperCase() + (o ? '' : ' <span class="opt">demo</span>') + '</h2><ol class="steps">' + steps.map(function (s, i) { return '<li data-state="' + (i < stage ? 'done' : i === stage ? 'now' : 'next') + '"><span class="steps__dot"></span><span>' + s + '</span></li>'; }).join('') + '</ol><p class="note">Demo status: it advances every two minutes after you place an order.</p></div>';
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = $('#t-id').value.trim(); if (!v) { $('[data-error]', form).textContent = 'Enter your order number.'; $('[data-error]', form).hidden = false; $('#t-id').focus(); return; } $('[data-error]', form).hidden = true; show(v); });
    if (params.get('o')) { $('#t-id').value = params.get('o'); show(params.get('o')); }
  }
  function renderWishlist() {
    var l = getWish().map(byId).filter(Boolean), g = $('#wish-grid');
    g.innerHTML = l.length ? l.map(card).join('') : empty('Nothing saved yet', 'Tap the heart on any bouquet to keep it here.', 'shop.html', 'Browse bouquets');
    reveal();
  }

  /* ---------- Delegated actions ---------- */
  function openDlg(id) { var d = document.getElementById(id); if (d && !d.open) { if (id === 'dlg-search') { runSearch(''); } d.showModal(); var f = $('input', d); if (f) f.focus(); } }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]');
    if (e.target.matches('dialog.sheet')) { e.target.close(); return; }
    if (!a) { var l = e.target.closest('dialog a[href]'); if (l) { var d = l.closest('dialog'); if (l.getAttribute('href').charAt(0) !== '#') d.close(); } return; }
    var id = a.getAttribute('data-id'), act = a.getAttribute('data-action');
    if (act === 'add') addToCart(id);
    if (act === 'wish') { var w = getWish().slice(), i = w.indexOf(id); if (i > -1) { w.splice(i, 1); toast('Removed from saved.'); } else { w.push(id); toast('Saved. Find it under the heart.'); } setWish(w); }
    if (act === 'peek') { var cc = D.collections.filter(function (x) { return x.id === a.getAttribute('data-c'); })[0]; $('#peek').innerHTML = peekHTML(cc, cc.items[+a.getAttribute('data-i')]); $('#peek-eyebrow').textContent = cc.label; openDlg('dlg-peek'); }
    if (act === 'open-cart') openDlg('dlg-cart');
    if (act === 'open-search') openDlg('dlg-search');
    if (act === 'open-menu') openDlg('dlg-menu');
    if (act === 'close') a.closest('dialog').close();
    if (act === 'inc' || act === 'dec' || act === 'remove') { var cur = getCart().filter(function (x) { return x.id === id; })[0]; if (cur) setQty(id, act === 'remove' ? 0 : cur.qty + (act === 'inc' ? 1 : -1)); }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'q') runSearch(e.target.value); });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
    var kind = f.getAttribute('data-form'), er = $('[data-error]', f);
    if (kind === 'newsletter') { var v = f.elements.email.value; if (!/^\S+@\S+\.\S+$/.test(v)) { er.textContent = 'Enter a valid email.'; er.hidden = false; return; } er.hidden = true; f.reset(); toast('You are on the list. Welcome.'); }
    if (kind === 'promo') { if (read('urb.promo', null)) { try { localStorage.removeItem('urb.promo'); } catch (x) { /* noop */ } sync(); toast('Promo removed.'); return; } var pr = findPromo(f.elements.code.value); if (!pr) { er.textContent = 'That code is not valid or has expired.'; er.hidden = false; return; } write('urb.promo', pr.code); sync(); toast(pr.pct + '% off applied.'); }
    if (kind === 'contact' || kind === 'custom') {
      var bad = null; $$('[required]', f).forEach(function (el) { var ok = el.value.trim() && (el.type !== 'email' || /^\S+@\S+\.\S+$/.test(el.value)); var m = $('[data-for="' + el.name + '"]', f); if (m) { m.hidden = !!ok; } if (!ok) { el.setAttribute('aria-invalid', 'true'); bad = bad || el; } else el.removeAttribute('aria-invalid'); });
      if (bad) { bad.focus(); return; }
      var fe = f.elements, enq = { id: 'enq_' + Date.now().toString(36), at: Date.now(), createdAt: Date.now(), name: fe.name.value.trim(), status: 'new', source: 'storefront' };
      if (kind === 'contact') { enq.email = fe.email.value.trim(); enq.brief = fe.msg.value.trim(); enq.occasion = 'General'; }
      else { var ct = fe.contact.value.trim(); if (/@/.test(ct)) enq.email = ct; else enq.phone = ct; enq.occasion = fe.occ.value; enq.brief = fe.brief.value.trim(); if (params.get('item')) enq.item = params.get('item'); }
      var eq = read('urb.db.enquiries', []); eq.unshift(enq); write('urb.db.enquiries', eq);
      f.hidden = true; $('[data-done="' + kind + '"]').hidden = false; $('[data-done="' + kind + '"]').focus();
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openDlg('dlg-search'); } });

  /* ---------- Reveal on scroll: CSS owns the animation, JS only flips a data hook ---------- */
  var io;
  function reveal() {
    var els = $$('[data-reveal]:not([data-in]), .doodle:not([data-in]), .hand:not([data-in])');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(function (e) { e.setAttribute('data-in', ''); }); return; }
    io = io || new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.setAttribute('data-in', ''); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  chrome();
  sync();
  doodles();
  var raf; new MutationObserver(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { doodles(); reveal(); }); }).observe(document.body, { childList: true, subtree: true });
  if (page === 'collection') mountCollection();
  if (page === 'contact' && params.get('item')) { $('#x-brief').value = 'I would like to ask about: ' + params.get('item') + '.\nColours, size and budget: '; var oc = $('#x-occ'); if (oc) oc.value = 'Other'; if (location.hash === '#custom') setTimeout(function () { $('#x-brief').focus({ preventScroll: true }); }, 0); }
  if (page === 'home') mountHome();
  if (page === 'about') mountIndex();
  if (page === 'shop') mountShop();
  if (page === 'product') mountProduct();
  if (page === 'cart') renderCartPage();
  if (page === 'checkout') mountCheckout();
  if (page === 'confirmed') mountConfirmed();
  if (page === 'track') mountTrack();
  if (page === 'wishlist') renderWishlist();
  
  if (page === 'delivery' && location.hash) { var t = $(location.hash); if (t && t.tagName === 'DETAILS') t.open = true; }
  reveal();
})();
