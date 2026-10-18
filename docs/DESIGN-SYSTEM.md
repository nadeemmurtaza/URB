# URB design system

Source of truth: `css/tokens.css` (mirror for tools: `css/tokens.json`). Nothing else holds a colour, size or duration literal.

## What was taken from the four repos

| Repo | Taken |
| --- | --- |
| **ROYA** | Roles-not-colours token model; warm paper/ink pairing; `settle` ease `(0.16,1,0.3,1)`, `panel`, `exit`; seven test widths 280/380/640/768/1024/1280/1536; reduced motion keeps information; rule that CSS lives in stylesheets only (no `style` attribute anywhere); prices as Latin digits in `<bdi dir="ltr">`; 4/8 spacing scale capped at 64; lift 4px, press 0.98, arrive 0.97. |
| **ZUwithCamera** | Duration ladder (micro 120 · ui 240 · content 560 · cine 900), `[hidden]` guard, no tap flash, 44px+ targets, `touch-action: manipulation`, focus ring discipline. |
| **MILES** | One-file colour discipline, view-transition page cross-fade, animate only transform and opacity, pause what is off screen. |
| **yaseenecom** | One-ink logo rule, clear space, minimum size, "never re-colour the mark" discipline. |

## Tokens

- **Colour:** paper `#F7F2EB`, paper-sunk `#EFE7DC`, card `#FFFDF9`, ink `#1E2420`, ink-2 `#4A524B`, ink-3 `#5F665F` (all body text >= 4.5:1 on paper), rose `#B8626E`, rose-deep `#8F3F4B` (small text and sale tags), blush `#EBCFCB`, sage `#7F9482`, forget-me-not `#8EA7D8`, forest `#1F2B25`. The palette is derived from the flowers URB sells (peony pink, forget-me-not blue, leaf green) and is a proposal until the real logo arrives.
- **Type:** Cormorant Garamond (display), Manrope (text). Scale ratio 1.25 on phones, 1.333 from 768, fluid via `clamp()`. Body 16px / 1.6.
- **Space:** 4 · 8 · 16 · 24 · 32 · 48 · 64 · 96. Gutter 20 / 40 / 56. Section rhythm `clamp(64px, 12vw, 128px)`.
- **Shape:** radius 4 / 12 / 24 / pill. Image aspect 4:5 everywhere. Tap target 48px.
- **Geometry:** hero, product, cart, story and footer split on the **golden ratio (1.618 : 1)**; bouquet art places blooms on a **golden-angle (137.5°) spiral**.
- **Motion:** reveal = 24px rise + fade over 560ms `settle`, staggered 80ms for the first four children only; hover lift/zoom 560ms; press scale 0.98; sheets rise/slide 560ms. Under `prefers-reduced-motion` all durations and distances become 0 and content is simply visible.

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
