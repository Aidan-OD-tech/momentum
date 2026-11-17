# Status

Legend: **planned** (not started), **implemented** (written, not independently checked), **verified** (checked, with how).

## Milestones

| | Milestone | State |
| --- | --- | --- |
| M1 | Foundation and working-step screen | verified and merged (PR #1) |
| M2 | Core loop on sample data with persistence: home, working step, pause and notes, completion and undo, timer, side panels, final check, completed home, review | implemented and verified on branch `feat/m2-core-loop`; awaiting Aidan's review |
| M3 | Brief entry, building, plan review and editing, error screens, preview deploy | planned |
| M4 | AI generation (server-side, structured output) | planned |
| M5 | Evaluation (heuristic evaluation, task-based feedback) | planned |
| M6 | Fixes from evaluation | planned |
| M7 | Docs and case study | planned |

## M1 summary

Next.js app, tokens, primitives, Momentum components and the working-step screen on sample data. Details and checks: PR #1 and the M1 commits. Its open question (Cache Components) is resolved in M2.

## M2

Branch `feat/m2-core-loop`. Not pushed, not deployed. Decisions: [decisions.md](decisions.md), section M2.

### Built

- Cache Components off; malformed step URLs return 404 from the server.
- Figma copy for the brief and steps 1, 4, 6; Display step title.
- `storage.ts` (one versioned key, unreadable data backed up), `reducer.ts` (every rule, pure), `momentum-store.tsx` (writes after each change, drives the save indicator).
- Screens: home (paused, between steps, all done, completed), working step with Return note v2 and the pause dialog, step complete, final check with undo, review.
- Timer in all five states; side panel with Plan and Original brief tabs; Dialog, Sheet, Checkbox, Tabs primitives.
- Rail steps link to their step; the "From your brief" collapsible toggles.

### Verified (2026-11-17, Node 24.21.0)

| Check | Result |
| --- | --- |
| `npm run lint`, `npx tsc --noEmit` | pass |
| `npm test` | 11 files, 74 tests pass (reducer rules incl. 3- and 9-step plans, storage failure and backup, store save status, timer logic and component with fake timers, pause dialog draft, formatters). The undo test was checked to fail when undo stops restoring the note fields. |
| `npm run build` | passes; each M2 commit also builds (checked in a clean worktree) |
| HTTP codes, `npm start` + curl | `/step/abc`, `/step/0`, `/step/03`, `/step/-1`, `/step/1.5`, `/step/abc/done`: **404**. `/`, `/step/1`, `/step/3/done`, `/final`, `/review`: 200 (the last three redirect home in the browser when they don't fit the state). `/step/9`: 200 with Not found shown by the client (known limit) |
| Walkthrough in Chrome (Playwright, production build) | 60/60 checks pass, covering the 8 steps of the M2 prompt: first visit; complete steps 1 and 2 with one undo; draft survives close and reload; Finish for now with "Progress saved" (gone after reload); hide note survives reload; timer start/hide/show/pause/resume/off and a hidden run to Ended (clock fast-forwarded); final check with two ticks, undo to step 6 and back, ticks kept, Finish review; review; Start a new assignment keeps the completed record. Plus panels, `/step/9` Not found, `/final` guard, no console errors |
| Storage failure (setItem made to throw) | "Couldn’t save in this browser" shows, "Saved" and "Progress saved" never do, and the flow works in memory |
| Mark complete top, 1280×800, resumed with note (longest working screen) | **612 px** (limit 700) |
| Keyboard | Pause dialog: opens in the note field, Tab cycles textarea, Keep working, Finish for now, Close and stays inside; Escape returns focus to Pause for later. Side panel: opens on the Plan tab, arrow keys switch tabs, Escape returns focus to View full plan. Step complete: Continue, Finish for now, Undo. Final check: four labeled checkboxes (Space toggles), Finish review, View full plan, Undo. Token ring on every control; text area uses the dark border |
| Narrow widths | no horizontal overflow at 375 and 800 px on home, working step, final; dialog and side panel are full width at 375 px |

Screenshots in `docs/evidence/screenshots/`: `m2-home-paused-with-note`, `m2-home-between-steps-first-run`, `m2-working-note-shown`, `m2-working-note-hidden`, `m2-pause-dialog`, `m2-pause-dialog-375`, `m2-timer-running`, `m2-step-complete`, `m2-final-check`, `m2-completed-home`, `m2-review`, `m2-panel-plan`, `m2-panel-brief`, `m2-save-failure` (all `.png`).

### Not verified

- Screen readers (VoiceOver, NVDA): live region for timer Ended and h1 focus on route change were checked in the DOM only.
- Safari and Firefox; real `prefers-reduced-motion`.
- Private browsing mode itself (simulated by making `setItem` throw).
- Hydration was not tested separately beyond "no console errors" in the walkthrough.

### Known limitations

- `/step/9` on a six-step plan returns HTTP 200 with client Not found (see decisions).
- Every plan is a copy of the sample assignment until M3. Start a new assignment creates another copy.
- Between-steps home (Core 10) and the "all done, not reviewed" home had no frame in the reference set; their headings are development copy.
- Side panel chips use full requirement labels (differs from Panel 02); rail done steps are struck through (differs from frames, follows handoff). Both flagged in decisions.
- `npm audit` reports a picomatch issue in dev tooling only (unchanged from M1).

### Next (M3)

Brief entry, building state, plan review and editing (estimates, add/edit/delete steps, edit requirements with the "Requirements updated" notice), error screens, preview deploy.
