# Momentum

Momentum helps students turn an assignment brief into steps and work through them one at a time. The student does the assignment in their own tools; Momentum only holds the plan and their progress. It is a course project for UX & Front-End Engineering.

Production: https://momentum-five-xi.vercel.app (serves `main`). Current milestone: **M4, real plan generation** on branch `feat/m4-ai-generation` (M1–M3 merged). See [docs/status.md](docs/status.md).

## Requirements

- Node.js 20.9 or later (built and checked on Node 24)
- npm

Plan building needs an OpenAI API key on the server: put `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in `.env.local`, which git ignores. Steps, including the Vercel settings and the budget limit: [docs/deploy.md](docs/deploy.md). Without a key everything else works, and building a plan shows Error 03.

The one network request the app makes is `POST /api/plan`, which sends the pasted brief to OpenAI through the server. Progress is saved only in this browser's local storage (key `momentum:v1`).

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # Vitest
npm run lint
npm run build
npm run check:bundle   # after a build: fails if the key or api.openai.com reached browser files
```

The first visit shows brief entry. "Use a sample brief" fills in the sample brief ("Urban green spaces essay"); Break it down then sends it to the model like any other brief. To start over, clear this site's local storage.

In development only, `/?simulate=unreadable`, `failed` or `slow` replaces the plan source, to see the error and building screens. A production build ignores it.

Routes: `/` brief entry or home, `/plan` plan review, `/step/n` working step, `/step/n/done` step complete, `/final` final check, `/review` review a completed assignment.

## Docs

- [docs/MOMENTUM_CONTEXT.md](docs/MOMENTUM_CONTEXT.md): project context and rationale
- [docs/product.md](docs/product.md): goal, MVP scope, order of authority
- [PRODUCT.md](PRODUCT.md): users, Operating Conditions, voice and design principles
- [DESIGN.md](DESIGN.md): tokens, components, layout and copy rules
- [FEATURES.md](FEATURES.md): feature inventory with build status
- [docs/status.md](docs/status.md): milestones, what is built and what was checked
- [docs/decisions.md](docs/decisions.md): dated decisions
- [CLAUDE.md](CLAUDE.md): rules for AI coding sessions
