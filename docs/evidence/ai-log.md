# AI contribution log

Records what AI tools produced and where Aidan changed, corrected or decided. Kept honest for the course's AI-disclosure requirement.

## M1: foundation and working-step screen (2026-11-17)

- Implemented by Claude Code from a written M1 prompt: repository setup, Next.js scaffold, tokens, UI primitives, Momentum components, sample data, `/step/[n]` route, tests, docs.
- Aidan's inputs: the handoff, the Figma designs, the decisions in [../decisions.md](../decisions.md), and the M1 prompt itself.
- Sample copy (brief text; intros and What to do for steps 1, 2, 4, 5, 6) was written by Claude Code for development and is marked in `src/data/sample-assignment.ts`.

### Aidan's corrections and decisions

- Asked for Figma copy instead of the M1 placeholder brief and step copy (done in M2).
- Chose Display for the step title (M1 had Heading L).
- Decided to disable Cache Components after the M1 report of 200-then-404 for invalid steps.

## M2: core loop with browser persistence (2026-11-17)

- Implemented by Claude Code from Aidan's written M2 prompt, with Aidan's Figma reference screenshots in `docs/reference/figma/`.
- Claude Code's own corrections during M2, found by its browser walkthrough or tests:
  - A loading state rendered *instead of* the page hid `notFound()` from the server render, so malformed URLs returned 200 again. Fixed with `<WhenLoaded>`.
  - Undo on step complete and on the final check raced with the screen's own "wrong state, go home" redirect. Fixed with a "leaving" flag.
  - "Progress saved" was cleared by a no-op action fired when the step screen re-rendered. Fixed by clearing it only when data changes.
  - The undo unit test passed even with a broken undo; it was strengthened so it fails without a real restore.
- Choices Claude made where the sources were silent are marked "(Claude)" in [../decisions.md](../decisions.md) for Aidan's review.

### Aidan's corrections and decisions (M2)

(Add entries here.)

## M3: brief entry and plan review (2026-11-17)

- Implemented by Claude Code from Aidan's written M3 prompt (sent in three parts), with the ten M3 Figma exports Aidan placed in `docs/reference/figma/`, and the `/craft scope` review Aidan accepted.
- Claude Code's own corrections during M3, found by its tests or browser walkthrough:
  - The plan review focus helper called `scrollIntoView`, which the test environment lacks; removed, since `focus()` already scrolls.
  - The first walkthrough run failed on its own selectors (a label lookup matched "Remove requirement 2" as well as the field) and on a tab-order check that didn't allow for Chrome's per-part stops in the date field. Both were test-script errors, not app bugs; the script was fixed and re-run (59/59).
  - A screenshot showed Start step 1 grey after closing the requirements card. Checked in the browser: the button was enabled; the screenshot had caught its colour transition. The screenshot was retaken after the transition.
- Choices Claude Code made where the prompt and frames were silent are listed in [../decisions.md](../decisions.md), "M3 · Claude Code's choices (pending Aidan)".

### Aidan's corrections and decisions (M3)

- Accepted the `/craft scope` recommendations, with "Use a sample brief" kept for M3 against scope item 8, and the cost guard, `/craft risk` and the disclosure line deferred to M4.
- Delete step without a dialog; new requirements are substantive.


## M4: real plan generation (2026-11-18)

- Implemented by Claude Code from Aidan's written M4 prompt (sent in two parts). Before building, Claude Code ran `/craft risk` on the route ([../reviews/2026-11-18-risk-generation.md](../reviews/2026-11-18-risk-generation.md)) and stopped for Aidan on three items that changed the prompt's sections 1–2. Aidan accepted all three: date-only deadlines, a cut-off reply shown as Error 03, and "use the final submission date".
- Claude Code wrote the model instructions in `src/lib/server/plan-prompt.ts` from the rules in Aidan's prompt; Aidan has not yet edited them.
- Claude Code read the installed `openai` SDK (7.59) and Vercel's current docs instead of relying on memory. That's where two design points came from: `responses.parse` throws on a schema mismatch (so the route parses itself), and Vercel overwrites `X-Forwarded-For`.
- Claude Code's own corrections during M4:
  - The bundle check as specified (a bare `sk-`) failed on the first build: React's `mask-type` attribute contains it. It now matches the shape of a key and was checked to fail on a planted one.
  - A lint warning in a new test (an unused destructured variable) was fixed.
  - The first full-page screenshot of brief entry was cut at 800 px and hid the disclosure line; it was retaken as a full page.
