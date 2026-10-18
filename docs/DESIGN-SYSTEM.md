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

- **Colour (measured from URB's logo and cover):** brand mauve `#AC6579` (logo), olive `#889440` (the "eloved" tag), cream `#F9EFDE` (cover paper, page background), script rose `#C44058` (cover lettering), burgundy `#89424B` (cover stars), gingham taupe `#D5CFCA` / `#B8A79D`. Derived: mauve-deep `#8A4A5C` for buttons and small text (white on it is above 4.5:1; the raw logo mauve is about 4:1, so it is used for large shapes and decoration), olive-deep `#5F6B26`, wine `#4A2530` for dark bands, ink `#36222A`.
- **Brand pieces reused from the cover:** gingham band (promo bar), grid paper (hero), brush-script accent word (one per page), hand-drawn star. The logo is the real artwork; a cream version is used on the wine footer.
- **Type:** Fredoka (headings, echoes the rounded logo), Nunito (text), Yellowtail (script accent). Scale ratio 1.25 on phones, 1.333 from 768. Body 16px / 1.6.
- **Space:** 4 · 8 · 16 · 24 · 32 · 48 · 64 · 96. Gutter 20 / 40 / 56. Section rhythm `clamp(64px, 12vw, 128px)`.
- **Shape:** radius 4 / 12 / 24 / pill. Image aspect 4:5 everywhere. Tap target 48px.
- **Geometry:** hero, product, cart, story and footer split on the **golden ratio (1.618 : 1)**; photos sit in a 4:5 frame throughout.
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
