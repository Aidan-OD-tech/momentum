# Momentum

Momentum helps students turn an assignment brief into steps and work through them one at a time. The student does the assignment in their own tools; Momentum only holds the plan and their progress. It is a course project for UX & Front-End Engineering.

Production: https://momentum-five-xi.vercel.app (serves `main`). M1–M7 are merged; **M7d** (polish and evidence for several assignments) is on `feat/m7d-polish-evidence`, and M8 (participant sessions, VoiceOver, the case study) is next. See [docs/status.md](docs/status.md).

**The list home (M7).** After the first plan, "/" is a list of every assignment kept in this browser, soonest deadline first. The first one is the "Up next" card, with its next step or the plan to review; the others are rows under "After that" and "No deadline", with finished ones in a collapsed group. Each shows an approximate time left: the estimates of the steps not done yet.

**Weekly upload (M7).** "Add assignments" opens `/new`, where a student can paste up to 8 briefs, each with its own optional deadline. Momentum builds one plan per brief, one request at a time, and saves each one as soon as it arrives; each lands on the list as "Ready to review". Briefs that weren't built stay as drafts and show on the list as "N briefs not built yet".

## Requirements

- Node.js 20.9 or later (built and checked on Node 24)
- npm

Plan building needs an OpenAI API key on the server: put `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in `.env.local`, which git ignores. Steps, including the Vercel settings and the budget limit: [docs/deploy.md](docs/deploy.md). Without a key everything else works, and building a plan shows Error 03.

The app makes two kinds of request. `POST /api/plan` sends the pasted brief to OpenAI through the server. `POST /api/event` sends one anonymous count when a plan's first step is started (a time band and a step count, no text; production builds only; see [docs/evidence/measurement.md](docs/evidence/measurement.md)). Progress is saved only in this browser's local storage (key `momentum:v1`).

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # Vitest
npm run lint
npm run build
npm run check:bundle   # after a build: fails if the key or api.openai.com reached browser files
```

The first visit shows brief entry. "Use a sample brief" appears only when `NEXT_PUBLIC_SHOW_SAMPLE_BRIEF=true` (for example in `.env.local`, or `NEXT_PUBLIC_SHOW_SAMPLE_BRIEF=true npm run dev`). It fills in the sample brief ("Urban green spaces essay"); Break it down then sends it to the model like any other brief. To start over, clear this site's local storage.

In development only, `/?simulate=unreadable`, `failed` or `slow` replaces the plan source, to see the error and building screens. A production build ignores it.

Routes: `/` brief entry on first run, otherwise the list of assignments; `/new` brief entry for more assignments and Building your plans; `/plan` plan review, `/step/n` working step, `/step/n/done` step complete, `/final` final check, `/review` review a completed assignment.

## Docs

- [docs/MOMENTUM_CONTEXT.md](docs/MOMENTUM_CONTEXT.md): project context and rationale
- [docs/product.md](docs/product.md): goal, MVP scope, order of authority
- [PRODUCT.md](PRODUCT.md): users, Operating Conditions, voice and design principles
- [DESIGN.md](DESIGN.md): tokens, components, layout and copy rules
- [FEATURES.md](FEATURES.md): feature inventory with build status
- [docs/status.md](docs/status.md): milestones, what is built and what was checked
- [docs/decisions.md](docs/decisions.md): dated decisions
- [docs/evidence/](docs/evidence/): measurement, heuristic evaluation, accessibility pass, session guide
- [CLAUDE.md](CLAUDE.md): rules for AI coding sessions
