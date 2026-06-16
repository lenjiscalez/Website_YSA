# CLAUDE.md — Frontend Website Rules (v5 · Performance + GEO + Accessibility fused)

> Build philosophy: every site ships **fast, findable, citable by AI engines, and legally
> accessible — from the first commit**. SEO/GEO/a11y are not a later pass. They are baked into
> the very first `index.html`. The rules below are enforced *before* deployment, not bolted on after.

---

## Session Start
1. Invoke the `frontend-design` skill before any frontend code.
2. Check `brand_assets/` for logos, colors, style guides — use them; no placeholders where real assets exist.
3. If `serve.mjs` or `screenshot.mjs` are missing from the project root, generate them before proceeding.

## New Project Setup
1. Create project folder and `cd` into it.
2. Generate `serve.mjs` (Node HTTP server, port 3000, serves project root).
3. Generate `screenshot.mjs` (Puppeteer, saves to `./temporary screenshots/screenshot-N.png`, auto-incremented).
4. Create `brand_assets/` folder.
5. Create `index.html` — single file, Tailwind CDN, mobile-first.
6. Create `netlify.toml` in the project root (see **Deployment (Netlify)** below).
7. Create `robots.txt` and `sitemap.xml` in the project root (see **Phase 2 — Findability** below).
8. Add the **Baseline `<head>` block** (see Phase 2) to `index.html` immediately — never leave a page with an empty/default head.

## Redesign Mode
When user says "redesign" or "start design over":
- **Keep:** HTML structure, JavaScript logic, all text/copy content, **all SEO/schema/meta and a11y attributes**.
- **Replace entirely:** colors, fonts, spacing, animations, shadows, decorative elements.
- Ask user for new direction before starting if none given.
- A redesign must never *lower* the Performance / Findability / Accessibility scores it started with.

## Local Server
- Always serve on localhost — never screenshot `file:///`.
- `node serve.mjs` → `http://localhost:3000`. Run in background. Don't start a second instance.
- Puppeteer: `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/` · Chrome cache: `C:/Users/nateh/.cache/puppeteer/`

## Screenshot Workflow
- `node screenshot.mjs http://localhost:3000` (optional label: append label arg → `screenshot-N-label.png`)
- After shooting: read PNG with Read tool, analyze visually.
- Do **minimum 2 comparison rounds**. Be specific: "heading is 32px, reference shows ~24px".
- Check: spacing, font size/weight/line-height, exact hex colors, alignment, border-radius, shadows, image sizing.
- **Also visually verify CLS risk:** does anything jump after load? Is space reserved for images, fonts, banners?
- Stop only when no visible differences remain, or user says so.

---

# Phase 1 — Performance Budget (Core Web Vitals)

A slow or visually unstable page gets deprioritized by Google and skipped by AI crawlers, and users bounce.
**Every page must be built to pass all three Core Web Vitals on mobile.** Treat these as hard budgets, not goals.

| Metric | What it is | Budget | Enforced by |
|--------|-----------|--------|-------------|
| **LCP** | Time for main hero element to render | ≤ 2.5 s | Preload hero, `fetchpriority="high"`, modern image formats |
| **INP** | UI responsiveness after a click/tap | ≤ 200 ms | Defer/break up heavy JS; no blocking work on main thread |
| **CLS** | Visual stability (does stuff jump?) | ≤ 0.1 | Explicit `width`/`height` on all media; reserve space for dynamic content |

### Performance Hard Rules (apply to every page)
- **Hero image:** preload it and set `fetchpriority="high"`. Serve AVIF/WebP with a fallback. This is the LCP element — protect it.
  ```html
  <link rel="preload" as="image" href="hero.avif" fetchpriority="high">
  ```
- **Every `<img>` and embedded media** gets explicit `width` + `height` (or aspect-ratio) so the layout never shifts. No exceptions.
- **Lazy-load below-the-fold images** (`loading="lazy"`) — but **never** lazy-load the LCP/hero image.
- **Defer non-critical JS:** tracking, chat widgets, cookie scripts, analytics → `defer` or load after interaction / on idle. They must not block first render or the main thread.
- **Reserve space** for anything injected late (cookie banner, sticky bar, ads, embeds) so it doesn't cause CLS.
- **Fonts:** use `font-display: swap`, preload the primary font file, and define fallback metrics to avoid layout shift on font load.
- **No render-blocking work** above the fold beyond critical CSS.

