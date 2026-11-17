# Momentum

Momentum helps students turn an assignment brief into steps and work through them one at a time. The student does the assignment in their own tools; Momentum only holds the plan and their progress. It is a course project for UX & Front-End Engineering.

Status: **not deployed yet.** Current milestone: **M1, foundation and working-step screen** (see [docs/status.md](docs/status.md)).

## Requirements

- Node.js 20.9 or later (built and checked on Node 24)
- npm

No API key or `.env` file is needed. M1 makes no network requests from app code.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000 (opens /step/3)
npm test         # Vitest
npm run lint
npm run build
```

M1 preview routes: `/step/1` to `/step/6` show each step of the sample assignment. Which steps count as done comes from the number in the URL; nothing is saved.

## Docs

- [docs/MOMENTUM_CONTEXT.md](docs/MOMENTUM_CONTEXT.md): project context and rationale
- [docs/product.md](docs/product.md): goal, MVP scope, order of authority
- [docs/design-rules.md](docs/design-rules.md): tokens, components, layout and copy rules
- [docs/status.md](docs/status.md): milestones, what is built and what was checked
- [docs/decisions.md](docs/decisions.md): dated decisions
- [CLAUDE.md](CLAUDE.md): rules for AI coding sessions
