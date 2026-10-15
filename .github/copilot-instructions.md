# Copilot Instructions

## Project overview

Mona Mayhem is a workshop template: an Astro (v6, SSR) app that compares two GitHub users' contribution graphs in a retro-arcade UI. The app is intentionally a **starting point** — `src/pages/index.astro` is a stub and `src/pages/api/contributions/[username].ts` returns `501 Not implemented` (TODO: fetch `https://github.com/{username}.contribs`). The workshop in `workshop/` walks learners through building it with Copilot.

## Commands

```bash
npm install
npm run dev       # astro dev
npm run build     # astro build
npm run preview   # astro preview
```

There is no test or lint setup.

## Architecture

- **App** (`src/`, `astro.config.mjs`): `output: 'server'` with `@astrojs/node` in `standalone` mode. API routes must set `export const prerender = false`.
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
