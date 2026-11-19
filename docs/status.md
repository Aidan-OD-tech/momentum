# Status

Current state of the build (2026-11-19). The reasons behind each choice are in [decisions.md](decisions.md); the full milestone-by-milestone record is in git history.

## Milestones

| | Milestone | State |
| --- | --- | --- |
| M1 | Foundation and working-step screen | merged (PR #1) |
| M2 | Core loop on sample data: home, working step, pause and notes, completion and undo, timer, side panels, final check, review | merged (PR #2) |
| M3 | Brief entry, building, plan review and editing, error screens, preview deploy | merged (PR #3) |
| M4 | AI plan generation (server-side, structured output) | merged (PR #4) |
| M5 | Evaluation readiness: sample-brief flag, one tracked event, heuristic and accessibility review, session guide | merged (PR #5) |
| M6 | Fixes from the evaluation | merged (PR #6) |
| M7 | Several assignments: prioritized home list and a week's briefs at once | merged (PRs #7–#10) |
| **M8** | **Participant sessions, VoiceOver, case study, and the M8 candidates in decisions.md** | **next** |

## What's built

- **Brief to plan.** Paste a brief (or up to 8 at once), get one plan per brief from the model, one request at a time, then review and edit each plan before starting.
- **Working through a plan.** One step at a time, with pause and a return note, optional timer, side panels for the full plan and the brief, undo of the last step, and a final check.
- **Home list.** Every assignment, soonest deadline first, with an approximate time left; "Up next" is the top of that order. Finished assignments stay in a collapsed list.
- **Storage.** Everything stays in this browser (`momentum:v1`); nothing is stored on a server. Open tabs stay in step with each other.
- **Server.** `/api/plan` (rate limited: 12 per IP per 10 minutes, 100 per hour overall) and `/api/event` (one tracked event, `first_step_started`).

## Verified

At the end of M7 (2026-11-19, Node 24.21.0):

| Check | Result |
| --- | --- |
| `npm test` | 367 passed |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | clean |
| axe (axe-core 4.10) | 0 violations on every screen at 1280 and 600 px, and on the M7 screens at 375 px ([evidence/accessibility.md](evidence/accessibility.md), `evidence/test-results/`) |
| Keyboard | scripted pass: no traps, focus moves to the h1 on every screen |
| Live model | M4 generation checks on the real API ([evidence/generation-checks.md](evidence/generation-checks.md)); M6 preview checks, including a real 429 |
| Screenshots | `evidence/screenshots/` (M5 onward) |

## Not verified yet

- **Participant sessions** (at least 2): guide in [evidence/session-guide.md](evidence/session-guide.md).
- **VoiceOver.** Live regions and focus were checked in the DOM only; the "Progress saved" announcement waits for it.
- **A full week on the real model:** three real briefs on production, to be recorded in `evidence/test-results/m7-real-model.md` from Aidan's notes only. Every M7 browser check used a stubbed `/api/plan`.
- A manual keyboard pass by a person, Safari and Firefox, and real `prefers-reduced-motion`.
- The M7 Figma frames against the build.

## Known limitations

- **Rate limiting is best effort:** it lives in memory per Vercel instance. The OpenAI monthly budget is the hard cost cap ([deploy.md](deploy.md)).
- **Model output varies:** step counts, labels and estimates change between runs, and estimates run long (H-04), so time left is approximate.
- **Prompt-injection resistance** is checked by hand, not proven.
- **The weekly upload queue** stops on a reload or when the tab closes; unbuilt briefs stay as drafts but the queue doesn't resume.
- **Two tabs:** after a reload, whichever tab wrote last decides which assignment opens; two queues started at the same moment can build one brief twice. Two different browsers never share data.
- **Event counts** exist only if copied from Vercel logs within 1 hour (Hobby plan); see [evidence/measurement.md](evidence/measurement.md).
- `/step/9` past the end of a plan shows a client-side Not found with HTTP 200, because plans live only in the browser.
