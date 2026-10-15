🌐 English | [Español](README.es.md) | [Português (Brasil)](README.pt_BR.md) | [한국어](README.ko.md)

# 🎮 Mona Mayhem

**VS Code & GitHub Copilot CLI Workshop** — Build a GitHub Contribution Battle Arena

A workshop template for building a retro arcade-themed website with Astro that compares GitHub contribution graphs of two users. This is the **starting point** — you'll build the app step by step using GitHub Copilot.

The app includes a two-player battle page backed by a server-side GitHub JSON proxy. It displays each player's daily contribution graph, total contributions, and date range.

![Mona Mayhem Screenshot](https://github.com/user-attachments/assets/5eca79e2-cb9f-4e93-aa0d-23666ebde3b7)
*What you'll build by the end of the workshop*

## 📚 Workshop

The workshop supports two tracks — follow the one that matches your preferred workflow:

- **VS Code track** — Chat, Plan Mode, Agent Mode, background agents, and editor-native review loops
- **CLI track** — `copilot`, `@file` context, `/plan`, autonomous edits, `/fleet`, `/delegate`, and `/review`

| Part | Title | Copilot Focus |
|------|-------|---------------|
| [00](workshop/00-overview.md) | Overview | Track selection and learning goals |
| [01](workshop/01-setup.md) | Setup & Context Engineering | Instructions, permissions, and environment setup |
| [02](workshop/02-plan-and-scaffold.md) | Plan & Scaffold | Planning the API and page architecture |
| [03](workshop/03-agent-mode.md) | Build the Game | Agentic implementation and iteration |
| [04](workshop/04-design-vibes.md) | Design-First Theming | Visual design planning and implementation |
| [05](workshop/05-polish.md) | Polish & Parallel Work | Parallelism, reviews, and quality passes |
| [06](workshop/06-bonus.md) | Bonus & Extensions | Open-ended feature ideas and extra Copilot experiments |

## 🚀 Quick Start

1. **Create your own repo first** by either:
   - clicking **Use this template** to create a new repo, or
   - forking this repository.
2. Choose your workshop path:
   - **VS Code:** clone your repo and open it in VS Code.
   - **GitHub Copilot CLI:** clone your repo locally, install `copilot`, and work from your terminal.
3. Follow the [workshop guide](workshop/00-overview.md)

## Prerequisites

### Shared

- GitHub Copilot (Pro, Business, or Enterprise)
- Git
- Node.js

### VS Code track

- VS Code v1.107+
- GitHub Copilot extension signed in

### CLI track

- GitHub Copilot CLI (`copilot`)
- Node.js 22+ if you plan to install the CLI via `npm install -g @github/copilot`
- Or Homebrew / WinGet if you prefer a native package manager install

## Technology Stack

- **Framework**: [Astro](https://astro.build/) v6
- **Runtime**: Node.js with [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/) adapter
- **Font**: Press Start 2P (retro gaming font)
- **API**: GitHub's contribution graph API

## Run and test the app

```bash
npm install
npm run dev
npm test
npm test -- src/lib/server/contributions.test.ts -t "cache"
npm run build
npm run preview
```

Open `http://localhost:4321`, enter two GitHub usernames, and click Battle or press Enter in either input. Both users are fetched in parallel. Each result shows the username, total contributions, date range, and a GitHub-colored daily grid, with a VS badge between the players. Hover a square to see its date and count. Tab enters each graph once; use up/down for days, left/right for weeks, and Home/End for the first/last day. The selected day's date and count appear below the graph. Wide graphs scroll within their result cards. Results stack at 1024px and below; inputs stack below 640px.

The form trims surrounding whitespace and displays linked inline errors for each missing/invalid username, focusing the first invalid field. Invalid fields and request failures use neon error styling; correcting a field clears its validation feedback. Keyboard focus remains visible on controls and graph cells. While loading, duplicate submissions are blocked. Errors are shown per player so one failed lookup does not hide the other player's result; correct the input or retry after the request finishes.

The arcade theme uses a dark CRT scanline background, green/purple neon accents, and Google Fonts' Press Start 2P with a monospace fallback. The title, VS badge, result cards, input entrance, and loading text have CSS effects; contribution squares glow on hover without changing their GitHub colors. System reduced-motion preferences disable the animations.

### Contribution API

```bash
curl http://localhost:4321/api/contributions/octocat
curl -i http://localhost:4321/api/contributions/bad--name
```

`GET /api/contributions/:username` fetches `https://github.com/{username}.contribs` on the server. The battle page calls this same-origin route, avoiding cross-origin browser requests to GitHub. You can also use curl to try it directly. No GitHub token is required. Successful responses preserve GitHub's JSON structure.

Names are case-insensitive, at most 39 characters, and allow letters, numbers, and single hyphens between alphanumeric segments. The API rejects malformed names.

Errors use `{ "error": { "code": "...", "message": "..." } }`:

| HTTP status | Error code | Meaning |
|---|---|---|
| 400 | `INVALID_USERNAME` | Invalid username |
| 404 | `USER_NOT_FOUND` | GitHub returned 404 |
| 429 | `UPSTREAM_RATE_LIMITED` | GitHub returned 429; valid `Retry-After` is forwarded |
| 503 | `UPSTREAM_FORBIDDEN` | GitHub refused the request with 403 |
| 502 | `UPSTREAM_ERROR` | Unexpected GitHub status, including redirects |
| 502 | `INVALID_UPSTREAM_RESPONSE` | Non-JSON content type or malformed JSON |
| 502 | `UPSTREAM_UNAVAILABLE` | Network or response-body read failure |
| 504 | `UPSTREAM_TIMEOUT` | GitHub request, including body reading, exceeded 10 seconds |
| 500 | `INTERNAL_ERROR` | Unexpected internal failure |

Successful JSON is cached in server memory for five minutes after it is read and validated, with at most 500 usernames. Keys are lowercase; concurrent requests for the same username share one upstream request. Expired entries are removed and the oldest inserted entries are evicted at capacity. Errors are not cached, and expired data is never returned as a fallback. All API responses use `Cache-Control: no-store`; caching is server-side only. Each Node process has its own cache, which resets on restart.

Vitest tests mock GitHub and cover the proxy response contract, upstream errors, timeouts, TTL boundaries, cache capacity, concurrent request sharing, client response validation, and UTC graph dates. Run just the client data tests with `npm test -- src/lib/contributions.test.ts`.

## Deployment Notes

### Current GitHub Pages setup

The workflow in `.github/workflows/deploy.yml` currently deploys static workshop/docs content from `docs/` and `workshop/` to GitHub Pages. It does not build or deploy the Astro app from `src/`.

### If you want to deploy the Astro app to GitHub Pages

GitHub Pages is static hosting, so the Astro app should use static output.

1. Change `output` in `astro.config.mjs` from `server` to `static`.
2. Remove the Node adapter (`@astrojs/node`) from `astro.config.mjs` and `package.json`.
3. Update the GitHub Actions workflow to run `npm ci` and `npm run build`, then upload `dist/` as the Pages artifact.
4. If deploying to a project page (`https://<user>.github.io/<repo>/`), set `site` and `base` in `astro.config.mjs`.

If you plan to keep API routes running in production, use a server platform instead of GitHub Pages (for example, Vercel, Netlify, or a Node host).

## License

MIT
