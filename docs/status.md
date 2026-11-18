# Status

Legend: **planned** (not started), **implemented** (written, not independently checked), **verified** (checked, with how).

## Milestones

| | Milestone | State |
| --- | --- | --- |
| M1 | Foundation and working-step screen | verified and merged (PR #1) |
| M2 | Core loop on sample data with persistence: home, working step, pause and notes, completion and undo, timer, side panels, final check, completed home, review | verified and merged (PR #2) |
| M3 | Brief entry, building, plan review and editing, error screens, preview deploy | verified and merged (PR #3) |
| M4 | AI generation (server-side, structured output) | verified and merged (PR #4) |
| M5 | Evaluation readiness: sample-brief flag, one tracked event, heuristic and accessibility review, session templates | verified and merged (PR #5); sessions and VoiceOver pending (Aidan) |
| M6 | Fixes from evaluation | verified and merged (PR #6); VoiceOver pending |
| M7a | Several assignments: data and ordering (logic only) | implemented and **verified** on branch `feat/m7a-multi-assignment-model` (see M7a); not pushed |
| M7b | Several assignments: prioritized home list | planned |
| M7c | Several assignments: upload a week's briefs in one go | planned |
| M7d | Several assignments: see Aidan's M7 plan (not in this repo) | planned |
| — | Docs and case study (was the M7 row; where it goes now is for Aidan to confirm) | planned |

## M1 summary

Next.js app, tokens, primitives, Momentum components and the working-step screen on sample data. Details and checks: PR #1 and the M1 commits. Its open question (Cache Components) is resolved in M2.

## M2

Merged in PR #2. Decisions: [decisions.md](decisions.md), section M2. The record below is as verified at merge.

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
- Every plan was a copy of the sample assignment in M2 (resolved in M3: Start a new assignment opens brief entry).
- Between-steps home (Core 10) and the "all done, not reviewed" home had no frame in the reference set; their headings are development copy.
- Side panel chips use full requirement labels (differs from Panel 02); rail done steps are struck through (differs from frames, follows handoff). Both flagged in decisions.
- The text area's resting border (`border/input` on white) is 1.48:1, below WCAG 2.2 AA's 3:1 for non-text contrast. To fix in M6 alongside `/craft risk` (see decisions).
- `npm audit` reports a picomatch issue in dev tooling only (unchanged from M1).

## M3

Merged in PR #3. Branch `feat/m3-plan-entry-and-review`, off `main` after PR #2. The record below is as verified at merge. Decisions: [decisions.md](decisions.md), sections "M3 (pre-build sign-offs)" and "M3". Scope: [reviews/2026-11-17-scope-m3-m4.md](reviews/2026-11-17-scope-m3-m4.md), accepted by Aidan.

### Built

- Data: assignment status `review` (plan exists, not started; the only editable state). Optional `briefDraft`, still storage version 1. No first-run seeding: an empty store shows brief entry and writes nothing until the student acts.
- Reducer actions: `setBriefDraft`, `createPlan` (typed deadline wins; blank keeps the plan's), `updateStep`, `addStep`, `deleteStep`, `updateRequirements` (review only, never touches steps), `startPlan`. `startNewAssignment` now leads to brief entry and keeps the completed record.
- `PlanSource` interface with `samplePlanSource` (TEMPORARY: sample brief only, `sampleOnly` for anything else) and a development-only `?simulate=unreadable|failed|slow`.
- `/`: brief entry (R3 05, Error 01), one building state (R3 04) with Cancel, Errors 02 and 03 through one `ErrorCard`. The draft is saved as the student types (400 ms after typing pauses).
- `/plan`: plan review (Setup 03), step edit card with stepper (Setup 04), Add a step, Delete step, requirements edit card (Setup 05), "Requirements updated" notice (R3 03), Panel 03 via the existing side panel. Redirects to `/` with no plan or once started.
- Started-plan routes (`/step/n`, `/step/n/done`, `/final`, `/review`) send the browser to `/` when there is no started plan.
- New shared parts: `TextInput`, `TextArea`, `FieldError`, `AlertIcon`, `EstimateStepper`, width tokens `building` (480) and `error-card` (560), `aria-disabled` on the primary Button, optional Edit on `PlanStepRow`.

### Verified (2026-11-17, Node 24.21.0, Chrome via Playwright)

| Check | Result |
| --- | --- |
| Baseline on the fresh branch before changes | lint, tsc, 74 tests, build: pass |
| `npm run lint`, `npx tsc --noEmit` | pass |
| `npm test` | 16 files, 130 tests pass. New: reducer M3 actions (incl. 9 steps down to 1, then run step 1 to the final review), M2-shaped data loads unchanged, `briefDraft` round trip, sample source (exact, reflowed with straight quotes, other text), `?simulate=` ignored unless `NODE_ENV` is development, requirement row merging, brief entry and errors with an injected source (11), plan review (11) |
| `npm run build` | passes with no environment variables and no `.env` files; `/plan` is a new static route |
| HTTP codes, `npm start` + curl | `/`, `/plan`, `/step/1`, `/step/1/done`, `/final`, `/review`: 200. `/step/abc`, `/step/0`: **404** |
| Walkthrough on the production build | **59/59** checks pass, covering checks 1–10 and 12–14 of the M3 prompt: empty storage shows entry, no indicator, nothing written; empty submit shows Error 01 with 0 network requests and focus in the text area; own text and deadline survive reload, then the sample-only notice with text kept; sample brief with a deadline override reaches `/plan`, due text and chip match the override, indicator shows, draft cleared; step 3 edit (Cancel discards and returns focus; Done saves title, item and time; other steps byte-identical; total updates; Start step 1 `aria-disabled` with a described reason); add step 7 then delete it; requirements change/add/remove, notice, steps unchanged, Review steps focuses the heading, and the final check later lists the edited requirements; Panel 03 on the Brief tab, Escape returns focus; Start step 1 opens step 1 and `/plan` then redirects to `/`; finishing all six steps and Start a new assignment leads to entry with the completed record kept; storage failure on plan review shows "Couldn’t save in this browser", never "Saved", and the edited plan runs in memory; no console errors |
| `?simulate=` | development: unreadable → Error 02 (heading focused), failed → Error 03 (Try again runs again), slow → building, Cancel back with text. Production build: all three ignored, the sample builds a plan |
| Keyboard | Entry order: Use a sample brief → text area → deadline (Chrome gives each date part its own stop) → Break it down. Error 01 by Enter. Edit step 2 by Tab and Enter, focus in Step title; stepper by keyboard (− keeps focus at 5 via `aria-disabled`); Done editing returns focus to Edit step 2; requirements card opens in Requirement 1, Cancel returns focus to Edit; Start step 1 reachable by Tab while disabled; Error 02/03 actions and Cancel by Enter |
| Narrow width | no horizontal overflow at 375 px on brief entry and on plan review with a step edit card open |
| Start step 1, 1280×800, nothing open (measurement for the case study, not a criterion) | top of the button **1315 px** from the top of the page: below the fold, reached by scrolling |

### Vercel preview (2026-11-18)

Preview URL for `feat/m3-plan-entry-and-review`: https://momentum-oyry8u9z1-aidan-o-driscoll.vercel.app (Aidan confirmed it opens in a private window). It is a per-deployment URL, so it stays on that deployment; later pushes get new preview URLs.

| Check | Result |
| --- | --- |
| HTTP codes, curl | `/` 200, `/plan` 200, `/step/abc` **404** |
| Check 1, Chrome with fresh storage | brief entry, no save indicator, nothing written |
| Check 4 | sample brief with deadline override Dec 11, 10:00 AM: `/plan`, "PSYC 3024 · Due Fri, Dec 11, 10:00 AM", "Saved in this browser", total "6 steps · about 3 h 20 min" |
| Check 9 | Start step 1 opens working step 1; `/plan` then redirects to `/` |
| Console | no errors |

The production domain (https://momentum-five-xi.vercel.app) still serves `main` (M2): `/plan` returned 404 there on 2026-11-18.

Screenshots in `docs/evidence/screenshots/`: `m3-brief-entry-empty`, `m3-error01-empty`, `m3-sample-only-notice`, `m3-building` (dev, `?simulate=slow`; shows the Next dev indicator), `m3-error02-unreadable` and `m3-error03-build-failed` (dev, simulated), `m3-plan-review` (with a deadline override of Dec 11), `m3-edit-step-3`, `m3-edit-requirements`, `m3-requirements-updated`, `m3-panel03-brief`, `m3-edit-step-375` (all `.png`). Preview: `m3-preview-brief-entry` (brief entry on the Vercel preview).

### Not verified

- Safari, Firefox and screen readers (VoiceOver, NVDA). Live regions (building status, the notice, the stepper value) were checked in the DOM only.
- Real `prefers-reduced-motion` (the spinner has `motion-reduce:animate-none`, not observed).

### Known limitations

- **The sample-only source.** Only the sample brief builds a plan; other text shows a temporary notice. M4 replaces it. "Use a sample brief" stays; Aidan revisits it after M4's live route is verified.
- **No AI disclosure line yet** (deferred to M4 because nothing is sent anywhere in M3).
- **Chip copy gap.** Plan review chips show `shortLabel ?? label`, so they read "1,500 words", "APA 7th" and the full substantive and submission labels. Figma R3 03 shows other short forms ("Clear position on the assigned question", "Submit via Turnitin"). Settled by Aidan: leave for M3; M4's prompt generates matching labels.
- **Deadline override vs the submission requirement.** The sample's submission requirement has its date in its text ("Submit through Turnitin by Fri, Dec 4, 5:00 PM"), so with an override the plan shows that chip beside "Due Fri, Dec 11". The final-check reminder has the same text. Nothing rewrites requirement text. Settled by Aidan: leave in M3; M4 extracts dates from the pasted brief.
- Editing a requirement's label clears its short label, so it drops out of the collapsed "From your brief" line on the working step (it still shows when expanded).
- Error screens hide the save indicator (handoff decision 4); the Figma error frames show "Saved in this browser".
- Building and the error cards sit 64 px below the top bar (the largest spacing step); Figma has about 160 px (building) and 96 px (errors).
- `/step/9` past the end of a plan is still a client Not found with HTTP 200 (from M2).
- Untested in Safari, Firefox and screen readers.

## M4

Merged in PR #4; production serves it. The record below is as verified at merge. Branch `feat/m4-ai-generation`, off `main` after PR #3. Preview at https://momentum-git-feat-m4-ai-generation-aidan-o-driscoll.vercel.app (the branch alias, which follows the latest push; the checks below ran on commit `a7f673c`). Decisions: [decisions.md](decisions.md), section M4. Risk review: [reviews/2026-11-18-risk-generation.md](reviews/2026-11-18-risk-generation.md).

### Built

- `POST /api/plan` (`src/app/api/plan/route.ts`, Node.js runtime, `maxDuration` 60): zod request check (400), 12,000-character limit (413 `tooLong`), in-memory rate limit of 5 per IP per 10 minutes and 100 per hour overall (429 `rateLimited`), one OpenAI Responses API call with a strict zod schema and a 4,000-token output limit, stopped after 45 s (504) or when the browser cancels. 422 `unreadable` for a refusal, `readable: false`, no substantive or format requirement, 0 or more than 12 steps, or output that fails the schema. 502 `failed` for a missing key, an API or network error, or a reply cut off at the token limit. Logs status, reason and duration only.
- `src/lib/server/openai.ts` (`server-only`, the only reader of `OPENAI_API_KEY`, no retries), `src/lib/server/plan-prompt.ts` (the instructions in plain sentences, and the user message with the brief inside `<brief>` delimiters), `src/lib/server/rate-limit.ts`, `src/lib/plan-schema.ts` (request and model schemas, and `toPlanDraft`: IDs, trimming, estimates to 5 min, substantive first, date-only deadlines kept, malformed ones dropped).
- `apiPlanSource` replaces the M3 sample-only source and its notice: 200 → plan, 422 → Error 02, anything else (and network errors and Cancel) → Error 03.
- Brief entry: `maxLength` 12,000 from one constant; a quiet count ("11,200 of 12,000 characters") within 10% of it, linked to the field; a polite live region that speaks once near the limit and once at it; one disclosure line merged with "No account needed"; a development-copy error if a stored draft is already over the limit (no request).
- `formatDeadline` shows a date-only deadline as "Fri, Dec 4".
- Fixes after the live checks (Aidan's decisions): "Done when" uses the criterion as written (the model starts it lowercase unless it begins with a proper noun; the working step's well capitalizes it); requirement labels lose a final full stop; no step for the final submission (instructions, plus `toPlanDraft` drops the last step if its title starts with "Submit", before counting 1–12; interim Submit steps stay).
- `npm run check:bundle` (`scripts/check-bundle.mjs`).

### Verified (2026-11-18, Node 24.21.0, Chrome via Playwright on `npm run build && npm start`)

| Check | Result |
| --- | --- |
| Baseline on the fresh branch before changes | lint, tsc, 130 tests, build: pass |
| `npm run lint`, `npx tsc --noEmit` | pass |
| `npm test` | 20 files, 179 tests pass, none using the network or a key. New: route (19: valid plan with IDs, rounding and order; 13 steps; refusal, `readable: false`, schema failure and non-JSON → 422; SDK error → 502 with only status and code logged, no brief or IP; cut-off reply → 502; timeout → 504; missing key → 502 with a log line naming the variable only; 400 ×5; 413 without calling the model; 12,000 exactly → 200; 6th request from one IP → 429 while another IP gets 200; Cancel aborts the upstream signal), rate limiter (3), schema and post-processing (11), prompt structure incl. the injection and delimiter-escape cases (4), `apiPlanSource` (11), brief entry (disclosure, `maxLength`, count and live region, over-limit draft), date-only `formatDeadline`. The abort and timeout tests were checked to fail when the route stops passing `request.signal` or stops returning 504. |
| `npm run build` | passes; `/api/plan` is a dynamic route |
| `npm run check:bundle` | passes (27 files in `.next/static`). It was checked to fail on a planted `sk-…` string. A bare `sk-` can't be used: React's own code contains `mask-type` |
| Local curl | empty body → **400**; 13,000-character brief → **413** `{"reason":"tooLong"}`; GET → 405 |
| Live check 6 (Cancel) | building shows, Cancel returns to entry with the text kept and focus in the brief; server log: `502 aborted-by-client 43ms` |
| Live check 7 (rate limit) | six submits in the browser (Break it down, then Try again ×5): responses 502 ×5, then **429**, Error 03 each time |
| Live check 8 (no key) | server started with `OPENAI_API_KEY` empty: Error 03, Edit the brief keeps the text; log line `[api/plan] 502 missing OPENAI_API_KEY 1ms` |
| Brief entry, keyboard | Use a sample brief → text area → deadline (date parts) → Break it down. The disclosure line is a plain `<p>`, not focusable. Count appears at 10,800, not at 10,799; linked by `aria-describedby`; live region text changes only on crossing; typing stops at 12,000; pasting 13,000 characters keeps the first 12,000 |
| Real API, model access (before credit) | `gpt-6.1-terra` → OpenAI **429 `credit_balance_exhausted`**; `gpt-4.1-mini` and `gpt-4o-mini` → **403 `model_not_found`**. Each showed Error 03 |
| Live checks 1–5 and 9 (after credit, `gpt-6.1-terra`) | **all pass**; details, briefs and actual output in [evidence/generation-checks.md](evidence/generation-checks.md). 1: sample brief → every requirement, none invented, Fri, Dec 4, 5:00 PM, substantive first. 2: lab report and reflective portfolio (development briefs) checked requirement by requirement, none missing or invented; the portfolio's final date chosen over the draft date. 3: recipe → 422, Error 02, brief kept. 4: injection → normal plan, no essay text or sources. 5: no date → no deadline; the field's date wins. 9: edit a step, complete every step (count from the plan), final check lists the plan's non-submission requirements, home "All steps done" |
| Timings | 9 plans in **10.0–13.9 s**; recipe refused in 3.0–3.3 s |
| After the three fixes | `npm test` 20 files, **183 tests** pass (new: full stops removed from labels and short labels; a mid-plan "Submit the draft…" step kept and a final "Submit the essay" step dropped, before IDs; 13 steps with a final Submit → 12, valid; only a Submit step → unreadable; `doneWhenSentence` keeps a proper noun's capital; `capitalizeFirst`; the two new instruction lines). Lint, tsc, build and `check:bundle` pass. Live, 2 requests (sample and portfolio briefs, 14.9 s and 13.7 s): every criterion starts lowercase, no label ends in a full stop, no Submit step. No criterion started with a proper noun in these runs, so that case is checked by unit test only |
| Vercel preview (2026-11-18, `a7f673c`, Chrome via Playwright) | curl: no body → **400**; 13,000 characters → **413** `{"reason":"tooLong"}`; GET → 405. The page shows the disclosure line. **Check 1**: sample brief → plan in **14.9 s**, every requirement, none invented, Fri, Dec 4, 5:00 PM, criteria lowercase, no final full stops, no Submit step. **Portfolio brief rerun**: 200 in **18.1 s**; the draft-for-feedback step is back ("Send the draft for feedback", step 5 of 6), and the revision step starts with reviewing the feedback. **Check 3**: recipe → Error 02 in 3.3 s, brief kept. **Check 7**: requests 3–6 from one IP in 10 minutes answered 422, 422, 422, then **429** → Error 03. No page errors |

Screenshots in `docs/evidence/screenshots/`: `m4-brief-entry` (full page, with the disclosure line), `m4-near-limit-count`, `m4-building`, `m4-plan-review-sample` (retaken on the preview after the fixes), `m4-plan-review-second`, `m4-error02-recipe`.

### Not verified

- Live check 9 (end to end) and checks 2, 4 and 5 were run locally, not on the preview.
- The narrowed Submit backstop has not been triggered by real output: no plan since the fix had a last step titled "Submit…". It is covered by unit tests.
- Safari, Firefox and screen readers (live regions checked in the DOM only).

### Known limitations

- **Rate limiting is best effort**: memory is per Vercel instance and resets on a cold start. The hard cost guard is the OpenAI project's monthly budget limit (docs/deploy.md). Requests that fail at OpenAI still count toward the limit.
- **Prompt-injection resistance is checked by hand, not proven.** The tests check only that the brief sits inside the delimiters.
- **Model output varies between runs.** The same brief gave 5 or 6 steps, with different labels and estimates. Generated estimates for the sample brief (about 6.5 h) are about twice the hand-written plan's 3 h 20 min. Accepted by Aidan without prompt tuning; observe in M5.
- **A capital typed by the student stays.** "You have…" typed in the step edit card reads "Done when You have…" outside the working step (M6 candidate in decisions.md).
- **The Submit backstop matches titles only.** A last step titled "Submit…" is dropped even if it also covers other work; one with a different title ("Upload to Turnitin") isn't caught. The narrowed rule hasn't been run against the live model.
- **Pasting more than 12,000 characters keeps the first 12,000** (browser `maxLength`). The count shows "12,000 of 12,000 characters" and the live region says the limit was reached, but nothing says text was cut.
- "Try again in a moment" on Error 03 can be up to 10 minutes when the cause is the rate limit.
- "Today" in the model message is the server's UTC date.

## M5

Branch `feat/m5-evaluation`, off `main` after PR #4. Not pushed (Aidan pushes). Decisions: [decisions.md](decisions.md), section M5. Evidence: [evidence/measurement.md](evidence/measurement.md), [evidence/heuristic-evaluation.md](evidence/heuristic-evaluation.md) (reviewed by Aidan, 2026-11-18), [evidence/accessibility.md](evidence/accessibility.md), [evidence/feedback/](evidence/feedback/). Reviews: [reviews/2026-11-18-risk-pause-saving.md](reviews/2026-11-18-risk-pause-saving.md), [reviews/2026-11-18-signal.md](reviews/2026-11-18-signal.md).

### Built

- **Sample-brief flag:** "Use a sample brief" shows only when `NEXT_PUBLIC_SHOW_SAMPLE_BRIEF` is `"true"` (`src/lib/flags.ts`). The sample text stays for tests.
- **One event, `first_step_started`:**
  - `src/lib/first-step-event.ts`: the bucket, the payload and a send that runs only in a production build;
  - `createPlan` records `planCreatedAt`; `startPlan` records `firstStepStartedAt`. Both are optional, still storage version 1;
  - Start step 1 sends the event when `firstStepStartedAt` was unset.
- **`POST /api/event`** (`src/app/api/event/route.ts`): a strict zod schema, at most 256 characters, its own rate limit (the limiter is now a factory shared with `/api/plan`), one log line ending in `env=` (Vercel's `VERCEL_ENV`, or `unknown`), nothing stored.
- **Disclosure:** one added sentence, approved by Aidan (2026-11-18).
- **Docs:**
  - the measure definition;
  - the heuristic evaluation draft;
  - the accessibility pass with a VoiceOver script for Aidan;
  - `/craft risk` and `/craft signal`;
  - the session README (with the browser reset) and the session template;
  - the axe and keyboard results, and the scripts that made them.

### Verified (2026-11-18, Node 24.21.0)

| Check | Result |
| --- | --- |
| Baseline on the fresh branch before changes | lint, tsc, 183 tests, build, `check:bundle`: pass |
| `npm run lint`, `npx tsc --noEmit` | pass |
| `npm test` | 22 files, **220 tests** pass. New: <ul><li>the flag: hidden for unset, `""`, `false`, `1`, `TRUE`; shown and working for `true`;</li><li>the bucket boundaries;</li><li>the payload is exactly the three keys and holds no brief or plan text or ids;</li><li>the step count comes from the plan (3 after deleting steps);</li><li>no event once `firstStepStartedAt` is set, through complete → undo → reopen and a JSON round trip;</li><li>no event for pre-M5 plans;</li><li>`sendEvent` sends nothing for `development`, `test`, unset or the test run's own `NODE_ENV`, and in production posts exactly the event and swallows a failed request;</li><li>Start step 1 with `NODE_ENV` stubbed to production sends one event with bucket `2–5` (plan at 09:00, start at 09:03), and nothing more after a re-render of plan review or reopening step 1;</li><li>Start step 1 in tests sends nothing;</li><li>`/api/event`: 204 and the exact log line; the other buckets; 400 for another event name, an extra text field, an extra id, an unknown bucket, a non-integer, a string count, zero, a missing field, an array and non-JSON, each logging only status and reason; 413 for an oversized body; 429 after 10 from one IP while another IP passes; the IP is never logged.</li></ul> The once-per-plan test was checked to fail when the `firstStepStartedAt` guard is removed. |
| `npm run build`, `npm run check:bundle` | pass; `/api/event` is a dynamic route; bundle check: 27 files, no key |
| Production build, flag unset (Chrome via Playwright, 1280×800 and 600×800) | <ul><li>"Use a sample brief" absent; the disclosure line shown;</li><li>the brief is kept through Error 01, building and Cancel, and Errors 02 and 03;</li><li>no event before Start step 1, then **exactly one** (`{"event":"first_step_started","minutesSincePlanCreated":"<2","stepCount":6}`, answered 204);</li><li>still one after a pause, a reload, Resume, Mark complete, Undo, reopening `/step/1` by URL and completing all six steps through Finish review;</li><li>server log: one `[api/event] event=first_step_started stepCount=6 bucket=<2` line per run (two runs, two lines);</li><li>the only console errors were the browser's own reports of the 422 and 502 the script returned on purpose.</li></ul> |
| Production build, `NEXT_PUBLIC_SHOW_SAMPLE_BRIEF=true` | button shown; it fills the sample brief (`m5-brief-entry-flag-on-1280.png`) |
| `/api/event` with curl on the production build | valid → **204**; other event name → 400; extra `brief` field → 400; 400+ characters → **413**; GET → 405. Log lines: the event line, then `400 invalid-body` ×2, `413 too-long` |
| axe on 13 screens × 2 widths | **0 violations**; needs-review items checked by hand ([accessibility.md](evidence/accessibility.md)). Raw: `evidence/test-results/axe-m5.json` |
| Keyboard pass (scripted, whole flow, both widths) | no traps; Escape closes the dialog and panel and returns focus; visible focus at every stop; no focused element outside the viewport; no horizontal overflow at 600 px. `evidence/test-results/keyboard-m5.json` |
| Two tabs (for the risk review) | a note saved in tab A was erased by Mark complete in a stale tab B, which showed "Saved in this browser" (known issue, M6 candidate) |

Screenshots in `docs/evidence/screenshots/`: `m5-<screen>-1280.png` and `m5-<screen>-600.png` for brief-entry, error-01, building, error-02, error-03, plan-review, plan-review-edit, working-step, pause-dialog, home-after-pause, step-complete, final-check, completed-home; plus `m5-brief-entry-flag-on-1280.png`.

### Not verified

- **Vercel preview:** the event arriving in the Vercel logs, and the button hidden with the variable unset. Pending Aidan's push.
- **A real model plan** in the M5 browser runs: `/api/plan` was answered by the script with the sample plan (no OpenAI requests in M5).
- **Screen readers:** VoiceOver script written for Aidan; not run. Live regions were checked in the DOM only.
- **A manual keyboard pass by a person:** the pass was scripted key presses.
- **Sessions:** not run yet; nothing in `evidence/feedback/` is filled in.
- Safari and Firefox.
- The step edit card's required-field errors (3.3.1) weren't exercised in M5.

### Known limitations

- **Hobby keeps runtime logs for 1 hour**, so event counts exist only if copied within the hour.
- Counts are per browser, include Aidan's and preview traffic unless filtered, and are a lower bound (no retry). See measurement.md.
- Plans created before M5 never send the event (no creation time).
- Two open tabs overwrite each other's progress (verified; M6 candidate). Two tabs on plan review would send two events.
- The accessibility failures (1.4.11 field borders, 4.1.3 save status) are unchanged; M6.

## M6

Branch `feat/m6-fixes`, off `main` at `e63ddcf` (PR #5). Pushed by Aidan; Vercel preview of `8410d9f`: https://momentum-git-feat-m6-fixes-aidan-o-driscoll.vercel.app (the branch address, no login needed). Decisions: [decisions.md](decisions.md), section M6. Review: [reviews/2026-11-18-compose-responsive-m6.md](reviews/2026-11-18-compose-responsive-m6.md). Accessibility re-run: [evidence/accessibility.md](evidence/accessibility.md), "M6 re-run".

### Built (one commit per item)

| # | Item | Commit | State |
| --- | --- | --- | --- |
| 1 | Tabs stay in step (H-01): the `storage` event reloads another tab's data | `e9c550e` | verified (tests; two Chrome tabs, scripted) |
| 2 | Field border #949494, 3.03:1 (WCAG 1.4.11, H-08); non-field controls on `border/rule` | `8c7fc6a` | verified (token test; computed style in Chrome) |
| 3 | Save status in one mounted `role="status"` region; failed state with icon and Ink; one line (WCAG 4.1.3, H-09) | `547f10a` | verified in the DOM; **not heard** (no screen reader) |
| 4 | No `maxLength`; a long paste is kept and the over-limit message shows at once (H-02) | `f7d0b0b` | verified (tests; 13,000-character paste in Chrome) |
| 5 | 429 → `rateLimited` → Error 03 with its own line (H-03) | `3423e3a` | verified with a mocked 429, and on the preview with a real 429 (preview check 3) |
| 6 | The browser's local date sent as `today`, checked on the server (H-05) | `7c46803` | verified (tests; the request body in Chrome; on the preview with the live model, preview check 5) |
| 7 | Undo described by "Step N is marked done." (signal 5) | `489a3ba` | verified (tests; attribute in Chrome) |
| 8 | "Progress saved" announcement | none | **planned**: waits for VoiceOver |
| 9 | Rail keeps the step in progress; "Back to step N" / "Back to home"; wordmark links home (H-17) | `36bdced` | verified (tests; in Chrome) |
| 10 | Side-panel line once started: "Steps can’t be changed after you start." | `cdb73c5` | verified (tests; in Chrome) |
| 11 | /craft compose fix: step-complete captions in one footer | `deba3df` | verified (screenshots) |
| | Test race fix (Error 02/03 focus) | `67533f4` | verified: 0 failures in 25 full runs under load, against about 1 in 8 before |

### Verified (2026-11-18, Node 24.21.0)

| Check | Result |
| --- | --- |
| Baseline on the fresh branch before changes | lint, tsc, **221 tests** (not 220: M5's `env=` test added one), build, `check:bundle`: pass |
| `npm run lint`, `npx tsc --noEmit` | pass |
| `npm test` | 27 files, **257 tests** pass (36 new). New: <ul><li>another tab's write replaces the data; the next write keeps that tab's note; other keys are ignored; an unreadable value shows failed and is never written over;</li><li>`border/input` ≥ 3:1 on white and `surface/page`; focus border ≥ 3:1 against it;</li><li>the status region is mounted while hidden, is the same element through hidden → saved → failed → saved, and the failed state has its own icon, Ink and no wrap;</li><li>a 13,000-character paste is kept with its end, shows the over-limit message and the count, and sends nothing; trailing whitespace isn't counted, on the client or by the route;</li><li>429 → `rateLimited`; Error 03 shows the rate-limit line, makes one request and retries only on Try again;</li><li>`resolveToday`: valid, missing, far-off; the route uses the browser date, and falls back for a missing, far-off or malformed date (5 kinds) without a 400; `localDate` late in the evening;</li><li>Undo's accessible description on step complete and the final check;</li><li>the done-step rail lists the in-progress step; Back to step N; Back to home; the wordmark link;</li><li>the side-panel line in review, active and completed.</li></ul> The tab-sync tests were checked to fail with the listener removed. |
| `npm run build`, `npm run check:bundle` | pass; bundle check: no key |
| Two tabs, H-01 steps (Chrome via Playwright, `m6-scripts/tabs-m6.mjs`) | Tab A paused step 1 with a note; stale tab B pressed Mark complete. The stored step 1 is **done with the note kept** ("Note written in tab A"). In M5 the same steps erased it. **Scripted, not by hand:** Aidan's preview check |
| Walkthrough on the production build at 1280×800 and 600×800 (`m6-scripts/walk-m6.mjs`) | every M6 check passed at both widths (see axe-m6.json `checks`): <ul><li>status region empty on brief entry;</li><li>field border `rgb(148, 148, 148)`;</li><li>13,000 characters kept, message and count shown, no request;</li><li>the rate-limit line;</li><li>the request body has `today`;</li><li>one event for the whole plan (204);</li><li>Saved on one line;</li><li>Undo described;</li><li>the done view lists "In progress: 3." and Back to step 3 opens step 3;</li><li>the side-panel line;</li><li>the wordmark goes home;</li><li>failed status with icon, Ink, one line, no horizontal scroll, then back to Saved.</li></ul> The only console errors were the 422, 502 and 429 the script returned on purpose |
| axe, 13 M5 screens + 4 M6 views × 2 widths | **0 violations**. Needs review: only the pause dialog, same items as M5. `evidence/test-results/axe-m6.json` |
| Keyboard pass, M6 (scripted, `m6-scripts/keyboard-m6.mjs`, both widths) | no traps; focus on the h1 on every screen; the wordmark is the first stop in the page (token ring); Shift+Tab from the h1 reaches it everywhere except the working step and done view, where it reaches the rail first (H-13). Done view: **Back to step 3 is the 2nd Tab from the h1**, after Hide note, and Enter opens step 3. One stop without the token indicator: Chrome's calendar button in the deadline field, which shows Chrome's own blue ring (M7 candidate; M5's "timing artifact" note corrected). `evidence/test-results/keyboard-m6.json` |
| Top bar below 600 px (`narrow.mjs`) | failed status on one line at 540, 480, 420 and 375; no horizontal scroll; the context shrinks to nothing at 375 (M7 candidate R1) |

### Vercel preview checks (2026-11-18, 18:52–18:53 UTC)

Run by Claude Code with Playwright (Chrome, 1280×800) against the preview of `8410d9f`, using `m6-scripts/preview.mjs`. The preview loaded without a Vercel login. Results: [evidence/test-results/m6-preview.json](evidence/test-results/m6-preview.json). Screenshots: `docs/evidence/screenshots/m6-preview-*.png`. Checks 1, 2 and 4 answered `/api/plan` with the sample plan (no model calls, and none counted toward the rate limit). Checks 5 and 3 made **6 real `/api/plan` requests** from one IP: 5 plans from the model and one 429.

| # | Check | Result | What was observed |
| --- | --- | --- | --- |
| 1 | Two tabs (H-01) | **passed** (scripted, not by hand) | One context, two pages. Tab A paused step 1 with "Note written in tab A (preview)". Tab B, open on `/step/1` since before the pause, already showed the note before Mark complete, so the `storage` event had reached it. After tab B's Mark complete, `localStorage` held step 1 as `done` **with the note**. Tab B's top bar read "Saved in this browser". Tab A reloaded on home ("Your next step"); on `/step/1` (the done view) the note was on screen. `m6-preview-two-tabs-tab-a-step-1.png` |
| 2 | 13,000-character paste | **passed** | 13,000 characters written to the clipboard and pasted with Cmd+V into the brief (not `.fill()`). All **13,000 kept**, ending in "Due Dec 4". "Your brief is longer than 12,000 characters. Shorten it to build a plan." shown, counter "13,000 of 12,000 characters". Break it down sent **no** `/api/plan` request. `m6-preview-paste-13000.png` |
| 3 | Rate limit (real model calls) | **passed** | Request 1 from this IP was check 5's. Check 3's builds 1–4 were requests 2–5: **200** each, all reaching plan review. Build 5, the **6th request in about 70 seconds**, got **429**, and Error 03 read "Too many plans were built from this network. Try again in about 10 minutes." All six were served from `iad1`. This shows the in-memory limiter worked across these six requests. It doesn't show that every serverless instance shares it: a request landing on a fresh instance would start a new count. `m6-preview-rate-limit-error-03.png` |
| 4 | Done step (H-17) | **passed** | Steps 1 and 2 done; step 3 opened; step 1 opened from the rail. The rail listed "Done: 1.", "Done: 2." and "**In progress: 3.** Draft a thesis and outline". "Back to step 3" opened `/step/3` with **focus on its h1** ("Draft a thesis and outline"). The wordmark went to `/` (home, "Pick up where you left off"). `m6-preview-done-step.png` |
| 5 | Local date (H-05; live model) | **passed** | Browser `timezoneId` Pacific/Kiritimati: browser date **2026-11-19**, server UTC date 2026-11-18. The request body's `today` was **"2026-11-19"** (200). Brief: "…Submit it on Canvas by 5 PM tomorrow." Plan review showed **"Due Fri, Nov 20, 5:00 PM"**: the browser's tomorrow, not the server's (Thu, Nov 19). `m6-preview-local-date-plan-review.png` |

Check 5 replaces the by-hand check listed earlier ("after 7 PM local time, a brief due 'this Friday'") with Aidan's scripted version: a browser time zone a day ahead of UTC and a brief due "tomorrow". One model run is one sample; it shows the date reaches the model, not that every relative date resolves right.

Screenshots in `docs/evidence/screenshots/`: `m6-<screen>-1280.png` and `m6-<screen>-600.png` for the 13 M5 screens plus brief-entry-over-limit, error-03-rate-limit, done-step and save-failed.

### Not verified

- **Vercel preview by hand:** the five preview checks above were scripted, not done by a person. That includes the two tabs and the US-evening "this Friday" case, which was covered by the scripted Kiritimati check instead.
- **The rate limit across serverless instances:** not tested (see preview check 3).
- **Screen readers:** items 3 and 7 were checked in the DOM only. Item 8 waits for VoiceOver.
- **Relative dates beyond "tomorrow"** with the live model (for example "this Friday" in a US evening): one model run in preview check 5 only.
- Safari and Firefox.

### Known limitations

- The `storage` event doesn't fire in the tab that wrote, or between two different browsers. Two browsers on one computer still don't share data (as before).
- Each screen renders its own top bar, so a save failure that happens as the screen changes may not be announced (M7 candidate).
- The rate-limit line says "about 10 minutes"; the hourly cap can make the wait longer.


## M7a

Several assignments, step 1: data and ordering only. No screen, route, CSS or `/api/plan` change. Decisions: [decisions.md](decisions.md), "M7".

### Built

- `openAssignment` action in `src/lib/reducer.ts`.
- `src/lib/priority.ts`: `remainingMinutes`, `currentAssignments` (home-list order), `finishedAssignments`.
- `parseDeadline` in `src/lib/format.ts`, shared by `formatDeadline` and the ordering.
- `makeAssignment` test fixture.
- No storage migration: still `version: 1` under `momentum:v1`.

### Verified (2026-11-18, Node 24.21.0)

| Check | Result |
| --- | --- |
| `npm test` | 283 passed (257 before; +26: priority 20, reducer 4, storage 2) |
| `npx tsc --noEmit`, `npm run lint`, `npm run build` | clean |
| Hand flow on `npm run dev` (scripted with Playwright, `/api/plan` and `/api/event` answered by the script): brief → plan review → Start step 1 → pause with a note → home | completed with no console errors; step 1 in progress with its note in storage |
| Same flow on `main`, screenshots compared | brief, plan review, pause dialog and home after pause: **0 differing pixels** at 1280 px |

### Not verified

- Anything a student can see with several assignments: no screen shows more than one yet (M7b).

### Known limitations

- Two tabs on different assignments switch each other, because the open assignment is one shared value (for M7b).