- The API key was never read, printed or logged by Claude Code. Checks only tested whether it was set, and check 8 overrode it with an empty value in the shell.

### Aidan's corrections and decisions (M4)

- Accepted risk items A, B and C (2026-11-18).

## M5: evaluation readiness (2026-11-18)

- Implemented by Claude Code from Aidan's written M5 prompt: the sample-brief flag, the `first_step_started` event and `POST /api/event`, the measure definition, the heuristic evaluation **draft**, the accessibility pass, `/craft risk` and `/craft signal`, and the session README and template.
- Claude Code checked Vercel's current docs instead of memory. Custom events need Pro or Enterprise, and Hobby keeps runtime logs for 1 hour. Aidan confirmed the plan (Hobby), which decided the route.
- **What Claude Code did not do:**
  - It wrote no participant findings, quotes, counts or results; the feedback files and the "Observed in sessions" tables are empty for Aidan.
  - It did not use a screen reader; it wrote a VoiceOver script for Aidan.
  - Its keyboard pass was scripted key presses, not a person at a keyboard.
  - The heuristic evaluation is an AI expert review, marked "Reviewed by Aidan: no".
- Claude Code's own corrections during M5:
  - Its keyboard script first reported no focus indicator on the deadline field. It had read the style before the border's transition ended; re-checked after 600 ms (dark border present) and recorded as a script artifact, not a finding.
  - Its first keyboard script failed on its own step loop (it looked for Mark complete on a step-complete screen); rewritten and re-run.
  - Lint warnings in two new tests (unused parameters in `fetch` spies) were fixed by typing the spies as `fetch`.
  - The VoiceOver script first suggested a Safari private window to trigger a save failure; local storage works there, so it was changed to blocking site data in Chrome.
- The browser checks answered `/api/plan` with the sample plan, so no OpenAI requests were made in M5, and the API key wasn't read.

### Aidan's corrections and decisions (M5)

- The project is on Vercel Hobby, so the event uses `POST /api/event` (2026-11-18).
- Closed the M4 building-copy item (keep "under a minute") and added "Today" in UTC to the M6 candidates (2026-11-18).
- Approved the disclosure line; confirmed H-01 as severity 3 and marked the heuristic evaluation reviewed; accepted the M6 candidates in order (tab sync, then WCAG 1.4.11 and 4.1.3), with H-04, H-07 and the severity-1 items as "watch in sessions" (2026-11-18).
- Asked for an `env=` tag (`VERCEL_ENV`) on the event log line, so preview and test traffic can be filtered out (2026-11-18).

## M6: fixes from the evaluation (2026-11-18)

- Implemented by Claude Code from Aidan's written M6 prompt: items 1–7, 9 and 10, one commit each, with tests. Then a `/craft compose` and `/craft responsive` pass, and the axe walkthrough again. Item 8 waits for VoiceOver, as the prompt said.
- **What Claude Code did not do:**
  - It wrote no session findings, quotes or counts.
  - It moved no "Watch in sessions" item into M6.
  - It used no screen reader.
  - It made no OpenAI requests (`/api/plan` was answered by the scripts).
  - It didn't push, merge or deploy.
  - The H-01 two-tab check was scripted in Chrome, not done by hand.
- **Flagged rather than decided:**
  - "Change only fields" vs "darken `--border-input`" (the non-field controls moved to a new `border/rule` token at the old colour);
  - "VoiceOver step 4" for "Progress saved", which is step 7 in the script.
- **Claude Code's own corrections during M6:**
  - A commit (item 10) went in while one test was failing: the check grepped the output instead of failing on it. The failure was a timing race in two Error 02/03 tests, made more likely by the new 429 test and by a server running alongside. Bisecting showed no product commit caused it. Fixed in the tests (`67533f4`), and later commits ran the suite with a strict pass check.
  - A new route test called the fake-client helper inside a named function, which the hooks lint rule rejects; moved into `beforeEach`.
  - The first M6 walkthrough tried to show the failed save status on brief entry, which has no save indicator; moved to the final check.

