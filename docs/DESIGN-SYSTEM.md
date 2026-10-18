# URB design system

Source of truth: `css/tokens.css` (mirror for design tools: `css/tokens.json`). Nothing else holds a colour, size or duration literal.

## Direction: a doodle journal, one continuous page

Taken from URB's own Instagram posts, which are photos annotated by hand: handwritten notes, curled arrows, circled labels, sparkles, hearts, stars and rays.

- **One page, no sections.** A single fixed gradient (cream to blush to soft peach) with four blurred colour orbs drifting slowly behind everything (transform only, paused under reduced motion). Sections are only spacing: no background bands, borders or cards. Even the footer is on the same page.
- **Products are not in boxes.** Bouquets, stems, plushies, wear and keyrings are background-removed cut-outs that sit straight on the page with a soft shadow. Two photos that do not cut cleanly (the lily bouquet, and a few scene photos) are feathered into the page with a radial mask instead of cropped into a rectangle.
- **Bold type, merged with the product.** The hero headline is up to 10.5rem; the cut-out poppy overlaps the end of the words, with handwritten callouts taken from URB's real post text ("4 big petals", "handmade, washable", "11 inch long stem").
- **Doodles are drawn, not decorated.** `js/doodles.js` holds 20 hand-drawn SVG shapes (arrows, loops, sparkles, hearts, rays, scribble underlines, yarn, clock, hook, daisy). Markup uses `<i data-doodle="arrow-curl" class="d-m doodle--ink">`; the script swaps in the SVG. Each path draws itself on when it scrolls into view and is fully drawn under reduced motion.
- **Real numbers from the posts** drive the content: making times (35 min keyring, 2.5 hrs poppy, 3 hrs iris, 12 hrs top), 4-ply acrylic, 11 inch stems, washable.
- **Product page** notes the first three stems of a bouquet around its cut-out, like the posts do.

## Tokens

- **Colour (measured from the logo, cover and posts):** mauve `#AC6579`, deep mauve `#8A4A5C` for buttons, script rose `#C44058`, burgundy `#89424B`, olive `#889440` / `#5F6B26`, parcel-box berry `#5C1331`, cream `#F9EFDE`, ink `#36222A`; background stops `#FCF3E6` / `#F8E4DF` / `#F6DADD` with orbs in mauve, peach, sage and sky.
- **Type:** Fredoka (bold display, echoes the rounded logo), Caveat (handwritten notes, echoes the posts), Yellowtail (script accent word, echoes the cover), Nunito (text). `--fs-mega` clamp(3.4rem to 10.5rem).
- **Space:** 4 · 8 · 16 · 24 · 32 · 48 · 64 · 96, gutters 20 / 40 / 56, golden-ratio splits (1.618 : 1) from 1024.
- **Motion:** ROYA curves, ZU duration ladder, plus `--dur-drift` 28s for the gradient and `--dur-draw` 1100ms for doodles. Reveal = 24px rise and fade; cut-outs lift and tilt on hover; reduced motion removes the movement and keeps everything visible.

## Asset pipeline

Cut-outs were made with a segmentation model (rembg, isnet-general-use), then cleaned: low-alpha ghosts removed, only the main object kept, edges feathered. The corn poppy also uses a colour mask to drop the chalk doodles baked into the original post. Source photos are URB's own (Pluto listing and Instagram) and are used for this demo; replace with originals when available. Faces are cropped out of the garment shots. The crochet blanket post is labelled "AI content" on Instagram and was left out.

## Laws applied

- **Fitts:** 48px targets, primary action full width on phones, sticky "Add to bag" bar on product pages, bag/search in thumb reach of the header.
- **Hick:** six filters, three sort options, three payment methods, two time slots.
- **Jakob:** header with menu/search/saved/bag, standard product page, summary beside checkout.
- **Miller/Chunking:** checkout in three cards (Who and where, When, Payment).
- **Proximity & similarity:** one card pattern, one button family, one form-field pattern.
- **Aesthetic-usability / Von Restorff:** one filled ink button per view; rose is reserved for sale and saved states.
- **Doherty:** every action responds in <240ms (toast, count badge, sheet).
- **Postel / error prevention:** inline errors beside the field, focus moves to the first error, phone accepts spaces and +92.

## Workflows (all verified in a browser by `scripts/verify.mjs`)

Browse, filter, search, save, product, delivery date and card, add to bag, bag sheet and page, quantity, promo (`WELCOME5`), guest checkout with validation, placement, confirmation, tracking, contact and custom-bouquet forms, newsletter, 404 and unknown-product states. Nothing is a dead end: every empty or error state has a next step. There is no backend: state lives in `localStorage` and every total is computed in the browser, which is correct only for a demo.

## Motion (maximum, and switchable off)

All in `css/motion.css` and `js/motion.js`, only transform, opacity, clip-path and stroke-dashoffset. Under `prefers-reduced-motion` none of it runs: the page is fully drawn, visible and still (the test suite runs both ways).

- **Doodles live:** a line-boil filter (three displacement maps swapped in steps) makes every stroke shimmer like ink; arrows nudge, sparkles twinkle, stars and daisies spin, hearts beat, clocks tick, hooks and sprigs sway, rays and underlines redraw themselves on a loop.
- **Text lives:** headlines split into letters that spring up with a blur-in then wave forever; letters jump on hover; script words wipe in and sway; handwritten notes type themselves out; numbers count up.
- **Scroll-driven, no JavaScript:** a progress bar, cut-outs that drift at different speeds, giant words and index images that slide in from the side, step numbers that spin in, the story's yarn line that draws as you scroll, the hero flower that tumbles away.
- **Ambient:** gradient orbs drifting, hearts and sparkles rising behind the whole page, two ribbons of words running across the home page, every cut-out floating or rocking out of step with its neighbour.
- **Pointer:** a five-sparkle cursor trail and hero parallax (values travel through one constructable stylesheet rule, never inline styles); a burst of hearts when something goes in the bag; buttons shine, stitch and squash; the header slips away when scrolling down.
- **First visit:** a short logo intro, once per session, skippable with a click.