### Tailwind CDN tradeoff — be honest about it
- The CDN (`cdn.tailwindcss.com`) is great for *fast iteration*, but it ships a JIT compiler + unpurged CSS at runtime, which costs LCP/INP on real client sites.
- **Default (prototype / personal / quick site):** keep the CDN as specified in Output Defaults.
- **When the user wants a production client site, or asks to "max out Lighthouse / Core Web Vitals":** switch to a compiled, purged Tailwind build (local build step) so only used classes ship. Flag this to the user before switching, since it changes the build setup.

### The "Instant Load" Edge — Speculation Rules API
- Add a Speculation Rules JSON script so the browser pre-renders likely-next internal pages on hover/intent → near 0 ms transitions.
  ```html
  <script type="speculationrules">
  { "prerender": [{ "where": { "href_matches": "/*" }, "eagerness": "moderate" }] }
  </script>
  ```
- Scope it to internal links only. Use `moderate`/`conservative` eagerness (not `eager`) to avoid wasting bandwidth. Respect that not every page should be prerendered (skip logout, cart-mutating, or auth links).

---

# Phase 2 — Findability (GEO + SEO baseline)

Goal: be the page that AI engines (Google AI Overviews, Perplexity, ChatGPT) and classic crawlers can
trust, extract, and **cite**. Most AI citations come from pages already ranking in the top organic spots,
so classic SEO and GEO are the same job — do both, every page.

### Baseline `<head>` block — required on every page
Every page ships with, at minimum:
- One unique `<title>` (≤ ~60 chars) and unique `<meta name="description">` (≤ ~155 chars).
- `<link rel="canonical">` with the absolute URL.
- `<meta name="robots" content="index,follow">` (or correct directive).
- Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) + Twitter card tags.
- `<html lang="…">` set correctly (e.g. `de` for German sites).
- Proper viewport meta.

### Semantic structure — required
- Exactly **one `<h1>`** per page; headings descend logically (`h1 → h2 → h3`), no skipping for styling.
- Real landmarks: `<header> <nav> <main> <article> <section> <aside> <footer>`. No `<div>` soup for primary structure.

### `robots.txt` + `sitemap.xml`
- `robots.txt` in root: allow crawling, point to the sitemap.
- `sitemap.xml` in root: list all indexable pages with `lastmod`. Keep it updated as pages are added.

### Schema markup (JSON-LD) — required, and **honest**
- Add JSON-LD `<script type="application/ld+json">` describing the real entity:
  - `Organization` **or** `LocalBusiness` (with real NAP: name, address, phone) on the site/home.
  - `WebSite` + `BreadcrumbList` for navigation context.
  - `FAQPage` on pages with a real Q&A section.
  - `ProfilePage` / `Person` for genuine author/expert/team pages.
  - `Article` / `BlogPosting` for editorial content, with a real author.
- **NEVER fabricate schema.** No invented `aggregateRating`, fake reviews, or `Review` markup for reviews that don't exist, and no schema describing content not actually on the page. Fake structured data is a Google guidelines violation and gets the site penalized. Only mark up what's truly there.

### "Atomic Answer" content pattern
- For key informational blocks, lead with an explicit question heading (e.g. `## What is X?` / `## Was kostet Y?`),
  then immediately give a precise, self-contained **40–60 word** answer before elaborating.
- This is the snippet AI engines lift. Make it accurate, standalone, and quotable. Put the substance first, fluff never.

---

# Phase 3 — Content Architecture (only when the project includes content/blog/pages)

> Skip this section for single-purpose landing pages. Apply it when building a multi-page site or content hub.

- **Hub-and-spoke:** pick 4–6 core pillars; each pillar page links down to specific deep-dive sub-pages, which link back up.
- **Internal links use descriptive anchor text** — `B2B SaaS conversion design`, never `click here` / `read more`.
- **E-E-A-T signals — real only:** author bios with genuine credentials, real case studies, real metrics, real screenshots.
- **NEVER invent** case studies, client names, statistics, testimonials, or author credentials. Fabricated trust signals are both a Google spam risk and a reputational/legal liability for the client. If real proof isn't available, leave a clearly-marked `<!-- TODO: real metric/quote from client -->` and tell the user.

---

# Phase 4 — Accessibility & Legal (WCAG 2.1 AA / BFSG)

Accessibility is a **baseline requirement, not a feature.** In Germany the **BFSG**
(Barrierefreiheitsstärkungsgesetz, in force since 28 June 2025 — the national implementation of the
EU European Accessibility Act / Directive 2019/882) makes WCAG-level accessibility legally required for
most commercial sites: e-commerce, online booking/appointments, and "Dienstleistungen im elektronischen
Geschäftsverkehr" — even a contact-for-a-quote flow can count. Non-compliance risks fines and Abmahnungen.
Build every commercial site to **WCAG 2.1 AA** by default.

