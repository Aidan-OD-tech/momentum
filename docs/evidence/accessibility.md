# Accessibility pass (M5, target WCAG 2.2 AA)

Run by Claude Code on 2026-11-18 on the production build of `feat/m5-evaluation` (`npm run build && npm start`), Chrome via Playwright, at **1280×800** and **600×800**. `/api/plan` was answered by the test script with the sample plan.

**Nothing was fixed in M5.** Every failure is an M6 candidate with its criterion number.

**Not done by Claude Code:**
- **No screen reader was used.** The script for Aidan is below.
- The keyboard pass was **scripted** (Playwright key presses), not done by a person at the keyboard.

## Files

- Raw axe results: [test-results/axe-m5.json](test-results/axe-m5.json). For each screen and width it holds the full `violations` and `incomplete`; passes and inapplicable rules are listed by id. The file also has the walkthrough's checks.
- Keyboard pass: [test-results/keyboard-m5.json](test-results/keyboard-m5.json). Every key press, the focused element, the focus indicator seen, whether the element was inside the viewport, and controls under 24 px.
- Scripts: [test-results/m5-scripts/](test-results/m5-scripts/) (`walk.mjs`: axe and screenshots; `keyboard.mjs`; `tabs.mjs`: the two-tab check).
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
- The script first flagged the deadline field as having no indicator. It read the style 60 ms after the Tab, before the border's transition finished. A second check after 600 ms showed `border/strong` (#111111). Pass.
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
| 4.1.3 Status Messages | **Fail (save status)** | See below. |

**4.1.3, by status message:**

| Message | In the DOM | Result |
| --- | --- | --- |
| "Saved in this browser" / "Couldn’t save in this browser" (top bar) | a plain `<p>`, no live region | **Fail**: a save failure is never announced → M6 |
| Building ("Working on it") | `role="status"`, and the h1 "Building your plan" is focused | Pass in the DOM; not heard |
| "Requirements updated…" (R3 03) | a `role="status"` container that stays mounted and fills on change | Pass in the DOM; not heard |
| Character count near the limit | linked to the field; a separate polite region changes once near and once at the limit | Pass in the DOM (tested); not heard |
| "Progress saved" (home) | `role="status"`, but it arrives already filled with the new screen, which screen readers often skip | **Not checked**: VoiceOver step 4 |

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
