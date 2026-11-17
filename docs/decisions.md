# Decisions

Each entry says who decided. "Claude" means Claude Code chose it while implementing and it awaits Aidan's review.

## M1 (2026-11-17)

**Tailwind CSS + shadcn/ui + Radix, restyled to Momentum tokens.** (Aidan) Default shadcn styling is not used. Unused shadcn variables are removed. M2 adds Dialog, Checkbox and Tabs as thin Radix wrappers in `src/components/ui/`, styled with tokens.

**Keep Core 01's short "From your brief" line.** (Aidan) Collapsed shows the short labels joined with " · "; expanded shows every requirement as a chip.

**Add `Step.intro?: string`.** (Claude) Core 01 shows a context line under the step title; the handoff's data model has no field for it.

**Add `Requirement.shortLabel?: string`.** (Claude) The collapsed "From your brief" line needs short forms like "APA 7th". Requirements without a shortLabel (the sample's substantive one) are left out of that line and still appear as chips when expanded.

**Display-state helper for the M1 preview.** (Claude) *Superseded in M2:* steps now have real stored status and the helper is gone.

**`cn()` is plain clsx, no tailwind-merge.** (Claude) tailwind-merge reads custom `text-*` type styles as colors and drops one of them. The shadcn CLI's own `cn` package was replaced for the same reason: it is opaque.

**Icons are inline SVG, not lucide-react.** (Claude) Six small icons; no dependency.

**Step title uses Heading L.** (Claude) *Superseded in M2 by Display, below.*

**`export const instant = false` on the step route.** (Claude) *Superseded in M2:* removed with Cache Components.

## M2 (2026-11-17)

### Platform

**Disable Cache Components.** (Aidan) Removed `cacheComponents` and `partialPrefetching` from `next.config.ts` and the `instant = false` export from the step route. Reason: with Cache Components on, the first request to an invalid step returned HTTP 200 with the Not found page (later requests returned 404). Verified on `npm run build && npm start` with curl: `/step/abc`, `/step/0`, `/step/03`, `/step/-1` and `/step/1.5` each return 404 on the first request (also `/step/abc/done`).
Known limit: once plans live in local storage, the server can't know how many steps a plan has. A well-formed number past the end of the stored plan (e.g. `/step/9` on a six-step plan) shows the Not found content from the client and returns HTTP 200. Plans are not capped at six steps to get around this.

**The store renders its children on the server; screens wait inside `<WhenLoaded>`.** (Claude) A first version showed a loading state *instead of* the page until storage was read. That hid the page's `notFound()` from the server render and every malformed URL returned 200 again. Now the provider always renders children, and each page wraps its screen in `<WhenLoaded>`, which shows the neutral loading state until the data is known.

### Data and storage

**Add `Step.pauseDraft?: string`.** (Aidan, from the MOMENTUM_CONTEXT recommendation) Unsaved text typed in the pause dialog, kept apart from `note` so a refresh doesn't lose it. Finish for now clears it.

**Add `Step.completedSummary?: string`.** (Aidan) The line under "Step N done." (Core 09). Omitted when missing.

**Storage rule.** (Aidan's rule, implemented by Claude) One key, `momentum:v1`. If the stored text can't be parsed or has an unknown version, it is copied to `momentum:v1:unreadable` before anything else, then the app starts fresh. If storage can't be read, or the backup copy fails, the app works in memory and makes no writes for the rest of the session, so unreadable data is never overwritten. The top bar then shows "Couldn’t save in this browser".

**First run seeds the sample assignment.** (Aidan) With nothing stored, the app saves a copy of the sample assignment (every step upcoming) and shows home. This is sample data until M3 builds brief entry and plan review.

**"Progress saved" lives in memory only.** (Aidan) Shown on home only right after a Finish for now whose write succeeded; gone after a reload or the next change.

### Step rules the handoff doesn't spell out

**Opening steps and undo.** (Claude)
- A done step opened from a URL stays done and shows without Mark complete, Pause for later or the timer ("You marked this step done.").
- Opening any step that isn't done, other than the step `lastUndo` refers to, clears `lastUndo`. Re-viewing the step you just completed keeps undo available.
- If more than one step is in progress (possible by opening steps from URLs), home resumes the lowest-numbered one.

**Mark complete goes to the final check when it finishes the plan.** (Claude) The handoff says "after step 6, go to the final check". The build goes to `/final` whenever the completed step was the last one not done, and to `/step/n/done` otherwise. Step complete's "Next up" is the first step not done after n, then from the start.

**Home when every step is done but the review isn't finished.** (Claude, no frame) Home shows the assignment card with "Next up · Final check" and "Go to the final check". The heading for the between-steps state is "Your next step" (development copy: no Core 10 frame was in the reference set).

### Screens

**Undo from the final check.** (Aidan) A footer row matching Core 09: "Step 6 is marked done." with a tertiary Undo, shown while `lastUndo` is set and the review isn't finished. It returns to that step in progress. Not drawn in Figma at the time of the prompt; a reference screenshot, `docs/reference/figma/a1-final-check-undo.png`, was added during M2 and the build matches it.

**Start a new assignment creates a fresh copy of the sample plan.** (Aidan) The completed record stays in `assignments`. In M3 this becomes "open brief entry" (`// M3` in `reducer.ts` and `HomeScreen.tsx`).

**Review assignment (`/review`) has no Figma frame.** (Aidan) Built from existing components: assignment header, the plan list (Panel 01 rows) with each step's note in the Return note Static style, then the final checklist with ticks shown read-only. Back link returns home.

**Side panel requirement chips show the full labels.** (Claude, following the prompt and handoff R3 03 "requirement chips include the substantive items") Figma Panel 02 shows short chips without the substantive requirement ("1,500 words (±10%)", "Submit via Turnitin", ...). Aidan to confirm.

**Rail done steps are struck through.** (Claude, handoff wins) The handoff says "Done (check, struck through)"; the Figma frames show them plain tertiary.

**Text fields show focus with `border/strong`, not the ring.** (Claude) Handoff: "border/strong: Focused or active input", and Core 03 shows the typed state with a dark 1px border. Buttons, links, tabs and checkboxes keep the token ring.

**Focus moves to the h1 when a screen opens.** (Claude) So route changes are announced. A side effect: on the working step the next Tab goes to Mark complete, then wraps to the rail.

**Pause dialog opens with focus in the note field.** (Claude) Radix would focus the close button first.

**Step title uses Display (32/40).** (Aidan) Figma's working-step title is 40px tall.

**Sample copy from Figma.** (Aidan) The brief (Setup 01, Panel 02) and the intros and What to do for steps 1 (Setup 06), 4 (Core 11) and 6 (Core 12) use the Figma copy. Steps 2 and 5 keep development copy. Each piece is labeled in `sample-assignment.ts`.
