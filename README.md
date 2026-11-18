# Momentum

Momentum helps students turn an assignment brief into steps and work through them one at a time. The student does the assignment in their own tools; Momentum only holds the plan and their progress. It is a course project for UX & Front-End Engineering.

Status: **preview deployed** for M3: https://momentum-oyry8u9z1-aidan-o-driscoll.vercel.app (branch `feat/m3-plan-entry-and-review`; steps in [docs/deploy.md](docs/deploy.md)). No production deploy yet. Current milestone: **M3, brief entry and plan review** (M1 and M2 merged) (see [docs/status.md](docs/status.md)).

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

The first visit shows brief entry. Until M4 adds real plan generation, only the sample brief ("Use a sample brief", "Urban green spaces essay") can be turned into a plan; other text shows a notice. To start over, clear this site's local storage.

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
