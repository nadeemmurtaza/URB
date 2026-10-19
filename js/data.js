/* Catalogue: names, prices (Rs, already 10% off where Pluto shows a discount), stock and
   delivery fee are taken from plutopakistan.com/stores/urb-394. Photos are URB's own product
   photos from that listing. Occasions and one-line descriptions are demo copy. */
window.URB_DATA = (function () {
  var SOFT = ['lily', 'mystic-bloom']; /* these two do not cut out cleanly, so the photo is feathered into the page instead */
  var P = function (id, name, price, was, stock, fee, inside, tags, occ, line) {
    return { id: id, name: name, price: price, was: was, stock: stock, fee: fee, inside: inside, tags: tags, occ: occ, line: line, photo: 'assets/products/' + id + '.webp', soft: SOFT.indexOf(id) > -1, img: SOFT.indexOf(id) > -1 ? 'assets/products/' + id + '.webp' : 'assets/cut/b-' + id + '.webp' };
  };
  var products = [
    P('forget-me-not', "Forget-Me-Not Bouquet", 2650, 0, 8, 180, ["3 forget-me-not stems (15 blooms)"], ["pastel", "under10"], ["gratitude", "justbecause"], "Fifteen small pink blooms on three stems, wrapped in newsprint and ribbon."),
    P('white-muse', "White Muse Bouquet", 6075, 6750, 5, 360, ["1 peony", "1 dahlia", "1 lavender stem"], ["pastel", "under10"], ["anniversary", "justbecause"], "A cream peony and dahlia with orange lavender, wrapped in mauve."),
    P('thai-lily-valley', "Thai & Lily of the Valley", 6210, 6900, 5, 360, ["1 Thai rose", "2 small daisies", "1 leaf stem", "1 lily of the valley"], ["roses", "under10"], ["justbecause", "birthday"], "A deep red Thai rose with daisies and lily of the valley, resting on crocheted leaves."),
    P('moss-bloom', "Moss & Bloom Bouquet", 6255, 6950, 3, 360, ["2 lilies", "2 forget-me-not bud stems (5 buds each)", "1 mini pom-pom"], ["lilies", "under10"], ["birthday", "gratitude"], "Purple and grey lilies with forget-me-nots, finished with a navy ribbon."),
    P('pink-whimsy', "Pink Whimsy Bouquet", 8370, 9300, 1, 360, ["1 pink double-layer sunflower", "Lavender", "1 freesia stem", "1 lily of the valley", "1 cymbidium", "Long and small leaves"], ["sunflowers", "pastel", "under10"], ["birthday", "justbecause"], "A pink sunflower with lavender and freesia, wrapped in dusty rose."),
    P('lily', "Lily Bouquet", 9450, 10500, 2, 550, ["3 lilies", "3 small roses"], ["lilies", "roses", "under10"], ["anniversary", "gratitude"], "White lilies and red roses, crocheted in clean white yarn."),
    P('forever-remembered', "Forever Remembered Bouquet", 10485, 11650, 1, 360, ["Corn poppy", "1 small rose", "1 dahlia", "2 forget-me-not stems", "3 bud stems"], ["roses", "bold"], ["getwell", "gratitude"], "Poppy, rose and dahlia in red and blush, tied with a pink bow."),
    P('blue-hour', "Blue Hour Bouquet", 11340, 12600, 1, 360, ["1 blue double-layer sunflower", "1 gerbera", "1 small daisy", "1 bud stem", "2 forget-me-not stems"], ["sunflowers", "bold"], ["birthday", "justbecause"], "A deep blue sunflower in a pale blue wrap and a royal blue ribbon."),
    P('peony-grace', "Peony Grace Bouquet", 11475, 12750, 3, 360, ["1 Thai rose", "3 peonies", "1 bud stem"], ["roses", "bold"], ["anniversary", "love"], "A deep red rose beside peonies, wrapped in kraft paper."),
    P('mystic-bloom', "Mystic Bloom Bouquet", 11610, 12900, 2, 360, ["1 gerbera", "3 open tulips", "4 lavender stems", "2 forget-me-not stems", "1 calla lily"], ["pastel", "lilies"], ["birthday", "gratitude"], "Blue calla, tulips and lavender with a white daisy, in a mauve wrap."),
    P('violet', "Violet Bouquet", 12285, 13650, 1, 360, ["1 Thai rose", "Lewisia", "1 small sunflower", "2 forget-me-not stems", "Lavender"], ["bold"], ["justbecause", "birthday"], "Violet blooms and a golden chrysanthemum in a mauve wrap."),
    P('velvet-sun', "Velvet Sun Bouquet", 12555, 13950, 1, 360, ["1 red double-layer sunflower", "1 Chinese rose", "1 iris", "1 calla lily", "1 small daisy", "1 bud stem"], ["sunflowers", "roses", "bold"], ["love", "anniversary"], "A red sunflower with Chinese rose and calla lily, wrapped in kraft and red."),
    P('tea-rose-daisy', "Tea Rose Daisy Bouquet", 12825, 14250, 1, 360, ["1 African daisy", "2 open tulips", "2 calla lilies", "Dill flower", "3 forget-me-not stems"], ["pastel"], ["getwell", "gratitude"], "Pink daisies and calla lilies in a sheer blush wrap."),
    P('garden-symphony', "Garden Symphony Bouquet", 12960, 14400, 1, 550, ["2 lilies", "3 small roses", "1 double-layer sunflower", "3 small daisies", "1 leaf stem"], ["sunflowers", "lilies", "roses"], ["birthday", "anniversary"], "Lilies, small roses and a golden sunflower in a blush wrap."),
    P('pink-fawn', "Pink Fawn Bouquet", 13140, 14600, 1, 360, ["1 lily", "1 peony", "1 Valentine rose", "3 forget-me-not stems", "3 bud stems"], ["lilies", "roses", "pastel"], ["love", "anniversary"], "Lily, peony and a Valentine rose in soft pinks, wrapped in mauve."),
    P('stargazer-sky', "Stargazer Sky Bouquet", 13680, 15200, 1, 360, ["1 premium 12-petal Stargazer lily", "1 open tulip", "6 lavender stems", "2 forget-me-not stems"], ["lilies"], ["anniversary", "love"], "A white Stargazer lily with lavender and a blue tulip."),
    P('rose-amour', "Rose Amour Bouquet", 14130, 15700, 2, 360, ["2 Thai roses", "4 small roses", "3 forget-me-not stems"], ["roses", "bold"], ["love", "anniversary"], "Deep red, white and pink roses with baby’s-breath, wrapped in newsprint."),
    P('lilly-belle', "Lilly Belle Bouquet", 17100, 19000, 1, 360, ["3 lilies", "1 gerbera", "2 open tulips", "3 small daisies", "2 lavender stems", "2 forget-me-not stems"], ["lilies", "pastel"], ["anniversary", "birthday"], "Pink lilies, daisies and a monstera leaf, arranged in a white pot."),
    P('lily-orchid', "Lily Orchid Bouquet", 17415, 19350, 1, 550, ["3 lilies", "3 orchid flowers", "3 open tulips", "3 small roses"], ["lilies", "bold"], ["anniversary", "love"], "Magenta lilies, a blue lily and tulips in a pink wrap."),
    P('the-love', "The Love Bouquet", 17505, 19450, 2, 360, ["4 vine glass roses", "6 small roses", "1 pom-pom", "1 small leaf"], ["roses", "bold"], ["love", "anniversary"], "Ten roses in red, pink and yellow, wrapped in bold red.")
  ];
  var occasions = [
    { id: 'love', label: 'Love' }, { id: 'anniversary', label: 'Anniversary' },
    { id: 'birthday', label: 'Birthday' }, { id: 'gratitude', label: 'Thank you' },
    { id: 'getwell', label: 'Get well' }, { id: 'justbecause', label: 'Just because' }
  ];
  var cats = [
    { id: 'all', label: 'All' }, { id: 'roses', label: 'Roses' }, { id: 'lilies', label: 'Lilies' },
    { id: 'sunflowers', label: 'Sunflowers' }, { id: 'pastel', label: 'Soft' }, { id: 'bold', label: 'Bold' }, { id: 'under10', label: 'Under Rs 10,000' }
  ];
  var collections = [
    { id: 'stems', label: 'Single stems', title: 'One flower, all yours', lede: 'Long-stem crochet flowers in washable acrylic yarn. Each is about 11 inches tall, made by hand, and never wilts.',
      items: [
        { id: 'poppy', name: 'Corn poppy', img: 'assets/cut/poppy.webp', facts: ['4 big petals', '2.5 hrs making', 'acrylic \u00B7 washable', '11 inch stem'], colors: ['orange', 'pink', 'white', 'purple'], note: 'A flower for deep emotion, comfort and shared memory. Four big ruffled petals and a green centre.' },
        { id: 'lewisia', name: 'Lewisia flower', img: 'assets/cut/lewisia.webp', facts: ['8 petals and tenticals', '4 ply yarn', 'handmade \u00B7 washable', '11 inch stem'], colors: [], note: 'A symbol of resilience and endurance, in deep blue with a golden centre.' },
        { id: 'iris', name: 'Iris flower', img: 'assets/cut/iris.webp', facts: ['6 petal flower', '3 hrs making', '4 ply yarn', '11 inch stem'], colors: [], note: 'Hope, wisdom, courage and faith. Do not give flowers just for love.' }
      ] },
    { id: 'plushies', label: 'Plushies', title: 'Plushies you can hug', lede: 'Soft chenille-style plushies, crocheted one round at a time. Each is made to order, so choose the colour and size you want.',
      items: [
        { id: 'cat', name: 'Chonky cat', img: 'assets/cut/cat.webp', facts: ['stitched whisker face', 'upright tail', 'made to order'], note: 'A round, soft cat. Shown in lilac-grey; also made in pink and purple.' },
        { id: 'mr-snake', name: 'Mr Snake', img: 'assets/cut/snake.webp', facts: ['URB\u2019s first biggest project', 'sand-beige yarn', 'very huggable'], note: 'A long cuddly snake. It was URB\u2019s first, biggest project.' },
        { id: 'plush-bouquet', name: 'Rose plush bouquet', img: 'assets/photos/plush-bouquet.webp', soft: true, facts: ['chunky pink roses', 'cream ruffle wrap', 'a bouquet you can hug'], note: 'Chunky pink roses on green leaves, in a cream ruffled wrap.' }
      ] },
    { id: 'wear', label: 'Wear', title: 'Crochet to wear', lede: 'Cardigans, vests and tops in cotton yarn. Every piece is made to order, so sizes and colours are yours to choose.',
      items: [
        { id: 'patchwork', name: 'Patchwork cardigan', img: 'assets/cut/patchwork-back.webp', facts: ['colour blocks', 'balloon sleeves', 'made to order'], note: 'Blush, peach, cream and chocolate blocks, shown with a matching crochet bandana.' },
        { id: 'top-blue', name: 'Open-knit striped top', img: 'assets/cut/top-blue.webp', facts: ['cotton yarn', '12 hours to make 1 piece', 'handmade'], note: 'An airy boat-neck top in blue, navy and cream stripes.' },
        { id: 'vase-top', name: 'Flower vase top', img: 'assets/cut/top-vase.webp', facts: ['white poncho top', 'cotton yarn', 'hand crocheted'], note: 'A white poncho top with a crocheted vase and leaf motif and chocolate trim.' }
      ] },
    { id: 'little', label: 'Little things', title: 'Gifts & little things', lede: 'Keyrings, scarves, amigurumi and wrapped gift baskets. Tell us what you have in mind and we will make it.',
      items: [
        { id: 'coffee-keyring', name: 'Coffee mug keyring', img: 'assets/cut/coffee-keyring.webp', facts: ['2 hour making time', '4 ply yarn', 'tag your coffee lover'], note: 'A tiny crochet coffee cup with a sleeve and a face. Get your fav keyring: DM to order.' },
        { id: 'daisy-keyring', name: 'Pink daisy bouquet keyring', img: 'assets/cut/daisy-keyring.webp', facts: ['35 min making time', '4 ply yarn', 'handmade'], note: 'Tiny blooms, made to stay with you.' },
        { id: 'swan', name: 'Cutu little swan', img: 'assets/cut/swan.webp', facts: ['cream yarn', 'pink beak', 'satin ribbon'], note: 'An amigurumi swan with a pink satin ribbon.' },
        { id: 'accessories', name: 'Scarf, paw gloves & garland', img: 'assets/photos/accessories.webp', soft: true, facts: ['red scarf with a bow', 'paw-print gloves', 'flower garland'], note: 'A cute order made for one client.' },
        { id: 'basket', name: 'Bouquet gift basket', img: 'assets/photos/basket.webp', soft: true, facts: ['wrapped in layers', 'pink flowers and a bow'], note: 'Crochet gifts layered into a wrapped basket.' }
      ] }
  ];
  var cities = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Faisalabad', 'Multan', 'Another city'];
  /* The back office (admin/) owns the catalogue once it has been opened: the same browser storage, namespaced urb.db.*.
     Until then, and whenever storage is unavailable, the lists above are used as they are. */
  var defaults = { products: products.slice(), collections: JSON.parse(JSON.stringify(collections)) };
  var dbRead = function (k) { try { return JSON.parse(localStorage.getItem('urb.db.' + k)); } catch (e) { return null; } };
  var dbSeeded = function (k) { try { return localStorage.getItem('urb.db.' + k + '.seeded') === 'true'; } catch (e) { return false; } };
  var promoDefault = { code: 'WELCOME5', pct: 5 };
  (function () {
    var dp = dbRead('products');
    if (dbSeeded('products') && Array.isArray(dp)) {
      products = dp.filter(function (p) { return p.active !== false; }).map(function (p) {
        return { id: p.id, name: p.name, price: +p.price || 0, was: +p.was || 0, stock: Math.max(0, +p.stock || 0), fee: +p.fee || 0, inside: p.inside || [], tags: p.tags || [], occ: p.occ || [], line: p.line || '', photo: p.photo || p.img, soft: !!p.soft, img: p.img };
      });
    }
    var di = dbRead('items');
    if (dbSeeded('items') && Array.isArray(di)) {
      collections = collections.map(function (c) {
        return { id: c.id, label: c.label, title: c.title, lede: c.lede, items: di.filter(function (i) { return i.collection === c.id && i.active !== false; }).map(function (i) { return { id: i.id, name: i.name, img: i.img, soft: !!i.soft, facts: i.facts || [], colors: i.colors || [], note: i.note || '' }; }) };
      });
    }
    var st = dbRead('settings');
    if (Array.isArray(st) && st[0] && Array.isArray(st[0].cities) && st[0].cities.length) cities = st[0].cities;
  })();
  return { defaults: defaults, db: { read: dbRead, seeded: dbSeeded }, products: products, collections: collections, occasions: occasions, cats: cats, cities: cities,
    brand: { name: 'URB', tagline: 'ur beloved', box: 'assets/photos/box.webp', maker: 'assets/photos/maker.webp', instagram: 'https://www.instagram.com/shop.urb', tiktok: 'https://www.tiktok.com/@shop.urb', pluto: 'https://plutopakistan.com/stores/urb-394', facebook: 'https://www.facebook.com/share/15Buz3M4xc/' },
    promo: promoDefault };
})();
