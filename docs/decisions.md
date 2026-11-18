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

**Building copy.** Keep "This usually takes under a minute." for now. If the Vercel preview runs also stay around 10–15 s, it may change to "This usually takes about 15 seconds."

**Three fixes from the live output.**
- **"Done when" uses the criterion as written.** `doneWhenSentence` no longer lowercases the first letter, and the instructions ask the model to start each criterion lowercase unless it begins with a proper noun (such as Turnitin). The sample plan's criteria are stored lowercase to match, so they read as before.
  - (Claude Code, follows from the fix) The working step's "Done when" well shows the criterion on its own as a sentence, so it capitalizes the first letter (`capitalizeFirst`); capitalizing never breaks a proper noun.
- **No full stops at the end of requirement labels.** `toPlanDraft` removes them from labels and short labels, so chips don't end in punctuation. Full stops inside a label stay ("Dec. 4").
- **No step for submitting.** The instructions say never to create one, because submission is already a reminder. As a backstop, `toPlanDraft` drops any step whose title starts with "Submit" (any case) before giving IDs and counting steps, so a plan still needs 1 to 12 steps after the drop; a plan of only Submit steps is unreadable (Error 02).

### Open for Aidan

- **Building copy:** revisit after the preview timings (above).
- **How to hide "Use a sample brief"** for M5: at the start of M5.
- (Claude Code) **Side effects of the fixes, seen in one live run:** the reflective portfolio plan no longer has a step for reading peer feedback between the first draft and the final revision (the earlier run's "Submit the draft and review feedback" step); its revision step still exists. And a criterion that the student types with a capital in the edit card ("You have…") now reads "Done when You have…" on plan review, step complete and home.
