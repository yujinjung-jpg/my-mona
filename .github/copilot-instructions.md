# Copilot Instructions

## Project overview

Mona Mayhem is an Astro (v6, SSR) workshop app for a two-player GitHub contribution battle. The main page fetches both users in parallel and renders daily graphs, totals, and date ranges with independent player errors. The workshop in `workshop/` describes building and extending the app with Copilot.

## Commands

```bash
npm install
npm run dev       # astro dev
npm run build     # astro build
npm run preview   # astro preview
npm test          # Vitest, all tests
npm test -- src/lib/server/contributions.test.ts -t "cache" # one file / matching tests
```

Tests live under `src/lib/` as `*.test.ts` and mock fetch rather than depending on GitHub availability. Keep route tests out of `src/pages/`, where Astro treats TypeScript files as endpoints. There is no lint script. `astro build` builds the app but is not a full TypeScript type check.

## Architecture

- **App** (`src/`, `astro.config.mjs`): `output: 'server'` with `@astrojs/node` in `standalone` mode. API routes must set `export const prerender = false`.
- **Contribution lookup**: `src/pages/index.astro` submits both usernames to the same-origin `/api/contributions/:username` route in parallel using `Promise.allSettled`, so a failed player does not hide a successful one. `src/lib/contributions.ts` defines the client TypeScript interfaces, validates v2 responses, and derives daily dates from each week's Sunday `first_day` plus `weekday` in UTC. Grids use level 0–4 GitHub colors; DOM text is inserted via `textContent`. `src/lib/server/contributions.ts` owns GitHub fetches, username validation, the 10-second timeout, and process-local caching. Keep the server module out of client scripts. The route maps service errors to HTTP responses; successful GitHub JSON is not reshaped.
- **Cache/error contract**: lowercase username keys, five-minute TTL from successful response completion, maximum 500 entries with oldest-insertion eviction, and per-username in-flight request sharing. Cache successes only; do not return stale data after failure. API errors are `{ error: { code, message } }`; all responses use `Cache-Control: no-store` so downstream caches do not extend the server TTL.
- **Workshop content**: English sources are `README.md` and `workshop/*.md`. The static site published to GitHub Pages comes from `docs/` (`index.html`, `step.html`, CSS/JS), which is separate from the Astro app.
- **Localizations** (locales `es`, `pt_BR`, `ko`) are generated outputs, not hand-edited sources:
  - `README.md` → `README.<locale>.md`
  - `workshop/*.md` → `workshop/<locale>/*.md`
  - `docs/index.html`, `docs/step.html` → `docs/<locale>/<same name>`
  - Per-locale source baselines live in `localizations/<locale>/.localization-state.json`.
  - Translation rules per locale are in `.github/skills/localizations/rules/*.md`; the skill is described in `.github/skills/localizations/SKILL.md`.
- **Workflows**:
  - `localization-sync.yml` runs on pushes to `main` that touch English sources (`README.md`, `workshop/**/*.md`, `docs/index.html`, `docs/step.html`) and regenerates translations using `scripts/localization_sync.py`. The source-path logic is duplicated in the workflow and the script — keep them in sync if you change it.
  - `deploy.yml` publishes `docs/` plus `workshop/pt_BR` and `workshop/es` to GitHub Pages (no build step; `ko` is not copied).

## Conventions

- Edit only the English sources; never edit files under `workshop/<locale>/`, `docs/<locale>/`, `README.<locale>.md`, or `localizations/` by hand unless explicitly asked to fix a translation.
- Locale directory names are `es`, `pt_BR`, `ko` for content, while rule files use lowercase hyphenated names (`es-es`, `pt-br`, `ko-kr`).

## Arcade design

- Keep new UI aligned with the dark neon theme: background `#0a0a1a`, green `#5fed83`, purple `#8a2be2`, and the CSS theme variables in `index.astro`. Use bright neutral text for readability and preserve the separate GitHub contribution-level palette.
- The page loads Press Start 2P from Google Fonts with `display=swap` and a monospace fallback. Retain usable mobile wrapping and card-local graph scrolling with either font.
- Effects use CSS keyframes and non-interactive pseudo-elements, not JavaScript animation timers. Respect `prefers-reduced-motion` for repeated and entrance animations.
- Dynamic graph and loading classes need Astro `:global()` selectors. Clear each player's `.is-loading` when its request settles and the shared status class when both finish; do not animate completed results as loading.
- Results stack at widths ≤1024px; inputs stack below 640px. Graph cells use roving tabindex: one Tab stop per graph, arrows for day/week navigation, Home/End for endpoints, with visible date/count feedback.
- Graph ARIA rows correspond to weekdays and columns to weeks, matching visual layout and arrow-key axes. Preserve row/column indices for partial weeks. Keep VS text on its fixed dark inset so the animated border cannot reduce contrast.
- Input validation uses linked inline messages and `aria-invalid`, focuses the first invalid field, and quietly clears feedback on correction. Preserve neon error styling and keyboard `:focus-visible` indicators.
