# URB

Design demo for **URB (@shop.urb)**, a Pakistani hand-tied bouquet brand. Handmade crochet flower bouquets. Static HTML, CSS and JavaScript: no build, no backend.

```bash
npx http-server -p 4173 .            # then open http://127.0.0.1:4173
node scripts/verify.mjs              # links, flows, overflow at 7 widths (needs Playwright)
```

- Research and gaps: [docs/RESEARCH.md](docs/RESEARCH.md)
- Tokens, laws, workflows: [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)
- Tokens: `css/tokens.css`. Products and collections: `js/data.js`. Doodles: `js/doodles.js`.

Logo, cover and product photos come from URB's Pluto store listing (demo use). Replace with originals when supplied.

## Deploy on Cloudflare

Static assets on Cloudflare Workers (same setup as the other sites in this account): `wrangler.jsonc` serves the repo root, `.assetsignore` keeps docs, scripts and git files out, `_headers` sets caching and security headers.

```bash
npx wrangler login      # once
npm run deploy          # npx wrangler deploy  ->  https://urb.<your-subdomain>.workers.dev
```

Or connect the GitHub repo in Cloudflare (Workers & Pages, Create, Import a repository) with build command empty and deploy command `npx wrangler deploy`. For CI, set `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit) and `CLOUDFLARE_ACCOUNT_ID`.

## Admin panel (`/admin/`)
Built on the shared library (daisyUI 5 + Tailwind v4, no framework). Double sidebar (rail + section panel), horizontal view tabs, breadcrumbs, global search, dark mode, BOM (materials, recipes, make list). Demo logins in `admin/brand.js`; data lives in the browser (localStorage) and is shared with the storefront. BOM seed costs are estimates.
`npm run admin:sync` copies the library in; `npm run admin:css` rebuilds `admin/admin.css`.
