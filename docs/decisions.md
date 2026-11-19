# Decisions

Each entry says who decided. "(Claude; signed off by Aidan, 2026-11-17)" means Claude Code chose it while implementing and Aidan approved it. "(Claude)" alone marks entries that were superseded before review.

## M1 (2026-11-17)

**Tailwind CSS + shadcn/ui + Radix, restyled to Momentum tokens.** (Aidan) Default shadcn styling is not used. Unused shadcn variables are removed. M2 adds Dialog, Checkbox and Tabs as thin Radix wrappers in `src/components/ui/`, styled with tokens.

**Keep Core 01's short "From your brief" line.** (Aidan) Collapsed shows the short labels joined with " · "; expanded shows every requirement as a chip.

**Add `Step.intro?: string`.** (Claude; signed off by Aidan, 2026-11-17) Core 01 shows a context line under the step title; the handoff's data model has no field for it.

**Add `Requirement.shortLabel?: string`.** (Claude; signed off by Aidan, 2026-11-17) The collapsed "From your brief" line needs short forms like "APA 7th". Requirements without a shortLabel (the sample's substantive one) are left out of that line and still appear as chips when expanded.

**Display-state helper for the M1 preview.** (Claude) *Superseded in M2:* steps now have real stored status and the helper is gone.

**`cn()` is plain clsx, no tailwind-merge.** (Claude; signed off by Aidan, 2026-11-17) tailwind-merge reads custom `text-*` type styles as colors and drops one of them. The shadcn CLI's own `cn` package was replaced for the same reason: it is opaque.

**Icons are inline SVG, not lucide-react.** (Claude; signed off by Aidan, 2026-11-17) Six small icons; no dependency.

**Step title uses Heading L.** (Claude) *Superseded in M2 by Display, below.*

**`export const instant = false` on the step route.** (Claude) *Superseded in M2:* removed with Cache Components.

## M2 (2026-11-17)

### Platform

**Disable Cache Components.** (Aidan) Removed `cacheComponents` and `partialPrefetching` from `next.config.ts` and the `instant = false` export from the step route. Reason: with Cache Components on, the first request to an invalid step returned HTTP 200 with the Not found page (later requests returned 404). Verified on `npm run build && npm start` with curl: `/step/abc`, `/step/0`, `/step/03`, `/step/-1` and `/step/1.5` each return 404 on the first request (also `/step/abc/done`).
Known limit: once plans live in local storage, the server can't know how many steps a plan has. A well-formed number past the end of the stored plan (e.g. `/step/9` on a six-step plan) shows the Not found content from the client and returns HTTP 200. Plans are not capped at six steps to get around this.

**The store renders its children on the server; screens wait inside `<WhenLoaded>`.** (Claude; signed off by Aidan, 2026-11-17) A first version showed a loading state *instead of* the page until storage was read. That hid the page's `notFound()` from the server render and every malformed URL returned 200 again. Now the provider always renders children, and each page wraps its screen in `<WhenLoaded>`, which shows the neutral loading state until the data is known.

### Data and storage

**Add `Step.pauseDraft?: string`.** (Aidan, from the MOMENTUM_CONTEXT recommendation) Unsaved text typed in the pause dialog, kept apart from `note` so a refresh doesn't lose it. Finish for now clears it.

**Add `Step.completedSummary?: string`.** (Aidan) The line under "Step N done." (Core 09). Omitted when missing.

**Storage rule.** (Aidan's rule, implemented by Claude) One key, `momentum:v1`. If the stored text can't be parsed or has an unknown version, it is copied to `momentum:v1:unreadable` before anything else, then the app starts fresh. If storage can't be read, or the backup copy fails, the app works in memory and makes no writes for the rest of the session, so unreadable data is never overwritten. The top bar then shows "Couldn’t save in this browser".

**First run seeds the sample assignment.** (Aidan) With nothing stored, the app saves a copy of the sample assignment (every step upcoming) and shows home. This is sample data until M3 builds brief entry and plan review.

**"Progress saved" lives in memory only.** (Aidan) Shown on home only right after a Finish for now whose write succeeded; gone after a reload or the next change.

### Step rules the handoff doesn't spell out

**Opening steps and undo.**
- (Aidan, 2026-11-17), from the M2 prompt:
  - A done step opened from a URL stays done and shows without Mark complete, Pause for later or the timer.
  - Starting a different step clears `lastUndo`.
  - If more than one step is in progress (possible by opening steps from URLs), home resumes the lowest-numbered one.
- (Claude; signed off by Aidan, 2026-11-17):
  - Re-viewing the step you just completed (the one `lastUndo` refers to) doesn't clear `lastUndo`, so undo stays available.
  - A done step opened from a URL shows "You marked this step done." in place of the actions.

**Mark complete goes to the final check when it finishes the plan.** (Claude; signed off by Aidan, 2026-11-17) The handoff says "after step 6, go to the final check". The build goes to `/final` whenever the completed step was the last one not done, and to `/step/n/done` otherwise. Step complete's "Next up" is the first step not done after n, then from the start.

**Home when every step is done but the review isn't finished.** (Claude; signed off by Aidan, 2026-11-17); no frame. Home shows the assignment card with "Next up · Final check" and "Go to the final check". The heading for the between-steps state is "Your next step" (development copy: no Core 10 frame was in the reference set).

### Screens

**Undo from the final check.** (Aidan) A footer row matching Core 09: "Step 6 is marked done." with a tertiary Undo, shown while `lastUndo` is set and the review isn't finished. It returns to that step in progress. Not drawn in Figma at the time of the prompt. The frame now exists in Momentum v2 on the page "Design additions (post-R3)" (node `35:1708`), frame "A1 · Final check — undo last step" (node `35:1709`). Its screenshot is `docs/reference/figma/a1-final-check-undo.png`, and the build matches it.

**Start a new assignment creates a fresh copy of the sample plan.** (Aidan) The completed record stays in `assignments`. In M3 this becomes "open brief entry" (`// M3` in `reducer.ts` and `HomeScreen.tsx`).

**Review assignment (`/review`) has no Figma frame.** (Aidan) Built from existing components: assignment header, the plan list (Panel 01 rows) with each step's note in the Return note Static style, then the final checklist with ticks shown read-only. Back link returns home.

**Side panel requirement chips show the full labels.** (Aidan, 2026-11-17) Every requirement, including the substantive one, as a chip with its full label, matching the M2 prompt and handoff R3 03 ("requirement chips include the substantive items"). Figma Panel 02's short chips ("1,500 words (±10%)", "Submit via Turnitin", ...) are not used.

**Rail done steps are struck through.** (Aidan, 2026-11-17) Per the implementation handoff. The handoff says "Done (check, struck through)"; the Figma frames show them plain tertiary.

**Text fields show focus with `border/strong`, not the ring.** (Claude; signed off by Aidan, 2026-11-17) Handoff: "border/strong: Focused or active input", and Core 03 shows the typed state with a dark 1px border. Buttons, links, tabs and checkboxes keep the token ring.

**Focus moves to the h1 when a screen opens.** (Claude; signed off by Aidan, 2026-11-17) So route changes are announced. A side effect: on the working step the next Tab goes to Mark complete, then wraps to the rail.

**Pause dialog opens with focus in the note field.** (Claude; signed off by Aidan, 2026-11-17) Radix would focus the close button first.

**Step title uses Display (32/40).** (Aidan) Figma's working-step title is 40px tall.

**Sample copy from Figma.** (Aidan) The brief (Setup 01, Panel 02) and the intros and What to do for steps 1 (Setup 06), 4 (Core 11) and 6 (Core 12) use the Figma copy. Steps 2 and 5 keep development copy. Each piece is labeled in `sample-assignment.ts`.

## Design docs (2026-11-17)

**`PRODUCT.md` and `DESIGN.md` at the repo root, for `/craft`.** (Aidan) `PRODUCT.md` holds only what `/craft` adds: Operating Conditions, voice, references, design principles, accessibility. It links to `docs/product.md` for scope and order of authority instead of repeating them. `DESIGN.md` replaces `docs/design-rules.md`, which is now a pointer; all of its rules carried over unchanged. Aidan supplied the Operating Conditions: lost work first, misplaced trust second; laptop first, often split screen, interrupted sessions; mixed literacy, overwhelmed.

**"The annotated brief" design direction and descriptive color names (Ink, Pencil, Margin, ...).** (Claude; signed off by Aidan, 2026-11-17) The names describe tokens; the token names in code are unchanged.

**WCAG 2.2 AA is the accessibility target.** (Claude; signed off by Aidan, 2026-11-17)

**No `DESIGN.json` sidecar.** (Claude; signed off by Aidan, 2026-11-17) `tokens.css` stays the single source of token values, so a second copy can't drift.

**Known issue for M6: the text area's resting border is 1.48:1.** (Aidan, 2026-11-17) `border/input` (#d4d4d4) on white is below the 3:1 that WCAG 2.2 AA (1.4.11 Non-text Contrast) asks for when a border is the only thing showing where a field is. It affects the pause dialog's note field before it has focus (focus turns it `border/strong`). Address in M6 alongside `/craft risk`; not changed now.

**`FEATURES.md` at the repo root.** (Aidan) The feature inventory for `/craft`. `docs/product.md` stays the source of truth for scope. FEATURES.md uses `built` / `planned` rather than /craft's `shipped`, because nothing is deployed yet.

**Saving stays its own feature area.** (Aidan, 2026-11-17) Lost work is the primary risk in PRODUCT.md, so saving isn't folded under Working through steps.

**Plan building and Plan review and editing stay separate features.** (Aidan, 2026-11-17) They are distinct screens with different failure modes, both landing in M3.

**FEATURES.md Marketing rows are written for the portfolio case study.** (Aidan, 2026-11-17)

## M3 (pre-build sign-offs, 2026-11-17)

**Between-steps home heading stays "Your next step".** (Aidan) It is fixed, not rotated. "Pick up where you left off" is used only in the paused state.

**One backup key, `momentum:v1:unreadable`.** (Aidan) A later unreadable load overwrites the earlier backup. No backup history.

**/craft scope recommendations for M3–M4 accepted.** (Aidan) From [reviews/2026-11-17-scope-m3-m4.md](reviews/2026-11-17-scope-m3-m4.md):
- Don't build: the staged building checklist (Setup 02), regenerate, reordering steps, editing the plan after step 1 has started, editing a requirement's kind in the UI, brief validation beyond the empty check, auto-retry.
- Simplify: one native `datetime-local` deadline field; one `ErrorCard` component for Errors 02 and 03; Add a step appends at the end and opens the edit card straight away; the "Requirements updated" notice is plain text with no history.
- Delete step: only inside the edit card, no confirmation dialog. Figma Setup 04 agrees: "Delete step" is a tertiary button beside Cancel and Done editing, and there is no dialog frame.
- A new requirement's kind is `substantive`.

**"Use a sample brief" stays in M3, against scope item 8.** (Aidan) It is drawn in Figma R3 05 and Error 01, and it's the only way to get a plan before M4. No other demo path. Open question: remove it before the evaluation sessions? Decide before M4.

**Cost guard and `/craft risk` deferred to M4.** (Aidan) The M3 preview has no generation route, so nothing can spend API credit. M4 adds a maximum brief length checked on the server and a simple per-IP rate limit, and runs `/craft risk` before the first deploy that includes the route.

**AI disclosure line (scope item 14) deferred to M4.** (Aidan) In M3 nothing is sent anywhere, so the line would be false.

**Text area border contrast (1.48:1) stays as it is in M3.** (Aidan) Still scheduled for M6.

## M3 (2026-11-17)

### From Aidan's M3 prompt

**Assignment status `review`, set by createPlan; Start step 1 sets `active`.** (Aidan) Only `review` can be edited. `/plan` redirects to `/` with no plan, or once the plan has started.

**`briefDraft` at the top level of the data, still version 1.** (Aidan) Saved as the student types; survives reload, a failed build and Cancel; cleared only when a plan is created. Data saved by M2 loads unchanged (tested).

**No first-run seeding; Start a new assignment opens brief entry.** (Aidan) The completed record stays in storage. `createSampleAssignment` stays for tests.

**PlanSource with a sample-only implementation.** (Aidan) Other text gets the temporary sample-only notice, never Error 02. No fake delay. `?simulate=` works only when `NODE_ENV` is development (tested on the production build).

**Deadline override.** (Aidan) A typed deadline becomes `assignment.deadline`; blank keeps the plan's. The due text and chip derive from it.

**Step and requirement edit rules.** (Aidan) Estimates in steps of 5, minimum 5. A new step starts empty at 15 min. Title and Done when required. Delete is hidden on the last step. Editing a requirement edits its full label and clears its short label. The "Requirements updated" notice is kept in memory only.

### Claude Code's choices

All accepted by Aidan on 2026-11-18. The four defaults first (Add a step draft, notice only on change, screen-reader start reason, and the 480/560 width tokens with AlertIcon; Aidan confirmed the fourth was the tokens and icon), then the remaining six.

**Add a step adds nothing until Done editing.** (Claude Code; accepted by Aidan, 2026-11-18) The new step's card is a draft; Cancel leaves the plan unchanged, so an empty step can never be saved. `addStep` receives the finished step.

**The notice shows only when the requirements actually changed.** (Claude Code; accepted by Aidan, 2026-11-18) Done with no change closes the card without "Requirements updated", which would otherwise be untrue.

**While an edit card is open, all edit triggers are hidden** (Claude Code; accepted by Aidan, 2026-11-18) (row Edit links, requirements Edit, Add a step), so only one edit can be open. Setup 04 and 05 hide the row Edit links but still show Add a step and the requirements Edit.

**"Finish editing to start." is screen-reader text only** (Claude Code; accepted by Aidan, 2026-11-18), linked to Start step 1 by `aria-describedby`. The frames show only a greyed button. Start step 1 uses `aria-disabled` so it stays focusable; the stepper's − does the same at 5 so focus isn't lost.

**Focus after edits:** (Claude Code; accepted by Aidan, 2026-11-18) Done or Cancel returns focus to that step's Edit; adding a step focuses its new Edit; Cancel on a new step returns to Add a step; Delete moves focus to the "Suggested steps" heading; removing an item or requirement focuses the next field or the Add button.

**Simulated `slow` never resolves on its own** (Claude Code; accepted by Aidan, 2026-11-18); Cancel settles it. `failed` and `unreadable` resolve at once.

**A source that throws counts as `failed`** (Claude Code; accepted by Aidan, 2026-11-18) (Error 03).

**New width tokens** (Claude Code; accepted by Aidan, 2026-11-18) `--size-building` (480) and `--size-error-card` (560) from the handoff's layout list, rather than reusing the step-complete width for the error card.

**`AlertIcon`** (Claude Code; accepted by Aidan, 2026-11-18) (circle with an exclamation mark), drawn from the error frames; it isn't in the handoff's icon list.

**`TextInput`, `TextArea`, `FieldError` primitives.** (Claude Code; accepted by Aidan, 2026-11-18) The pause dialog's text area is unchanged (not refactored onto `TextArea` in this milestone).

**The draft saves 400 ms after typing pauses** (Claude Code; accepted by Aidan, 2026-11-18), and immediately on Break it down.

### Settled by Aidan (2026-11-18)

**Dated submission requirement vs a deadline override: leave the requirement text as it is in M3.** (Aidan) With an override, "Submit through Turnitin by Fri, Dec 4, 5:00 PM" can sit beside "Due Fri, Dec 11". No regex rewriting of the sample's text: M4's extraction will take dates from whatever brief is pasted.

**Chip copy gap: leave `shortLabel ?? label` for M3.** (Aidan) Figma R3 03's short forms ("Clear position on the assigned question", "Submit via Turnitin") are not copied in. M4's prompt will generate matching `label` and `shortLabel` values.

**"Use a sample brief" stays for M3.** (Aidan) Revisit right after M4's live AI route is verified: keep it as an optional helper, or hide it during the M5 evaluation sessions.

## M4 (2026-11-18)

### From Aidan's M4 prompt

**OpenAI Structured Outputs through `OPENAI_API_KEY`.** (Aidan) The key is read only in `src/lib/server/openai.ts` (`import "server-only"`); no `NEXT_PUBLIC_` variable holds it. The model comes from `OPENAI_MODEL` (set to `gpt-6.1-terra` in `.env.local` and Vercel), with a default in code.

**Model: `gpt-6.1-terra`, also the code default.** (Aidan, 2026-11-18, after adding credit and a $5 monthly budget cap on the OpenAI project) `DEFAULT_MODEL` in `src/lib/server/openai.ts` matches `OPENAI_MODEL`, so a missing variable doesn't fall back to a model the project can't use. Live checks with it: [evidence/generation-checks.md](evidence/generation-checks.md).

**Limits.** (Aidan) Brief: 1 to 12,000 characters after trimming, from one constant (`src/lib/brief-limits.ts`); over it, 413 `tooLong`. Rate limit: 5 requests per 10 minutes per IP (first `x-forwarded-for` entry), plus 100 per hour overall; over it, 429 `rateLimited`. Model call stopped after 45 s (504) or when the browser cancels. `maxDuration` 60 (Vercel Hobby and Pro both allow up to 300 s with Fluid compute, checked 2026-11-18). No retries (scope item 7), no repair pass (scope item 15).
- Limitation: the rate limiter lives in memory, so on Vercel it is per instance and resets on a cold start. Best effort, not a guarantee. The hard cost guard is the monthly budget limit on the OpenAI project, which Aidan sets (docs/deploy.md). Vercel overwrites `X-Forwarded-For`, so callers can't spoof it there.

**Status mapping.** (Aidan, with risk item B) 200 plan; 422 `unreadable` → Error 02 (refusal, `readable: false`, no substantive or format requirement, 0 or more than 12 steps, output that fails the schema); everything else → Error 03: 400, 413, 429, 502 (missing key, API or network error, reply cut off at the token limit), 504. The client also treats network errors and Cancel as `failed`.

**`samplePlanSource`, `sampleOnly` and its notice are removed.** (Aidan) "Use a sample brief" only fills the text area. `?simulate=` stays, development only. It is hidden during the M5 sessions (below).

### /craft risk items accepted (Aidan, 2026-11-18)

From [reviews/2026-11-18-risk-generation.md](reviews/2026-11-18-risk-generation.md):
- **A. Date-only deadlines.** The model returns `YYYY-MM-DD` when the brief gives a date but no time, and the app shows "Due Fri, Dec 4" with no time. A deadline in neither shape is dropped (no deadline), not used to reject the plan.
- **B. A reply cut off at the token limit is Error 03** (502 `failed`), not Error 02, because the brief wasn't the problem. Output limit 4,000 tokens.
- **C. Several dates:** the instructions say to use the final submission date as the deadline.

### Claude Code's choices

**Disclosure merged with the M3 line.** (Claude Code; wording approved by Aidan, below) "No account needed. Your plan stays in this browser." repeated "stays in this browser", so brief entry now has one caption line: "To build your plan, your brief is sent to OpenAI. Your plan and progress stay in this browser. No account needed." The first two sentences are Aidan's development copy. Nothing is said about OpenAI's retention or training.

**`responses.create` with `zodTextFormat`, then one `JSON.parse` and one `safeParse`.** (Claude Code) The SDK's `responses.parse` throws on a schema mismatch, which would look like an API failure; parsing in the route keeps "unreadable" and "failed" apart and shows the single parse attempt.

**The model schema has no length, pattern or range rules;** (Claude Code) `toPlanDraft` applies them, so a rule can't be lost to what strict mode supports.

**A plan needs at least one substantive or format requirement;** (Claude Code) a submission reminder alone is unreadable. Steps also need a title and Done when, as in the edit card.

**IDs are `r1…` and `s1…` in order,** (Claude Code) like the sample.

**"Today" is the server's UTC date, with its weekday** ("Wednesday, 2026-11-18"). (Claude Code)

**`<brief>` tags inside the pasted text are removed** (Claude Code) so the brief can't close the delimiters early.

**The student's deadline is accepted by the route but not sent to the model;** (Claude Code) the browser applies it over the plan's, as in M3.

**A stored draft over the limit isn't sent.** (Claude Code) It can only come from M3, which had no limit. Brief entry shows "Your brief is longer than 12,000 characters. Shorten it to build a plan." (development copy) and makes no request, so the server's 413 never shows as Error 03's "not with your brief".

**Character count announcements.** (Claude Code) The visible count is linked to the field with `aria-describedby` (read on focus). A separate polite live region changes only when the brief crosses 10,800 and when it reaches 12,000 (development copy: "Your brief is close to the 12,000-character limit." / "Your brief has reached the 12,000-character limit.").

**Bundle check matches the shape of a key** (Claude Code) (`sk-` followed by 20 or more key characters), not a bare `sk-`, which React's `mask-type` attribute contains. It also fails on `OPENAI_API_KEY` and `api.openai.com`, and prints which rule matched, never the text.

### Settled by Aidan (2026-11-18, after the live checks)

**Model.** Keep `gpt-6.1-terra` as both `OPENAI_MODEL` and the code default (above).

**Disclosure wording.** Keep the merged single line: "To build your plan, your brief is sent to OpenAI. Your plan and progress stay in this browser. No account needed."

**Estimates and step count: no prompt tuning.** Generated estimates for the sample brief (about 6.5 h) are about twice the hand-written plan's 3 h 20 min, and the same brief gives 5 or 6 steps between runs. Logged as expected run-to-run variation, and a point to observe in the M5 sessions.

**"Use a sample brief" is hidden during the M5 evaluation sessions.** Participants get the brief text and paste it, so pasting is tested directly. This deviates from Figma R3 05, which draws the button; it is backed by [/craft scope](reviews/2026-11-17-scope-m3-m4.md) item 8. How (removal or a flag) is decided when M5 starts; nothing changes in M4.

**Building copy.** Keep "This usually takes under a minute." for now. If the Vercel preview runs also stay around 10–15 s, it may change to "This usually takes about 15 seconds." *Closed at the M4 merge (Aidan): keep "This usually takes under a minute."; see M5 below.*

**Three fixes from the live output.**
- **"Done when" uses the criterion as written.** `doneWhenSentence` no longer lowercases the first letter, and the instructions ask the model to start each criterion lowercase unless it begins with a proper noun (such as Turnitin). The sample plan's criteria are stored lowercase to match, so they read as before.
  - (Claude Code, follows from the fix) The working step's "Done when" well shows the criterion on its own as a sentence, so it capitalizes the first letter (`capitalizeFirst`); capitalizing never breaks a proper noun.
- **No full stops at the end of requirement labels.** `toPlanDraft` removes them from labels and short labels, so chips don't end in punctuation. Full stops inside a label stay ("Dec. 4").
- **No step for the final submission.** The instructions say never to create one, because the final submission is already a reminder; a step for an interim submission (a draft for peer feedback) is fine. As a backstop, `toPlanDraft` drops the **last** step only if its title starts with "Submit" (any case), before giving IDs and counting steps, so a plan still needs 1 to 12 steps after the drop; a plan whose only step is a Submit step is unreadable (Error 02). (Aidan, narrowed the same day from "any Submit step" so interim milestones aren't dropped.)

### Open for Aidan

- ~~**Building copy**~~: closed at the M4 merge; kept "This usually takes under a minute." (M5 section).
- ~~**How to hide "Use a sample brief"**~~: decided in M5 (an environment flag).
- (Claude Code) **Seen in one live run before the filter was narrowed:** the reflective portfolio plan had no step for reading peer feedback between the first draft and the final revision. The narrower rule allows that step again; not yet re-run live.

### M6 candidates

- ~~**"Done when" prefix in the step editor.**~~ *Moved to "watch in sessions" (H-06) by Aidan, 2026-11-18; not committed M6 work.* A criterion the student types with a capital in the edit card ("You have…") reads "Done when You have…" on plan review, step complete and home. Idea: show "Done when" as a fixed prefix before the field, so the student writes the rest of the sentence. No UI change in M4.
- **"Today" in UTC.** (Aidan, at the M4 merge) Send the browser's local date with `POST /api/plan`, so a relative due date ("this Friday") resolves correctly for a US evening request, when the server's UTC date is already tomorrow.

## M5 (2026-11-18)

### Closed from M4 (Aidan, at the M4 merge)

**Building copy stays "This usually takes under a minute."** Vercel preview builds took 14.9–18.1 s, so "under a minute" holds reliably; "about 15 seconds" would undersell the slower runs.

### From Aidan's M5 prompt

**"Use a sample brief" is behind `NEXT_PUBLIC_SHOW_SAMPLE_BRIEF`.** (Aidan) The button shows only when the variable is exactly `"true"`; unset or anything else hides it, so it is hidden on Vercel by default during the sessions and Aidan sets it for the case-study demo. Not a secret, so `NEXT_PUBLIC_` is fine. Next.js writes the value into the browser code at build time, so changing it needs a redeploy. The sample brief text stays in the code for tests. Read in `src/lib/flags.ts`. This implements the M4 decision "hidden during the M5 evaluation sessions" (deviates from Figma R3 05, backed by /craft scope item 8).

**One event, `first_step_started`.** (Aidan) Sent when step 1 of a plan is opened for the first time, with `minutesSincePlanCreated` (`<2`, `2–5`, `5–15`, `>15`) and `stepCount`. Nothing else: no text, no ids, no IP stored. Once per plan: `firstStepStartedAt` on the assignment. Never sent from development or tests.
- (Claude Code) `createPlan` and `startPlan` now carry `at`, and `createPlan` records `planCreatedAt`, because the bucket needs the plan's creation time. Both fields are optional on `Assignment`, so data saved before M5 still loads as version 1. Those plans never send the event.
- (Claude Code) Buckets are half-open: under 2, 2 to under 5, 5 to under 15, 15 or more. The primary measure ("within 15 minutes") is the first three.
- (Claude Code) The event is built from the assignment as it was **before** `startPlan`, in the Start step 1 handler (`PlanReviewScreen`). Plan review is the only way to open step 1 for the first time; started-plan routes redirect a plan in review home.

**Where it goes: `POST /api/event`, not Vercel Web Analytics.** (Aidan: the project is on Hobby; Claude Code checked the docs on 2026-11-18: "Custom Events are available on Enterprise and Pro plans".) The route accepts only this event name and the two fields (strict zod schema, extra fields → 400), at most 256 characters (413), rate limited to 10 per IP per 10 minutes and 300 per hour (429). It logs one line (`[api/event] event=first_step_started stepCount=6 bucket=2–5 env=production`) and stores nothing. No `@vercel/analytics`, no page-view tracking, no third-party tracker.
- (Claude Code) The rate limiter became a small factory in `rate-limit.ts` so plans and events keep separate counts; the plan limits are unchanged.
- (Claude Code) The browser sends with `fetch(..., { keepalive: true })` and ignores failures; no retry.
- **`env=` tag on the log line.** (Aidan, 2026-11-18, before the push) The line ends with `env=${process.env.VERCEL_ENV ?? "unknown"}`: `production`, `preview` or `development` on Vercel, `unknown` locally. So preview and test traffic can be filtered out of the production numbers.
- Known limit: **Hobby keeps runtime logs for 1 hour**, so the numbers must be copied within the hour (measurement.md, "Retention"). A real post-launch deployment would use durable collection (Web Analytics custom events on Pro, or a log drain), still without a database. That is not built for M5.

**Disclosure line approved.** (Aidan, 2026-11-18) Brief entry's caption ends with "Momentum counts anonymous usage, such as when a plan’s first step is started." The rest of the line is unchanged.

**Measure definition.** (Aidan's measures, written up by Claude Code in [evidence/measurement.md](evidence/measurement.md)) Primary: the share of created plans whose step 1 is opened in the same browser within 15 minutes ("starts within the first visit"); denominator from `[api/plan] 200 ok` log lines. Complementary: paused steps later resumed (observed in sessions only; not instrumented). "Observed in sessions" and "gathered after launch" are kept apart.

**No fixes in M5.** (Aidan) Heuristic and accessibility findings become M6 candidates; product behavior changes only with Aidan's approval.

**Heuristic evaluation reviewed.** (Aidan, 2026-11-18) H-01 confirmed as severity 3. H-04, H-07 and the severity-1 items are "watch in sessions", not committed M6 work.

**Session guide.** (Aidan, 2026-11-18) The guide is in the repo as [evidence/session-guide.md](evidence/session-guide.md), with its observation sheet and browser-reset steps.

### Open for Aidan

- None for M5 beyond running the sessions, the VoiceOver script and the preview check. Severities other than H-01 stay "(proposed)" until after the sessions.

### M6 candidates (accepted by Aidan, 2026-11-18, in this order)

From the heuristic evaluation (H-), the accessibility pass (WCAG numbers) and the two reviews ([risk](reviews/2026-11-18-risk-pause-saving.md), [signal](reviews/2026-11-18-signal.md)):
1. **Keep tabs in step** (H-01, severity 3; risk 1 and 13). Listen for the `storage` event and replace in-memory data with what another tab wrote. Verified: a second tab erased a saved note and showed "Saved in this browser".
2. **Text field border contrast** (WCAG 1.4.11; H-08). A darker resting border for fields (the existing 1.48:1 item).
3. **Save status announcement** (WCAG 4.1.3; H-09, signal 3 and 9). A mounted live region; the failed state with an icon; one line at 600 px.
4. **Paste over 12,000 characters** (H-02; signal 4). Say that text was cut.
5. **Rate-limit message** (H-03; signal 2). Its own Error 03 line with an honest wait.
6. **"Today" in UTC** (H-05; listed under M4).
7. **Undo names what it undoes** (signal 5).
8. **"Progress saved" announced** (WCAG 4.1.3; signal 6): only if the VoiceOver check shows it isn't.

**Watch in sessions** (not committed M6 work; promoted only if participants run into them):
- H-04 estimates about twice the sample's;
- H-07 Start step 1 below the fold;
- severity 1: H-06 "Done when You…" (moved here from M4's M6 candidates), H-10 Undo cleared after moving on, H-11 clearing the note deletes it, H-12 Escape in edit cards, H-13 rail Tab order, H-14 visible "Finish editing to start." (signal 7), H-15 "this browser on this computer" copy (risk 2), H-16 silent fresh start.

## M6 (2026-11-18)

Fixes from the evaluation, in the order Aidan accepted (M5, "M6 candidates"), plus items 9 and 10 from Aidan's walkthrough. Each item is one commit on `feat/m6-fixes`. No "Watch in sessions" item was moved in.

### From Aidan's M6 prompt

1. **Tabs stay in step** (H-01). (Aidan) `MomentumProvider` listens for the `storage` event on `momentum:v1` and replaces its data with what another tab wrote, through the same `load()`. Screens whose route no longer fits follow their existing redirects; no new message.
   - (Claude Code) If the other tab's value is unreadable, `load()` backs it up as on first load. This tab keeps what's on screen, stops writing and shows "Couldn’t save in this browser". If the key was removed, the data becomes empty, as on a first visit.
   - (Claude Code) "Progress saved" isn't cleared by another tab's write.
2. **Field border 3:1** (WCAG 1.4.11, H-08). (Aidan) `border/input` is now **#949494**, the lightest neutral that reaches 3:1: **3.03:1** on white and on `surface/page` (#ffffff); #959595 is 2.995:1. `border/default` is unchanged.
   - (Claude Code) `border/input` was also used by secondary buttons, the estimate stepper, the upcoming-step badge, the dashed hidden-note row and the review tick. They moved to a new token, `border/rule`, at the old #d4d4d4 (DESIGN.md already called it "Rule"), so their look is unchanged.
   - **`border/rule` stays #d4d4d4** for secondary buttons, the estimate stepper, the step-number badge and the dashed note row. They're identified by their labels, so their borders don't need 3:1. (Aidan, 2026-11-18)
3. **Save status in one mounted live region** (WCAG 4.1.3, H-09). (Aidan) An empty `role="status"` paragraph is always in the top bar, and only its text changes, so writes that keep the same status announce nothing.
   - (Claude Code) The failed state uses the alert icon (`AlertIcon`, already used by the error cards) and Ink text. Saved keeps the check icon and Faint pencil.
   - **Wording kept in full: "Saved in this browser" and "Couldn’t save in this browser".** (Aidan, 2026-11-18) Both fit on one line at every width checked, from 1280 down to 375 px (`whitespace-nowrap`).
4. **A long paste is kept** (H-02). (Aidan) `maxLength` is removed, and the existing over-limit message blocks the build.
   - (Claude Code) The message now shows as soon as the brief is over 12,000 characters, not only after Break it down. The live region says it once, in the same words.
   - (Claude Code) The counter, the over-limit check and the server's 413 now share one rule, `briefLength()`: the trimmed length. Before, the counter counted surrounding whitespace and the other two didn't.
5. **Rate-limit line on Error 03** (H-03). (Aidan) A 429 becomes `rateLimited` in `plan-source`, and Error 03 keeps its heading and Try again (no automatic retry). Body: **"Too many plans were built from this network. Try again in about 10 minutes."** (Aidan, 2026-11-18) The 5-per-10-minutes limit is the one people hit, and "Try again later." would bring back the vague wait H-03 was about. The hourly cap of 100 can still make a wait longer (known limitation).
6. **The browser's local date** (H-05). (Aidan) `POST /api/plan` carries `today: "YYYY-MM-DD"`. zod accepts only a real ISO date; a missing or malformed value becomes undefined, not a 400. `resolveToday()` uses the browser's date when it's within one day of the server's UTC date, and the server's UTC date otherwise. `buildUserMessage` takes the date as a string.
   - **Disclosure:** this adds one field to what's sent with the brief: the student's calendar date. It doesn't reveal the brief or identify anyone. Nothing is logged or stored. No copy change (Aidan's prompt).
7. **Undo is described** (signal 5). (Aidan) Undo keeps its label and gets `aria-describedby` pointing to a visible line, "Step N is marked done.", on step complete (new) and the final check (the existing line, now linked).
   - (Claude Code) On step complete, "Step N will be here when you come back." stays, and both captions share one footer block (/craft compose C1).
8. **"Progress saved" announced:** not changed (see Open for Aidan).
9. **A way back from a done step** (H-17, severity 3, confirmed by Aidan; found in his walkthrough). (Aidan)
   - The rail lists done steps, the step on screen and the step in progress.
   - The done view gets one Secondary action, **"Back to step N"**, or **"Back to home"** when no step is in progress.
   - The wordmark links to `/`, named **"Momentum, home"**.
   - (Claude Code) `aria-current="step"` is now on the step on screen even when it's done; before, a done step on screen had none. The in-progress row looks current (dot, medium weight), and when it isn't the step on screen a screen reader hears "In progress:" before it, matching "Done:".
   - **Wording approved: "Back to step N", "Back to home", "Momentum, home".** (Aidan, 2026-11-18)
10. **Side-panel line once a plan has started.** (Aidan) In review: "To change steps, edit the plan from the plan review." (unchanged). Active or completed: **"Steps can’t be changed after you start."** (wording approved: Aidan, 2026-11-18). Editing after start is still not built.

### Claude Code's other changes

- **A test race fixed:** the Error 02 and 03 tests checked heading focus straight after `findByRole`, before the effect that moves focus. It failed about 1 run in 8 with a server running alongside. The tests now wait for focus (`67533f4`). No product change.
- The M5 baseline was 221 tests, not 220: M5's `env=` test added one after the count was written down.

### Open for Aidan

- **Item 8 waits for VoiceOver script step 7. If 'Progress saved' isn't heard, mount its status region before the text appears, as in item 3.** (Aidan's line, corrected by Aidan on 2026-11-18 from "step 4".)
- **Preview checks after the push:** run by Claude Code with Playwright on 2026-11-18 at Aidan's request, and all five passed (status.md, M6, "Vercel preview checks"). They were scripted, not by hand:
  - two tabs (item 1);
  - a 13,000-character paste (item 4);
  - the sixth build in 10 minutes from one network (item 5);
  - on step 3, open done step 1 from the rail, then "Back to step 3" (item 9);
  - after 7 PM local time, build from a brief due "this Friday" and confirm plan review shows the correct Friday (item 6).
- Running the sessions and the VoiceOver script (unchanged from M5).

### M7 candidates

From the [compose and responsive review](reviews/2026-11-18-compose-responsive-m6.md) and M6 work. None is built.
- **C6:** on a done step, the rail doesn't visually mark which done step is on screen; only "Step N of M" and `aria-current` do.
- **C7:** Error 03 for the rate limit keeps Try again as the primary action, though it will fail for a while.
- **C8:** over the limit, the brief doesn't show where character 12,000 falls.
- **R1:** below about 420 px, the top bar's assignment context shrinks to nothing; hide it below a set width instead.
- **R2 (watch in sessions):** at 600×800, "Back to step N" is below the fold (the rail's step link is visible).
- **Save status across a route change:** each screen renders its own top bar. A failure that happens as the student moves screens (for example Mark complete → step complete) arrives already filled on the new screen, and screen readers often skip that, as with "Progress saved". Moving the top bar into the layout would fix both. Check with VoiceOver first.
- **Estimate stepper +/− boundary** (WCAG 1.4.11): check whether the stepper's − and + buttons need a visible 3:1 boundary of their own. (Aidan, 2026-11-18)
- **Deadline calendar button focus:** Chrome's calendar button inside the deadline field shows Chrome's blue ring, not the token ring or `border/strong`. It's visible, so 2.4.7 passes, but it's inconsistent ([accessibility.md](evidence/accessibility.md), "Keyboard pass, M6").

## M7: several assignments (Aidan, 2026-11-18)

**Aidan's product decision, not participant feedback.** A student can keep several assignments at once, see them on a prioritized home list (M7b) and upload a week's briefs in one go (M7c). This reverses the professor's recommendation to "defer … multiple-assignment management" ([MOMENTUM_CONTEXT.md](MOMENTUM_CONTEXT.md)) and the [product.md](product.md) Out list, which now lists it as In. No session or participant asked for it. Dashboards, calendars, time analytics and adaptive scheduling stay Out.

### M7a: data and ordering (logic only, no screen changes)

- **No storage migration.** `MomentumData` already held `assignments: Assignment[]` and `activeAssignmentId` from M2, and `createPlan` already appended. So `version: 1` and the `momentum:v1` key stay, and no required field was added. Tests pin that today's data (one completed, one active, a `briefDraft`) loads unchanged and that four assignments in mixed states round-trip.
- **`openAssignment`** sets `activeAssignmentId` to an existing assignment and never changes an assignment. An unknown id or the one already open returns the same object, so nothing is written. `startNewAssignment` is unchanged.
- **Home-list order** (`src/lib/priority.ts`), deadline first:
  1. Assignments with a valid deadline before those without.
  2. Earliest deadline first. A date-only deadline counts as 23:59 that day. An invalid deadline counts as none. A passed deadline isn't special-cased: it is simply earliest.
  3. Same deadline: more remaining minutes first. A step in progress counts in full, because Momentum doesn't track partial work.
  4. No deadline: earlier `planCreatedAt` first; plans from before M5 (no `planCreatedAt`) last.
  5. Anything still tied keeps its stored order.
  Finished assignments are listed newest `completedAt` first.
- **Why not a slack or "start-by" score** (deadline minus remaining work): the M7 plan recommends deadline-first. Claude Code's reasoning: a slack score would rest on the model's estimates, which M5 found run about twice the sample's (H-04). A list that reorders as estimates change is harder to trust and explain than "due soonest first". Remaining minutes are only used to break a tie. Aidan may revisit.
- **One deadline parser:** `formatDeadline`'s regex and validity rules are now `parseDeadline` in `src/lib/format.ts`, used by both, so the list and the label can't disagree about what is a valid date.

### Known limit (for M7b)

Which assignment is open is one shared value in storage. Two tabs on different assignments switch each other: when one opens an assignment, the other tab's `storage` listener loads that choice. M7b must decide how to handle this.

### M7b: the home list (2026-11-18)

- **Routes.** "/" shows brief entry only on first run (no assignments at all); otherwise the home list. It no longer redirects a plan in review to `/plan`: such a plan is on the list as "Ready to review". Brief entry for another assignment is `/new` (the existing `BriefFlow`), with "Back to your assignments", which saves the draft before leaving (a save still waiting for typing to pause would otherwise be dropped). A created plan goes to `/plan` explicitly. `/plan`, `/step/[n]`, `/final` and `/review` still act on the open assignment; every list button calls `openAssignment` first, then navigates.
- **"/" decides once.** `HomeRoute` picks brief entry or the list when "/" opens, so a plan built from first-run entry goes straight to `/plan` without the list flashing up in between.
- **Up next is the top of the priority order** (Aidan, 2026-11-18). It is today's home card (paused, next step, final check next), extracted as `UpNextCard`, with "· About X of steps left" on its progress line. A plan in review gets the title, meta, "Plan ready · N steps · About X" and "Review plan". The rest are rows under "After that" and "No deadline". Ordering stays only in `priority.ts`; the screen splits groups with `filter`, which keeps that order.
- **The completion line replaces the completed home.** After Finish review, the list shows once: "<Title>: all steps done. Your plan and final check are kept in this browser. Submission happens in Turnitin. Momentum doesn’t submit or track it." It is in memory (`justFinishedId`, like `progressSaved`), shows only after a confirmed write, and a reload or the next change clears it.
- **Due date passed** is the meta line's only change for a deadline before now: same color, no icon, no warning words.
- **Row buttons** have an `aria-label` that starts with the visible word and adds the title ("Open Reading response"), so a list of buttons isn't five identical "Open"s (WCAG 2.5.3, label in name). A visually hidden span was tried first; its leading space was dropped from the accessible name because the button is a flex container.
- **Headings:** h1 "Your assignments", h2 per group (Label style), h3 per assignment title (the Up next card's title moved from h2 to h3), h4 for the step title inside the card.
- **`startNewAssignment` removed.** "Add assignments" goes to `/new`; nothing else needed to clear the open assignment.
- **Two tabs.** The storage handler takes the other tab's data but keeps this tab's `activeAssignmentId` while that assignment still exists (otherwise it takes the incoming one). Writes are unchanged. **Remaining limit:** the open assignment is still one stored value, so after a reload whichever tab wrote last decides which assignment opens.
- **Final-check state of Up next** shows no time left (it would read "About 0 min of steps left").
- **Empty current list:** "Nothing in progress." with a Primary "Add assignments". The header's Secondary "Add assignments" is hidden in that state, so there is only one (Aidan, 2026-11-18, after review).

### M7c: a week's briefs at once (2026-11-18)

- **Drafts.** `briefDrafts: BriefDraftItem[]` (`{ id, text, deadline }`) replaces `briefDraft` for new writes; still `version: 1` under `momentum:v1`. `readBriefDrafts` (`src/lib/brief-drafts.ts`) reads either shape (an old `briefDraft` is one item with id `brief-1`) and nothing is rewritten on load. The first `setBriefDrafts` that changes something stores `briefDrafts` and drops `briefDraft`; an unchanged list writes nothing, in either shape. Only briefs with text or a deadline are stored, so a first visit still writes nothing.
- **`addPlanFromDraft`** appends the plan in `review`, built by the same `newAssignment` code as `createPlan`, removes only its own draft and leaves `activeAssignmentId` alone. `createPlan` (one brief) now clears every draft, as it cleared `briefDraft` before.
- **One brief looks as it always has.** With one brief there is no card, no "Brief 1" heading and the labels stay "Assignment brief" and "Deadline", so the single-brief path and its tests are unchanged. Cards ("Brief N", Remove, "Deadline for brief N") appear at two or more. The Figma draft M7-2 may show a single card; this follows the prompt's "existing BriefFlow tests still pass unchanged".
- **Removing.** A brief with text shows "Brief N removed." with Undo in its place, for this visit only. An empty one just goes. Focus goes to the heading of the card that took its place, or to Add another brief (also when one brief is left, since it has no heading).
- **The queue** (`src/lib/build-queue.tsx`) sits in `providers.tsx` above every screen, in memory only. One request at a time, in card order, through the same `PlanSource` (so `?simulate=` and test stubs work). A plan is "ready" only after a confirmed write; if the write fails the item is `notSaved` ("<title> · built, but not saved in this browser", development copy) and the plan stays in memory for the visit. Unreadable and failed briefs keep their drafts and the queue goes on; a 429 stops it, puts this brief and the later ones back to waiting, and shows the M6 line. No automatic retry. Unmounting the provider aborts the request that is out.
- **Brief N** is the card's position on screen when the upload started, empty cards included, so the row names match what the student saw.
- **Building your plans** is an h1 in the Heading L style (like the single Building screen); the prompt said "h2-level", read as the type style, since it is the page's only top heading.
- **Edit brief** (unreadable rows) shows only once nothing is being built, so a brief can't be edited while another request is out and the queue's copy can't be written back over it. Until then the row says "Your brief is kept. Edit it and try again." without the button.
- **After Stop or a 429** the rows of briefs not sent say "Brief N · not built yet" (development copy), not "waiting", since nothing is waiting. While running they say "waiting". After Stop is pressed, the Stop button becomes the caption "Stopping after this one." (development copy).
- **Leaving and coming back.** Go to your assignments keeps the queue running. The list shows "Building plans: X of N ready" as a link to `/new` while it runs. After a run has ended, opening `/new` again starts fresh brief entry with the briefs not built; the results show only until the student leaves.
- **From first run**, building two or more moves to `/new` (the queue's route). "/" shows the list rather than brief entry while a queue runs, even before the first plan is ready.
- **Rate limit:** `PER_IP_LIMIT` 5 → 12 per 10 minutes; global 100 an hour and the event limits unchanged. The OpenAI monthly budget is still the hard cap; a full upload of 8 briefs costs about 8 requests (Aidan measured 15–18 s each). See deploy.md.
- **Live region.** Each change of a brief's state is added as a new line to one polite status region (the last five are kept), so each change is heard once and nothing ticks.

### M7c risk review fixes (Aidan, 2026-11-19)

From [reviews/2026-11-19-risk-weekly-upload.md](reviews/2026-11-19-risk-weekly-upload.md). Fixed in this order, one commit and test each: 3, 1, 2, 5a, 7, 9, 11, 8.
- **3:** a removed brief that can still be undone counts toward the 8 (Aidan's version, instead of "Remove another brief to undo"). Add another brief hides at 8 including it, so Undo always fits and the list never passes 8.
- **1:** the home list shows "N briefs not built yet" (link to `/new`) whenever drafts with text remain and no queue is running. A brief with only a deadline isn't counted.
- **2:** after a run that left briefs unbuilt, the building screen offers "Back to your briefs".
- **5a:** before each request the queue checks the brief is still a stored draft. If it's gone **and** a plan from the same brief text is stored, the row says "Brief N · built in another tab" and nothing is sent. If the draft is gone without such a plan (removed in another tab), it is still built, since "built in another tab" wouldn't be true. Remaining limit: two queues started at the same moment can still build one brief twice.
- **7:** when a plan can't be saved, the queue stops after that brief, the rest stay drafts, and the top bar shows the existing failed save status.
- **9:** Stop after this one focuses Go to your assignments (now one element in both states); Try again focuses its row; when the run ends with focus on Stop, it goes to Go to your assignments.
- **11:** while others are building, an unreadable row says "Your brief is kept. You can edit it once the others are done."
- **8:** every brief with text removed this visit collects into one notice ("2 briefs removed.") whose Undo restores them all. An empty brief removed in between can shift a restored brief's position by one; its text is always kept.
- **Wording approved:** "Brief N · not built yet · your brief is kept", "Stopping after the plan being built now.", "<title> · built, but couldn't be saved in this browser. It's gone if you reload.", and the new lines above.
- **For M7d (session guide):** the per-IP limit (12 per 10 minutes) is shared by everyone on one network. Run participant sessions on networks that don't share one IP, or space them apart, so a session doesn't hit the 429 by accident.

### M8 candidates (deferred from the M7c risk review, Aidan 2026-11-19)

- **Risk 4, both draft shapes stored at once** (S2 × P1 × D3 = 6). Only during a deploy, with a tab still on the M7b build: it writes `briefDraft` while `briefDrafts` exists, `readBriefDrafts` prefers `briefDrafts`, and the next write drops the newer single draft unseen. Proposed fix: when both exist and the `briefDraft` text isn't in the list, read it as one more brief.
- **Risk 6, a reload mid-queue** (S1 × P2 × D2 = 4). The request that was out still runs on the server, counts against the limit, and its plan is thrown away. Nothing is lost (the rest are drafts), and risk 1's line now shows what's left. A "leave this page?" prompt was not recommended: the browser's text is generic and it adds friction.
- **Risk 10, one IP can use more of the shared hourly limit** (S2 × P1 × D2 = 4). At 12 per 10 minutes one address can use 72 of the 100 an hour (30 at 5), and each Vercel instance counts separately. The OpenAI monthly budget stays the hard cap: check it and its alert before the sessions, and look for 429s in the `[api/plan]` log lines after each session day.
- **Risk 12, brief numbers change after Edit brief** (S1 × P2 × D1 = 2). Entry renumbers the briefs left, so "Brief 2" on the building screen can become "Brief 1". Revisit only if sessions show confusion, for example by naming rows with the brief's first words.

### M7d: session guide (2026-11-19)

- **Measures unchanged.** The primary measure (n of N built a plan and began step 1 without help) and the complementary one (n of N resumed the right step after the pause without help) are as they were.
- **Task-level wording changed, because the product changed:**
  - Task 2's return now asks the participant to find the assignment to work on next on the list.
  - Task 3's end point is the list with the completion line, since the completed home is gone.
- **Task 4 (weekly upload)** has its own success line (all three added and built without help). It isn't a new study measure. It observes whether participants understand the order and the time-left estimate, plus one question: "What did 'About 2 h of steps left' mean to you?"
- **The three Task 4 briefs were drafted by Claude Code.** They are not from any course. Aidan checks or replaces them before the first session.

### M8 candidates from the M7 compose and responsive review (2026-11-19)

From [reviews/2026-11-19-compose-responsive-m7.md](reviews/2026-11-19-compose-responsive-m7.md). Fixed in M7d: C1 (list header order below 600 px), R1 (entry disclosure full width below 600 px), R2 (Up next card padding below 600 px).
- **C5.** The list's status links ("1 brief not built yet", "Building plans: X of N ready") use the same style and place as "Back to your assignments" on `/new`, so they may read as navigation. Possible change: show them as a status line with the link in the text.
- **C6.** On a finished run with an unreadable brief, "Edit brief" and "Back to your briefs" do the same thing side by side. Possible change: drop the row's Edit brief once Back to your briefs shows.
- **C7.** Brief cards use 8-row text areas, so 8 briefs make a very long page. Possible change: 5 rows in cards, or watch in sessions.
- **R3.** At 375 px, meta lines break inside a date ("Mon, Nov 16, / 5:00 PM"). Possible change: keep the date on one line. Phones aren't a target.

## M7 summary for the case study (2026-11-19)

- **What changed.** Momentum went from one assignment at a time to several:
  - a home list ordered soonest deadline first, with an approximate time left for each (M7a, M7b);
  - a weekly upload of up to 8 briefs, built into plans one at a time (M7c);
  - review, compose, responsive and accessibility passes on those screens, and a session task for them (M7d).
- **Why.** Aidan's product decision (2026-11-18): "it's Sunday and you want to upload all your assignments for the week". It wasn't participant feedback; no sessions had run. It reverses the professor's advice to defer multiple-assignment management, and the case study should say so.
- **Trade-offs:**
  - **Deadline first, not a "start-by" score.** It's easy to explain in one sentence. A slack score would rest on the model's estimates, which run long (H-04). Time left only breaks ties.
  - **Time left is approximate.** It is the sum of the estimates of steps not done; a step in progress counts in full, because Momentum doesn't track partial work. It is labelled "About …" and never counts down.
  - **One request per brief, one at a time.** A bad brief or a cut-off response fails only that brief, and each plan is saved as it arrives. It is slower (about 15–18 s per plan on the model in use, as Aidan measured).
  - **Per-IP limit raised from 5 to 12 per 10 minutes**, so a full upload fits. The hourly global limit stays at 100, and the OpenAI monthly budget stays the hard cap. The limit is shared by everyone on one network.
- **Known limits:**
  - A reload or closed tab stops a queue: built plans are kept, the rest stay drafts, and the list says how many weren't built.
  - Two tabs: each tab keeps its own open assignment, but after a reload the last tab to write decides which one opens. A queue skips a brief another tab already built, but two queues started at the same moment can still build one brief twice.
  - The model's estimates run long (H-04), so "About … of steps left" can overstate the work.
  - Not yet checked with participants or VoiceOver.
