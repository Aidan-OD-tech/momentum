# Accessibility pass (M5, re-run in M6; target WCAG 2.2 AA)

## M6 re-run (2026-11-18)

Claude Code ran the M5 axe walkthrough again on the production build of `feat/m6-fixes`. It used the same tool, tags and widths (1280×800 and 600×800), on the same 13 screens plus four M6 views:
- brief entry over the limit;
- Error 03 for the rate limit;
- the done-step view;
- the failed save status (on the final check).

Files:
- results: [test-results/axe-m6.json](test-results/axe-m6.json);
- screenshots: `docs/evidence/screenshots/m6-<screen>-<1280|600>.png`.

| Result | 1280×800 | 600×800 |
| --- | --- | --- |
| axe violations, 17 views | 0 | 0 |
| Needs review | pause dialog only: `aria-hidden-focus` and `color-contrast`, as in M5 (checked by hand below) | pause dialog only: `aria-hidden-focus`, as in M5 |

What changed, by criterion:
- **1.4.11 Non-text Contrast: now passes.**
  - The brief and deadline fields' computed resting border is `rgb(148, 148, 148)` (#949494), measured in Chrome: **3.03:1** on white and on `surface/page` (#ffffff).
  - Focus turns it `border/strong`, **6.22:1** against the resting border.
  - The token test (`src/tokens.test.ts`) fails if `border/input` drops below 3:1.
- **4.1.3 Status Messages (save status): now passes in the DOM.**
  - The top bar keeps one `role="status"` region mounted, empty while hidden; only its text changes.
  - In Chrome it read: empty on brief entry; "Saved in this browser" on the working step; "Couldn’t save in this browser" with the alert icon in Ink (`rgb(17, 17, 17)`) when storage refused a write; then "Saved in this browser" again after a good write.
  - It stays on one line (20 px tall, line height 20 px) at 1280, 600, 540, 480, 420 and 375 px, with no horizontal scroll.
  - **Not heard:** no screen reader was used. VoiceOver script step 8 checks it.
- **2.4.6 (advisory): Undo now has an accessible description**, "Step N is marked done.", on step complete and the final check.
- **Keyboard:** re-run below ("Keyboard pass, M6").

### Keyboard pass, M6 (scripted, 1280×800 and 600×800)

