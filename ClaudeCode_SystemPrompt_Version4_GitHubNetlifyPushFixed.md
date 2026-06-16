# CLAUDE.md — Frontend Website Rules

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

## Redesign Mode
When user says "redesign" or "start design over":
- **Keep:** HTML structure, JavaScript logic, all text/copy content.
- **Replace entirely:** colors, fonts, spacing, animations, shadows, decorative elements.
- Ask user for new direction before starting if none given.

## Local Server
- Always serve on localhost — never screenshot `file:///`.
- `node serve.mjs` → `http://localhost:3000`. Run in background. Don't start a second instance.
- Puppeteer: `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/` · Chrome cache: `C:/Users/nateh/.cache/puppeteer/`

## Screenshot Workflow
- `node screenshot.mjs http://localhost:3000` (optional label: append label arg → `screenshot-N-label.png`)
- After shooting: read PNG with Read tool, analyze visually.
- Do **minimum 2 comparison rounds**. Be specific: "heading is 32px, reference shows ~24px".
- Check: spacing, font size/weight/line-height, exact hex colors, alignment, border-radius, shadows, image sizing.
- Stop only when no visible differences remain, or user says so.

## GitHub — PUSH ONLY WHEN TOLD
- **Never** run `git push`, `git commit`, or any GitHub/deployment command unless the user explicitly says **"push to github"**.
- All edits stay local until that command is given. No exceptions.
- When "push to github" is said: stage all changes, write a clear commit message summarising what changed, then push.

## Deployment (Netlify)
- Every project must have a `netlify.toml` file in the project root so build settings travel with the code. Never rely on the Netlify dashboard being configured correctly.
- Before the first push of a project, check that `netlify.toml` exists. If it does not, create it.
- Choose the contents based on the project type:
  - **Static single-file site** (plain `index.html`, no build step — the default for new projects in this file):
    ```toml
    [build]
      publish = "."
    ```
  - **Build-based project** (a `package.json` exists with a `build` script — e.g. Vite, React, imported Bolt projects):
    ```toml
    [build]
      command = "npm run build"
      publish = "dist"
    ```
- To decide: if a `package.json` with a `"build"` script is present, use the build-based version; otherwise use the static version.
- If the project root has a leftover nested duplicate folder (e.g. `project/project/`) from a previous import, flag it to the user and offer to clean it up — but never delete files without confirmation.

## Output Defaults
- Single `index.html`, all styles inline, unless told otherwise.
- Tailwind via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`

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
