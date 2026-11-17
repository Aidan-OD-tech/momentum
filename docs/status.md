# Status

Legend: **planned** (not started), **implemented** (written, not independently checked), **verified** (checked, with how).

## Milestones

| | Milestone | State |
| --- | --- | --- |
| M1 | Foundation and working-step screen | implemented, mostly verified (below); awaiting Aidan's review |
| M2 | Core loop and persistence (home, pause and notes, completion and undo, side panels, timer, local storage, save indicator) | planned |
| M3 | Setup flow and preview deploy (brief entry, plan review and editing, errors, final check, completed home) | planned |
| M4 | AI generation (server-side, structured output) | planned |
| M5 | Evaluation (heuristic evaluation, task-based feedback) | planned |
| M6 | Fixes from evaluation | planned |
| M7 | Docs and case study | planned |

## M1

Branch: `feat/m1-foundation`. Not pushed, not deployed.

### Built

| Item | State |
| --- | --- |
| Next.js app (App Router, TypeScript, ESLint, Tailwind, `src/`), no env vars, no network calls from app code | verified |
| Tokens (`tokens.css`) exposed to Tailwind; default Tailwind palette removed | verified (design-rules test, build) |
| Inter via `next/font/google` (downloaded at build, self-hosted) | verified (no non-localhost requests at runtime) |
| Button (primary, secondary, tertiary), Collapsible, six icons | implemented |
| TopBar (Session and Home), Progress, RailStep, StepRail, BulletItem, DoneWhen, Chip, BriefRequirements, Timer (Off only), WorkingStep | implemented; rendered and checked in Chrome |
| Sample assignment, data model types, display-state helper | implemented; helper tested |
| Route `/step/[n]` (1 to 6), `/` redirects to `/step/3` | verified |
| Docs: README, CLAUDE.md, product, design-rules, decisions, status, ai-log | implemented |

### Checks run (2026-11-17, Node 24.21.0)

| Check | Result |
| --- | --- |
| `npm run lint` | passes, no output |
| `npx tsc --noEmit` | passes |
| `npm test` | 5 files, 33 tests pass: Progress (4/6 and 9-step plans, clamping, singular), BriefRequirements (aria-expanded, chips, substantive first), step display state (n = 1, 3, last, other sizes), URL parsing, deadline formatting, design-rules guard (checked it fails when given a hex color, `p-[13px]` and `px-5`) |
| `npm run build` | passes |
| Chrome (Playwright driving local Chrome), production build via `npm start` | `/step/1` to `/step/6` render with the right title, progress ("0 of 6" to "5 of 6"), rail and step label; `/step/7`, `/step/0`, `/step/abc`, `/step/03` show Not found; no console errors; no requests to other hosts |
| Mark complete top at 1280×800, `/step/3` | **500 px** (limit 700; the handoff's longest screen is 664). Steps 1 to 6 measure 474 to 500. Same 500 px at 1440×900 |
| Keyboard pass, `/step/3` | Tab order: View full plan, Original brief, Mark complete, Pause for later, From your brief, Start a 30 min timer. That is visual order. Each shows the ring (computed `0 0 0 2px #fff, 0 0 0 6px #111`; sampled pixels show 2 px white inside 4 px dark). Enter on the brief toggle sets `aria-expanded="true"` and shows 5 chips |
| Narrow widths | no horizontal overflow at 800 px (rail stacked above the column) or 375 px |
| Screenshots | `docs/evidence/screenshots/`: `m1-step3-1440.png`, `m1-step3-1280x800.png`, plus `m1-step3-800.png`, `m1-step3-brief-expanded-1280x800.png`, `m1-focus-ring-sample.png` |

### Not verified

- Comparison with Figma Core 01: no Figma access in this session, so layout details were built from the handoff and the M1 prompt. No `figma-core01.png` saved.
- Screen reader behavior, `prefers-reduced-motion` behavior (transitions are set to none with `motion-reduce:`, not exercised), Safari and Firefox.
- Hover and disabled looks for buttons: the handoff names the states but gives no colors; the choices are mine (see Known limitations).

### Known limitations

- **Buttons that do nothing yet.** Mark complete, Pause for later, Start a N min timer (`// M2`), View full plan, Original brief (`// M2`, side panels). They render enabled so the screen matches Core 01. Plan review and brief entry are M3.
- **Brief text is a placeholder.** The brief shown in Figma was not available; `sample-assignment.ts` has a development brief that matches the requirements. The intros and What to do items for steps 1, 2, 4, 5 and 6 are also development copy (marked in the file). Nothing displays the brief in M1, but it is the data M2's Original brief panel will show.
- **Invalid step numbers.** The first request to a bad number (`/step/8`) returns HTTP 200 with the Not found page; later requests return 404. See Open in [decisions.md](decisions.md).
- **Choices made without a design to check:** step title is Heading L; button horizontal padding is 24 px; secondary hover is `surface/subtle`; disabled buttons use `surface/subtle` fill and `text/tertiary`; the wordmark is plain text in Heading M; the rail shows done and current steps only.
- Unused in M1 but built: TopBar's `saved` and `failed` indicator states (the page always passes `hidden`), `Icon` Close and Note, `shadow-dialog`, `shadow-side-panel`, `overlay-scrim`.
- `npm audit` reports one high-severity picomatch issue in dev tooling (lint and test); none in production dependencies. Not fixed: the suggested fix downgrades Vitest.
- `AGENTS.md` and `favicon.ico` are from the Next.js scaffold, unchanged.

### M1 still needs (not built, out of scope)

Aidan's decision on the Cache Components question; the real brief text and Core 01 export for a side-by-side check; a decision on whether unwired buttons should be disabled until M2.