Script: [m6-scripts/keyboard-m6.mjs](test-results/m6-scripts/keyboard-m6.mjs). It runs the M5 flow, plus Shift+Tab from each h1 and the done-step view (step 1 opened from step 3's rail by keyboard). Results: [test-results/keyboard-m6.json](test-results/keyboard-m6.json). Both widths gave the same order.

- **No traps.** Focus lands on the h1 on every screen (unchanged). There was no horizontal overflow, and no focused element was outside the viewport.
- **The wordmark ("Momentum, home") is first in the page's Tab order** and shows the token ring. When Tab wraps past the last control, it's the first stop again.
  - **Shift+Tab from the h1** reaches the wordmark on brief entry, plan review, home, step complete, the final check and completed home.
  - **On the working step and the done view**, Shift+Tab from the h1 reaches the rail's "Original brief" instead, because the rail comes before the main column in the page (H-13).
- **Tab order after the h1, where it changed:**

| Screen | M6 order (Tab from the h1, then wrapping) |
| --- | --- |
| Working step | Mark complete → Pause for later → From your brief → Start a N min timer → (end of page) → **Momentum, home** → rail step link(s) → View full plan → Original brief |
| Done step (new) | Hide note (when the step has a note) → **Back to step 3** → From your brief → (end of page) → **Momentum, home** → Done: 1 → Done: 2 → In progress: 3 → View full plan → Original brief. **Back to step 3 is the 2nd Tab from the h1** (the 1st when there's no note). It follows the visual order of the main column. Enter opens step 3 with focus on its h1 |
| Step complete | Continue to step N → Finish for now → Undo → **Momentum, home** |
| Final check | four checkboxes → Finish review → View full plan → Undo → **Momentum, home** |
| Other screens | as in M5, with **Momentum, home** after the last control |

- **Target size:** the wordmark link is 104×22 px. Under 24 px tall, it meets 2.5.8 through the spacing exception: no other target within 24 px. axe `target-size` passed. The four 20×20 final-check checkboxes are as in M5.
- **The deadline field's calendar button (correction to M5):**
  - The one stop the script flags without an indicator is the 7th Tab stop in the deadline field: Chrome's own calendar button, inside the date field.
  - Re-checked 600 ms after the Tab (`m6-scripts/deadline-focus.mjs`): the field keeps its resting border (#949494) and has no token ring, but Chrome draws its default blue focus ring around the calendar icon (`screenshots/m6-deadline-picker-focus-1280.png`). Focus is visible, so 2.4.7 passes, but the indicator isn't Momentum's.
  - M5 called this a timing artifact. That was right for the date parts, which turn `border/strong`, but not for this stop.
  - Not fixed (M7 candidate).


Still open: "Progress saved" (VoiceOver step 7; M6 item 8 waits for it).

The M5 record follows, unchanged except for the criteria table, one corrected step number (step 7, not 4, for "Progress saved") and a correction to the deadline focus note.


Run by Claude Code on 2026-11-18 on the production build of `feat/m5-evaluation` (`npm run build && npm start`), Chrome via Playwright, at **1280×800** and **600×800**. `/api/plan` was answered by the test script with the sample plan.

**Nothing was fixed in M5.** Every failure is an M6 candidate with its criterion number.

**Not done by Claude Code:**
- **No screen reader was used.** The script for Aidan is below.
- The keyboard pass was **scripted** (Playwright key presses), not done by a person at the keyboard.

## Files

- Raw axe results: [test-results/axe-m5.json](test-results/axe-m5.json). For each screen and width it holds the full `violations` and `incomplete`; passes and inapplicable rules are listed by id. The file also has the walkthrough's checks.
- Keyboard pass: [test-results/keyboard-m5.json](test-results/keyboard-m5.json). Every key press, the focused element, the focus indicator seen, whether the element was inside the viewport, and controls under 24 px.
- Screenshots: `docs/evidence/screenshots/m5-<screen>-<1280|600>.png`.

## axe (axe-core 4.11, tags wcag2a/aa, wcag21a/aa, wcag22aa, best-practice)

| Screen | 1280×800 violations | 600×800 violations | Needs review (incomplete) |
| --- | --- | --- | --- |
| Brief entry | 0 | 0 | none |
| Error 01 (empty brief) | 0 | 0 | none |
| Building | 0 | 0 | none |
| Error 02 (unreadable) | 0 | 0 | none |
| Error 03 (failed) | 0 | 0 | none |
| Plan review | 0 | 0 | none |
| Plan review, step edit card open | 0 | 0 | none |
| Working step | 0 | 0 | none |
| Pause dialog | 0 | 0 | `aria-hidden-focus` (both widths); `color-contrast` (1280 only) |
| Home after a pause | 0 | 0 | none |
| Step complete (with Undo) | 0 | 0 | none |
| Final check | 0 | 0 | none |
| Completed home | 0 | 0 | none |

The two "needs review" items, checked by hand:
- **`aria-hidden-focus`** on the pause dialog: Radix sets `aria-hidden` on the page behind the dialog and adds focus guards. The keyboard pass shows Tab stays inside the dialog (textarea → Keep working → Finish for now → Close → textarea). Nothing hidden is reachable, so this passes.
- **`color-contrast`** on the dialog title: axe couldn't work out the background because the dialog overlaps the scrim. The title is Ink (#111111) on Paper (#ffffff), 18.9:1. Pass.

**What axe doesn't catch:** non-text contrast (1.4.11) of borders, focus visibility, the meaning of status messages, and anything that needs a person. Zero violations is not "accessible".

## Keyboard pass (whole flow, keys only)

Flow: brief entry → plan review (edit step 1, Cancel) → Start step 1 → side panel → pause dialog → Finish for now → home → Resume → Mark complete → step complete → Undo → complete all six steps → final check (tick, Finish review) → completed home. Every action was a Tab, Shift+Tab, Enter, Space, Escape or arrow key, at both widths.

| Screen | Focus on arrival | Tab order (after the h1) | Escape | Traps |
| --- | --- | --- | --- | --- |
| Brief entry | h1 | brief text area → deadline (Chrome gives each date part a stop) → Break it down | n/a | none |
| Plan review | h1 | Edit (requirements) → View original brief → Add a step → Edit step 1…6 → Start step 1 | In an edit card, Escape does nothing (heuristic H-12); Cancel returns focus to "Edit step 1" | none |
| Step edit card | Step title field | title → What to do items and Remove → Add an item → Done when → Decrease / Increase time → Delete step → Cancel → Done editing | as above | none |
| Working step | h1 | Mark complete → Pause for later → From your brief (toggle) → Start a 5 min timer → rail step link → View full plan → Original brief | n/a | none |
| Side panel | Plan tab | tabs (arrow keys switch: Plan → Original brief) → Close | closes; focus returns to View full plan | Tab stays inside while open (expected for a modal) |
| Pause dialog | note text area | text area → Keep working → Finish for now → Close (cycles) | closes; focus returns to Pause for later; reopening keeps the draft | Tab stays inside while open (expected) |
| Home after a pause | h1 | Resume step 1 → View full plan | n/a | none |
| Step complete | h1 | Continue to step N → Finish for now → Undo | n/a | none |
| Final check | h1 | four checkboxes (Space ticks) → Finish review → View full plan → Undo | n/a | none |
| Completed home | h1 | Review assignment → Start a new assignment | n/a | none |

**Visible focus:**
- Every stop showed the token ring, or for text fields the dark `border/strong`.
- The script first flagged the deadline field as having no indicator. It read the style 60 ms after the Tab, before the border's transition finished. A second check after 600 ms showed `border/strong` (#111111). Pass. **Corrected in M6:** the flagged stop is Chrome's calendar button inside the field, which shows Chrome's own blue ring and not `border/strong` (see "Keyboard pass, M6").
- At 600 px nothing scrolled sideways (`scrollWidth` ≤ window width on every screen), and every focused control was inside the viewport.

## Criteria

| Criterion | Result | Notes |
| --- | --- | --- |
| 1.4.3 Contrast (Minimum) | **Pass** | axe: no `color-contrast` violations on any screen at either width. Tokens: Ink 18.9:1, Pencil 7.8:1, Faint pencil 4.7:1 on white. `text/tertiary` is never used for body text on `surface/subtle` (DESIGN.md rule). |
| 1.4.11 Non-text Contrast | **Fail in M5; fixed in M6** | M5: `border/input` (#d4d4d4) on white was **1.48:1**, and it was the only boundary of the brief text area, the deadline field, the step edit fields and the pause note field at rest (3:1 needed). **M6:** `border/input` is **#949494**: **3.03:1** on white (#ffffff) and **3.03:1** on `surface/page` (also #ffffff); every text field sits on one of them. It's the lightest neutral that reaches 3:1 (#959595 is 2.995:1). Focus turns the border `border/strong` (#111111), **6.22:1** against the new resting border. Secondary buttons, the estimate stepper, the upcoming-step badge and the dashed hidden-note row moved to `border/rule` (#d4d4d4, unchanged look): they're identified by their text or number, so they pass. Checkbox outline (Ink) and focus ring pass. Progress segments are `aria-hidden` and the text "n of N steps done" carries the meaning. |
| 2.4.7 Focus Visible | **Pass** | Every stop in the keyboard pass (above). |
| 2.4.11 Focus Not Obscured (Minimum) | **Pass** | Nothing is sticky or fixed except the dialog and the side panel, which keep focus inside themselves. Every focused element was inside the viewport at both widths. |
| 2.5.8 Target Size (Minimum) | **Pass** | Every control is at least 24×24 px except the four final-check checkboxes (20×20). They meet the spacing exception: rows are 16 px apart with 26 px lines, so 24 px circles don't overlap. Each label is also linked (`htmlFor`), so clicking the text ticks the box. |
| 3.3.1 Error Identification | **Pass** | Error 01: text message, `aria-invalid`, linked by `aria-describedby`, focus in the field (also tested). Errors 02 and 03: full-screen messages with the heading focused. The over-limit draft error uses the same pattern. Not checked in M5: the step edit card's required fields. |
| 3.3.3 Error Suggestion | **Pass, with a note** | Each error says what to do. Error 03's "Try again in a moment" is also shown for the rate limit (up to 10 minutes), so the suggestion can be wrong (heuristic H-03). Related, outside 3.3: a paste over 12,000 characters is cut without a message (H-02). |
| 4.1.3 Status Messages | **Fail (save status) in M5; save status fixed in M6** | See below and the M6 re-run above. |

**4.1.3, by status message:**

| Message | In the DOM | Result |
| --- | --- | --- |
| "Saved in this browser" / "Couldn’t save in this browser" (top bar) | M5: a plain `<p>`, no live region. M6: one mounted `role="status"` region | M5 **Fail**: a save failure is never announced. **M6: pass in the DOM; not heard** |
| Building ("Working on it") | `role="status"`, and the h1 "Building your plan" is focused | Pass in the DOM; not heard |
| "Requirements updated…" (R3 03) | a `role="status"` container that stays mounted and fills on change | Pass in the DOM; not heard |
| Character count near the limit | linked to the field; a separate polite region changes once near and once at the limit | Pass in the DOM (tested); not heard |
| "Progress saved" (home) | `role="status"`, but it arrives already filled with the new screen, which screen readers often skip | **Not checked**: VoiceOver step 7 (M5 said "step 4" here in error; corrected in M6) |

## M6 candidates from this pass

| Criterion | Item |
| --- | --- |
| 1.4.11 | Darker resting border for text fields (brief, deadline, step edit, pause note) |
| 4.1.3 | Save indicator in a mounted live region; announce changes to failed and back |
| 4.1.3 (pending VoiceOver) | "Progress saved" announced on arrival at home |
| (advisory) 2.4.6 | Undo's accessible name says what it undoes |

## VoiceOver script for Aidan (about 10 minutes)

Use Safari or Chrome on the Mac and a fresh window, on the deployed build. Write down **what you heard**, word for word where you can, in the "Heard" column. Don't fill in anything you didn't hear.

Basics: **Cmd+F5** turns VoiceOver on and off. **VO** = Control+Option. **VO+Right arrow** moves to the next item; **Tab** moves to the next control; **VO+Space** activates.

| # | Do | Listen for | Heard |
| --- | --- | --- | --- |
| 1 | Open the site. Let it settle. | The page title and the h1 "Turn an assignment brief into small, doable steps." | |
| 2 | Tab to the brief field. | "Assignment brief, edit text" (or similar) and the placeholder. Then Tab on: the deadline field and its "Optional" label, Break it down. Is "Use a sample brief" absent? | |
| 3 | Shift+Tab back to the brief, paste the sample brief, Tab to Break it down, press it. | "Building your plan" and/or "Working on it". When the plan arrives: the plan title as the h1. | |
| 4 | On plan review, VO+Right through the summary, "From your brief" chips and two step rows. Then Tab to Edit step 1 and press it. Change nothing; Tab to Cancel and press it. | Are the steps read with their number, estimate and "Done when"? After Cancel, does focus land back on "Edit step 1"? | |
| 5 | Tab to Start step 1 and press it. On the working step, Tab to Pause for later and press it. | The dialog: "Where did you leave off?", the description "Step 1 stays in progress…", then the "Note, Optional" field. | |
| 6 | Type a short note. Press Escape. | Focus back on "Pause for later". Press it again: is your note still in the field? | |
| 7 | Press Finish for now. | On home: "Pick up where you left off". **Did you hear "Progress saved"?** (This is the open 4.1.3 check.) | |
| 8 | (Optional, 2 min) In Chrome: Settings → Privacy and security → Site settings → Additional content settings → On-device site data → add the Momentum address under "Not allowed to save data on your device". Reload, build a plan. (Menu names can differ a little between Chrome versions. A private window is not enough: local storage still works there.) | Is "Couldn’t save in this browser" spoken at all? (Expected: no, the known failure.) Remove the block afterwards. | |

Afterwards, add a line under "Not done by Claude Code" saying VoiceOver was run, with the date, browser and macOS version.
