# Momentum

Momentum helps students turn an assignment brief into steps and work through them one at a time. The student does the assignment in their own tools; Momentum only holds the plan and their progress. It is a course project for UX & Front-End Engineering.

Status: **not deployed yet.** Current milestone: **M2, core loop on sample data with browser persistence** (M1 merged) (see [docs/status.md](docs/status.md)).

## Requirements

- Node.js 20.9 or later (built and checked on Node 24)
- npm

No API key or `.env` file is needed. The app makes no network requests from app code; progress is saved in this browser's local storage (key `momentum:v1`).

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # Vitest
npm run lint
npm run build
```

The first visit starts a copy of the sample assignment ("Urban green spaces essay"). Brief entry and plan review come in M3. To start over, clear this site's local storage.

Routes: `/` home, `/step/n` working step, `/step/n/done` step complete, `/final` final check, `/review` review a completed assignment.

## Docs

- [docs/MOMENTUM_CONTEXT.md](docs/MOMENTUM_CONTEXT.md): project context and rationale
- [docs/product.md](docs/product.md): goal, MVP scope, order of authority
- [PRODUCT.md](PRODUCT.md): users, Operating Conditions, voice and design principles
- [DESIGN.md](DESIGN.md): tokens, components, layout and copy rules
- [docs/status.md](docs/status.md): milestones, what is built and what was checked
- [docs/decisions.md](docs/decisions.md): dated decisions
- [CLAUDE.md](CLAUDE.md): rules for AI coding sessions
