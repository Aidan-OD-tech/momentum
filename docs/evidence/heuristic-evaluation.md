# Heuristic evaluation (Nielsen's 10)

**Expert review drafted by Claude Code on 2026-11-18; reviewed and edited by Aidan.**

**Reviewed by Aidan: yes** (2026-11-18)

> Aidan reviewed this draft on 2026-11-18. He confirmed H-01 as severity 3, accepted the M6 candidates (order in [decisions.md](../decisions.md), M5), and set H-04, H-07 and the severity-1 items to "watch in sessions". The other severities are as Claude Code proposed them; "(proposed)" marks those.

## Method

- **Build:**
  - the M5 branch `feat/m5-evaluation`, as a production build (`npm run build && npm start`) in Chrome at 1280×800 and 600×800;
  - the deployed M4 build (https://momentum-five-xi.vercel.app) is the same apart from the M5 changes: the sample-brief flag and the event.
- **Plans:**
  - the browser runs answered `/api/plan` with the hand-written sample plan, so the screens are repeatable;
  - generated plans were reviewed through the M4 live checks ([generation-checks.md](generation-checks.md)).
- **Screens** (screenshots `docs/evidence/screenshots/m5-<screen>-<width>.png`):
  - brief entry (`brief-entry`);
  - building (`building`) and Errors 01–03 (`error-01`, `error-02`, `error-03`);
  - plan review and editing (`plan-review`, `plan-review-edit`);
  - a working step (`working-step`);
  - the pause dialog (`pause-dialog`);
  - home after a pause (`home-after-pause`);
  - step complete with Undo (`step-complete`);
  - the final check (`final-check`);
  - the completed home (`completed-home`).
- **Severity (Nielsen):**
  - 0: not a usability problem;
  - 1: cosmetic, fix if time allows;
  - 2: minor, low priority;
  - 3: major, high priority;
  - 4: catastrophe, fix before release.
- **Inputs:** [/craft risk](../reviews/2026-11-18-risk-pause-saving.md) and [/craft signal](../reviews/2026-11-18-signal.md) from the same day, and the [accessibility pass](accessibility.md).
- Limits: one evaluator (an AI), no participants. Nothing here says how students actually behave; the sessions do that.

## Findings

| ID | Heuristic | Screen | Observed | Severity | Evidence | Suggested fix | M6 candidate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| H-01 | 1 Visibility of system status; 5 Error prevention | Any screen, two tabs | A second Momentum tab keeps an old copy and writes it over the other tab's work. A note saved in tab A was erased when tab B pressed Mark complete, and tab B still said "Saved in this browser". | **3** (confirmed by Aidan) | `docs/evidence/test-results/m5-scripts/tabs.mjs`; steps: start a plan, open `/step/1` in a second tab, pause with a note in tab 1, Mark complete in tab 2, reload: the note is gone | Listen for the `storage` event and reload the data another tab wrote | **M6 #1**: tab sync (risk 1) |
| H-02 | 5 Error prevention; 1 Visibility | Brief entry | Pasting more than 12,000 characters keeps the first 12,000 without saying anything was cut. The end of a brief often holds the due date and submission rules. | **2** (proposed; 3 if a participant's brief is long) | Steps: paste 13,000 characters; the count reads "12,000 of 12,000 characters" (M4 status, brief entry keyboard check) | Say that text was cut, or accept the paste and show the existing over-limit error | M6 #4 (signal 4) |
| H-03 | 9 Recover from errors | Error 03 | "Try again in a moment" also shows for the rate limit, which can last up to 10 minutes. Several builds from one network (a session room) can reach it. | **2** (proposed) | M4 live check 7: the 6th build in 10 minutes from one IP → 429 → Error 03 | A separate line for `rateLimited` with an honest wait | M6 #5 (signal 2) |
| H-04 | 2 Match with the real world | Plan review | Generated estimates for the sample brief total about 6.5 h, about twice the hand-written plan's 3 h 20 min; the same brief gives 5 or 6 steps between runs. A large total may feel daunting to an overwhelmed student. | **2** (proposed; check in sessions) | [generation-checks.md](generation-checks.md); decisions.md M4 "Estimates and step count" | Observe first; then consider prompt guidance toward a small first step | Watch in sessions |
| H-05 | 2 Match with the real world | Plan (from the model) | The model is told "today" as the server's UTC date. In US evenings that is already tomorrow, so "due this Friday" or "in two weeks" can resolve a day off. | **2** (proposed) | decisions.md M4 "'Today' is the server's UTC date"; steps: build a plan from a brief with a relative date after 7 PM Eastern | Send the browser's local date with `POST /api/plan` | M6 #6: "Today" in UTC |
| H-06 | 4 Consistency | Plan review, step complete, home | A criterion typed with a capital in the step editor reads "Done when You have…". | **1** (proposed) | Steps: Edit step 1, type "You have the question…" in Done when, Done editing | "Done when" as a fixed prefix before the field | Watch in sessions (moved from the M4 M6 candidates) |
| H-07 | 6 Recognition rather than recall; 8 Minimalist design | Plan review | Start step 1, the screen's one next action, is about 1,315 px from the top at 1280×800, below the summary, the requirements and six step rows. | **2** (proposed; check in sessions) | `m5-plan-review-1280.png`; M3 status "Start step 1, 1280×800" | Observe; if participants hunt for it, bring it into view (shorter rows, or a start line near the top) | Watch in sessions |
| H-08 | 1 Visibility; accessibility (WCAG 1.4.11) | Brief entry, deadline, step edit card, pause dialog | The text fields' resting border (`border/input`, #d4d4d4) is 1.48:1 on white, so the edge of the brief box, where the first action happens, is faint. | **2** (proposed) | DESIGN.md "Contrast"; `m5-brief-entry-1280.png` | A darker border token for fields only | **M6 #2** (WCAG 1.4.11) |
| H-09 | 1 Visibility of system status | Every screen with the save indicator | "Couldn’t save in this browser" is a 13 px caption in the corner, only slightly different from "Saved in this browser", with no icon, and not announced to screen readers. At 600 px the indicator wraps to two lines. | **2** (proposed) | `m5-working-step-600.png`; `TopBar.tsx` (no live region) | Live region; icon for the failed state; keep on one line | **M6 #3** (WCAG 4.1.3; signal 3, 9) |
| H-10 | 3 User control and freedom | Step complete | Undo is available only until another step starts. After Continue to step 2, a mistaken Mark complete on step 1 can't be reversed (a done step opened from the rail stays done). | **1** (proposed) | Steps: Mark complete on step 1, Continue to step 2, open step 1 from the rail: "You marked this step done." | Leave unless sessions show it | Watch in sessions |
| H-11 | 3 User control and freedom | Pause dialog | Opening the dialog shows the saved note; clearing the field and pressing Finish for now deletes the note with no message or undo. | **1** (proposed) | Steps: pause with a note, resume, Pause for later, clear the field, Finish for now: home shows no note | Leave; watch in Task 2 | Watch in sessions |
| H-12 | 3 User control and freedom; 4 Consistency | Plan review edit card | Escape does nothing in the step and requirements edit cards (they're inline, not dialogs); Cancel is the only way out. The pause dialog and side panel close on Escape. | **1** (proposed) | Keyboard pass: "Escape inside the step edit card: card still open = true" (`docs/evidence/test-results/keyboard-m5.json`) | Escape = Cancel in edit cards | Watch in sessions |
| H-13 | 4 Consistency | Working step | Focus order runs Mark complete → Pause for later → From your brief → timer → rail → View full plan. At 960 px and wider the rail is drawn to the left of the step, and below 960 above it, but it comes after the step in Tab order. A side effect of focusing the h1 (decision M2). | **1** (proposed) | `keyboard-m5.json`, "working step" | Leave; note for screen-reader check | Watch in sessions |
| H-14 | 1 Visibility | Plan review | While an edit card is open, Start step 1 is grey; the reason ("Finish editing to start.") is screen-reader text only. | **1** (proposed) | `m5-plan-review-edit-1280.png` | Show the reason as a caption | Watch in sessions |
| H-15 | 10 Help and documentation | Brief entry, homes | "Your plan and progress stay in this browser" doesn't warn that a lab computer that wipes, a private window or clearing site data removes everything. | **1** (proposed; 2 if participants assume sync) | Brief entry caption; risk item 2 | One sentence where it matters, if sessions show the assumption | Watch in sessions |
| H-16 | 9 Recover from errors | First load | If stored data can't be read, the app starts fresh at brief entry with no message; the backup is reachable only through DevTools. | **1** (proposed) | `storage.ts`, `load()`; M2 tests | None for the MVP | Watch in sessions |
| H-17 | 3 User control and freedom | Working step, done step | **Found by Aidan in a walkthrough, 2026-11-18.** On step 3, opening step 1 or 2 from the rail shows "You marked this step done." The rail then lists only the done steps and the one on screen, so step 3, the one in progress, disappears. The done view has no way back, and the wordmark isn't a link. The student is stranded. | **3** (confirmed by Aidan) | Aidan's walkthrough; `StepRail.tsx` filter (done steps or the one on screen); `WorkingStep.tsx` done view; `Wordmark.tsx` (a plain span) | The rail always lists the step in progress; the done view gets "Back to step N" (or "Back to home"); the wordmark links home | **M6 item 9** (fixed) |

## What works (severity 0, for the case study)

- **One next action per screen**: each screen has one primary button, and on every screen focus lands on the h1 first (keyboard pass).
- **Honest status:** "Saved in this browser" never shows after a failed write (M2 check). Building shows no fake stages. The final check says it's the student's own review.
- **Return context first:** home after a pause leads with "Pick up where you left off", the step and the note (`m5-home-after-pause-1280.png`).
- **Recoverable errors:** every error keeps the brief text and says so.

## Review

- [x] Read the findings; confirmed H-01 as severity 3 (2026-11-18).
- [x] Accepted the M6 candidates; H-04, H-07 and severity-1 items are "watch in sessions".
- [x] "Reviewed by Aidan" set to yes.
- [ ] After the sessions: add what participants ran into, marked "(Aidan, from P1)", and promote any "watch in sessions" item that showed up.
