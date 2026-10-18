/* Catalogue: names, prices (Rs, already 10% off where Pluto shows a discount), stock and
   delivery fee are taken from plutopakistan.com/stores/urb-394. Copy lines are demo copy. */
window.URB_DATA = (function () {
  var P = function (id, name, price, was, stock, fee, inside, tags, occ, colors, blooms, line) {
    return { id: id, name: name, price: price, was: was, stock: stock, fee: fee, inside: inside, tags: tags, occ: occ, colors: colors, blooms: blooms, line: line };
  };
  var products = [
    P('forget-me-not', 'Forget-Me-Not Bouquet', 2650, 0, 8, 180, ['3 forget-me-not stems (15 blooms)'], ['pastel', 'under10'], ['gratitude', 'justbecause'], ['#8EA7D8', '#A9BDE6', '#6F8CC4'], 9, 'Fifteen tiny blue blooms, tied plain. The quietest way to say remember me.'),
    P('white-muse', 'White Muse Bouquet', 6075, 6750, 5, 360, ['1 peony', '1 dahlia', '1 lavender stem'], ['pastel', 'under10'], ['anniversary', 'justbecause'], ['#F4EEE6', '#EBCFCB', '#B9A7D6'], 6, 'Soft, white and unhurried: a peony, a dahlia and a breath of lavender.'),
    P('thai-lily-valley', 'Thai & Lily of the Valley', 6210, 6900, 5, 360, ['1 Thai rose', '2 small daisies', '1 leaf stem', '1 lily of the valley'], ['roses', 'under10'], ['justbecause', 'birthday'], ['#E8A5B0', '#FFFDF9', '#F4EEE6'], 6, 'A single Thai rose with bell-white lily of the valley.'),
    P('moss-bloom', 'Moss & Bloom Bouquet', 6255, 6950, 3, 360, ['2 lilies', '2 forget-me-not bud stems (5 buds each)', '1 mini pom-pom'], ['lilies', 'under10'], ['birthday', 'gratitude'], ['#F4D9C6', '#8EA7D8', '#9BB38F'], 7, 'Lilies against moss-green leaf, with forget-me-nots at the edge.'),
    P('pink-whimsy', 'Pink Whimsy Bouquet', 8370, 9300, 1, 360, ['1 pink double-layer sunflower', 'Lavender', '1 freesia stem', '1 lily of the valley', '1 cymbidium', 'Long and small leaves'], ['sunflowers', 'pastel', 'under10'], ['birthday', 'justbecause'], ['#E9A3B8', '#C5A9DA', '#FFFDF9'], 8, 'A pink sunflower, lavender and freesia: playful, never loud.'),
    P('lily', 'Lily Bouquet', 9450, 10500, 2, 550, ['3 lilies', '3 small roses'], ['lilies', 'roses', 'under10'], ['anniversary', 'gratitude'], ['#F7E3E1', '#E8A5B0', '#FFFDF9'], 8, 'Three lilies and three small roses. Classic, generous, fragrant.'),
    P('forever-remembered', 'Forever Remembered Bouquet', 10485, 11650, 1, 360, ['Corn poppy', '1 small rose', '1 dahlia', '2 forget-me-not stems', '3 bud stems'], ['roses', 'pastel'], ['getwell', 'gratitude'], ['#D9534F', '#EBCFCB', '#8EA7D8'], 10, 'Poppy red and forget-me-not blue, for the ones we keep close.'),
    P('blue-hour', 'Blue Hour Bouquet', 11340, 12600, 1, 360, ['1 blue double-layer sunflower', '1 gerbera', '1 small daisy', '1 bud stem', '2 forget-me-not stems'], ['sunflowers'], ['birthday', 'justbecause'], ['#7C9BD0', '#A9BDE6', '#F4EEE6'], 9, 'The minutes after sunset, in blue and cream.'),
    P('peony-grace', 'Peony Grace Bouquet', 11475, 12750, 3, 360, ['1 Thai rose', '3 peonies', '1 bud stem'], ['roses', 'pastel'], ['anniversary', 'love'], ['#F0B8C4', '#F7E3E1', '#E8A5B0'], 8, 'Three peonies, opened wide, held by a single Thai rose.'),
    P('mystic-bloom', 'Mystic Bloom Bouquet', 11610, 12900, 2, 360, ['1 gerbera', '3 open tulips', '4 lavender stems', '2 forget-me-not stems', '1 calla lily'], ['lilies', 'pastel'], ['birthday', 'gratitude'], ['#B9A7D6', '#F4C7D0', '#8EA7D8'], 11, 'Lavender, tulip and calla in a hush of violet.'),
    P('violet', 'Violet Bouquet', 12285, 13650, 1, 360, ['1 Thai rose', 'Lewisia', '1 small sunflower', '2 forget-me-not stems', 'Lavender'], ['roses', 'pastel'], ['justbecause', 'birthday'], ['#9E7BC4', '#C5A9DA', '#E8A5B0'], 10, 'Deep violets with one warm rose to settle the eye.'),
    P('velvet-sun', 'Velvet Sun Bouquet', 12555, 13950, 1, 360, ['1 red double-layer sunflower', '1 Chinese rose', '1 iris', '1 calla lily', '1 small daisy', '1 bud stem'], ['sunflowers', 'roses'], ['love', 'anniversary'], ['#B5303A', '#D9534F', '#F2C14E'], 9, 'A red sunflower at the centre: warm, velvety, unmistakable.'),
    P('tea-rose-daisy', 'Tea Rose Daisy Bouquet', 12825, 14250, 1, 360, ['1 African daisy', '2 open tulips', '2 calla lilies', 'Dill flower', '3 forget-me-not stems'], ['pastel', 'lilies'], ['getwell', 'gratitude'], ['#F4D9C6', '#F2C14E', '#FFFDF9'], 10, 'Tea-rose tones with calla and dill: airy, a little wild.'),
    P('garden-symphony', 'Garden Symphony Bouquet', 12960, 14400, 1, 550, ['2 lilies', '3 small roses', '1 double-layer sunflower', '3 small daisies', '1 leaf stem'], ['lilies', 'sunflowers', 'roses'], ['birthday', 'anniversary'], ['#F2C14E', '#E8A5B0', '#FFFDF9'], 12, 'A full garden, played together.'),
    P('pink-fawn', 'Pink Fawn Bouquet', 13140, 14600, 1, 360, ['1 lily', '1 peony', '1 Valentine rose', '3 forget-me-not stems', '3 bud stems'], ['lilies', 'roses', 'pastel'], ['love', 'anniversary'], ['#F0B8C4', '#D99A8B', '#8EA7D8'], 10, 'Fawn and pink, with a Valentine rose at its heart.'),
    P('stargazer-sky', 'Stargazer Sky Bouquet', 13680, 15200, 1, 360, ['1 premium 12-petal Stargazer lily', '1 open tulip', '6 lavender stems', '2 forget-me-not stems'], ['lilies'], ['anniversary', 'love'], ['#D6527A', '#B9A7D6', '#8EA7D8'], 9, 'One Stargazer lily under a sky of lavender.'),
    P('rose-amour', 'Rose Amour Bouquet', 14130, 15700, 2, 360, ['2 Thai roses', '4 small roses', '3 forget-me-not stems'], ['roses'], ['love', 'anniversary'], ['#C9475E', '#E8A5B0', '#8EA7D8'], 10, 'Six roses, three sprigs of blue. Say it plainly.'),
    P('lilly-belle', 'Lilly Belle Bouquet', 17100, 19000, 1, 360, ['3 lilies', '1 gerbera', '2 open tulips', '3 small daisies', '2 lavender stems', '2 forget-me-not stems'], ['lilies'], ['anniversary', 'birthday'], ['#F7E3E1', '#E9A3B8', '#B9A7D6'], 13, 'A grand bouquet of lilies, built to be photographed and remembered.'),
    P('lily-orchid', 'Lily Orchid Bouquet', 17415, 19350, 1, 550, ['3 lilies', '3 orchid flowers', '3 open tulips', '3 small roses'], ['lilies', 'roses'], ['anniversary', 'love'], ['#F4C7D0', '#C5A9DA', '#FFFDF9'], 13, 'Lilies, orchids, tulips and roses: the full composition.'),
    P('the-love', 'The Love Bouquet', 17505, 19450, 2, 360, ['4 vine glass roses', '6 small roses', '1 pom-pom', '1 small leaf'], ['roses'], ['love', 'anniversary'], ['#B5303A', '#C9475E', '#E8A5B0'], 14, 'Ten roses. The one that needs no card, though we will add one.')
  ];
  var occasions = [
    { id: 'love', label: 'Love' }, { id: 'anniversary', label: 'Anniversary' },
    { id: 'birthday', label: 'Birthday' }, { id: 'gratitude', label: 'Thank you' },
    { id: 'getwell', label: 'Get well' }, { id: 'justbecause', label: 'Just because' }
  ];
  var cats = [
    { id: 'all', label: 'All' }, { id: 'roses', label: 'Roses' }, { id: 'lilies', label: 'Lilies' },
    { id: 'sunflowers', label: 'Sunflowers' }, { id: 'pastel', label: 'Pastel' }, { id: 'under10', label: 'Under Rs 10,000' }
  ];
  var cities = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Faisalabad', 'Multan', 'Another city'];
  return { products: products, occasions: occasions, cats: cats, cities: cities,
    brand: { name: 'URB', tagline: 'Flowers, composed.', instagram: 'https://www.instagram.com/shop.urb', tiktok: 'https://www.tiktok.com/@shop.urb', pluto: 'https://plutopakistan.com/stores/urb-394', facebook: 'https://www.facebook.com/share/15Buz3M4xc/' },
    promo: { code: 'WELCOME5', pct: 5 } };
})();