### Accessibility Hard Rules
- **Semantic HTML first:** `<button>` for actions, `<a>` for navigation, real `<nav>`/`<main>`/`<header>`/`<footer>`.
  Add `aria-*` only to fill gaps real semantics can't cover — never as a substitute for the right element.
- **Keyboard:** every interactive element reachable and operable by keyboard; visible **`focus-visible`** state on all of them (already in Hard Rules — enforce it).
- **Contrast ≥ 4.5:1** for normal text against its background (≥ 3:1 for large text / UI components). Verify, don't eyeball.
- **All meaningful images get descriptive `alt`;** decorative images get `alt=""`.
- **Forms:** every input has an associated `<label>`; errors are announced, not color-only.
- **Text scales** to 200% and reflows without breaking containers or clipping content.
- **Cookie/consent banners** must not block layout rendering or cause CLS, and must be keyboard-accessible and dismissable.
- **Barrierefreiheitserklärung:** for German commercial sites, remind the user a published accessibility statement + a feedback/contact mechanism is part of BFSG compliance (and link it in the footer).
- **Note the BFSG exemption** when relevant: micro-enterprises (< 10 staff **and** ≤ €2M turnover) that offer *only services* may be exempt — but this rarely covers client e-commerce/booking sites. When in doubt, build accessible and tell the user to confirm legally.

---

## GitHub — PUSH ONLY WHEN TOLD
- **Never** run `git push`, `git commit`, or any GitHub/deployment command unless the user explicitly says **"push to github"**.
- All edits stay local until that command is given. No exceptions.
- When "push to github" is said: **first run the Definition of Done checklist below**, then stage all changes, write a clear commit message summarising what changed, then push.

## Definition of Done — gate before every first push
Before the first push of any project, verify (and tell the user the result of) each:
- [ ] **Performance:** hero preloaded + `fetchpriority`, all images have dimensions, heavy JS deferred, space reserved for late content.
- [ ] **Head:** unique title + description, canonical, robots, OG/Twitter, correct `lang`, viewport — present on every page.
- [ ] **Structure:** one `<h1>`, logical headings, semantic landmarks.
- [ ] **Crawl:** `robots.txt` + `sitemap.xml` exist and are correct.
- [ ] **Schema:** valid JSON-LD present, describing only real content (no fabricated ratings/reviews).
- [ ] **Accessibility:** keyboard + focus-visible everywhere, contrast ≥ 4.5:1, alt text, labeled forms, no CLS from banners.
- [ ] **Build config:** `netlify.toml` correct for project type.
- If any box can't be checked, fix it or explicitly flag the gap to the user before pushing.

## Deployment (Netlify)
- Every project must have a `netlify.toml` file in the project root so build settings travel with the code. Never rely on the Netlify dashboard being configured correctly.
- Before the first push of a project, check that `netlify.toml` exists. If it does not, create it.
- Choose the contents based on the project type:
  - **Static single-file site** (plain `index.html`, no build step — the default for new projects in this file):
    ```toml
    [build]
      publish = "."
    ```
  - **Build-based project** (a `package.json` exists with a `build` script — e.g. Vite, React, imported Bolt projects, or a compiled-Tailwind production build):
    ```toml
    [build]
      command = "npm run build"
      publish = "dist"
    ```
- To decide: if a `package.json` with a `"build"` script is present, use the build-based version; otherwise use the static version.
- If the project root has a leftover nested duplicate folder (e.g. `project/project/`) from a previous import, flag it to the user and offer to clean it up — but never delete files without confirmation.

## Output Defaults
- Single `index.html`, all styles inline, unless told otherwise.
- Tailwind via CDN: `<script src="https://cdn.tailwindcss.com"></script>` (see Phase 1 CDN tradeoff for when to switch to a build).
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT` — but real `brand_assets/` always win, and placeholders never ship to a `push to github`.

## Reference Images
- If provided: match exactly — layout, spacing, typography, color. No improvements, no additions.
- If none: design from scratch using the `frontend-design` skill guardrails.

## Hard Rules
- Never use `transition-all`
- Never use default Tailwind blue/indigo as primary
- Never use the same font for headings and body
- Never add sections or features not in the reference
- Never stop after one screenshot pass
- Use layered, color-tinted shadows — never flat `shadow-md`
- Animate only `transform` and `opacity`
- Every clickable element needs hover, focus-visible, and active states
- **Never fabricate schema, reviews, ratings, case studies, metrics, or testimonials**
- **Never lazy-load or de-prioritize the LCP/hero image**
- **Never ship a page with a default/empty `<head>`, missing alt text, or contrast below 4.5:1**
