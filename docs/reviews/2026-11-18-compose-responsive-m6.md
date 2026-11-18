# /craft compose and /craft responsive: M6 changed screens

Run by Claude Code on 2026-11-18, on the production build of `feat/m6-fixes`, in Chrome at 1280×800 and 600×800. Screenshots: `docs/evidence/screenshots/m6-<screen>-<width>.png`. The top bar was also checked at 540, 480, 420 and 375 px (`m6-scripts/narrow.mjs`).

**Operating Conditions** (PRODUCT.md):
- consequence: lost work, then misplaced trust;
- environment: laptop first, split screens down to about 600 px, short interrupted sessions;
- users: mixed skill, overwhelmed.

So grouping and hierarchy must be readable at a glance, and every way back must be visible without exploring.

**Screens:** the top bar (save status), brief entry over the limit, Error 03 for the rate limit, the working step, the done-step view with the rail, step complete and the final check.

**Rule for this pass:** fix only what M6 changed. Everything else is an M7 candidate in [decisions.md](../decisions.md), M6.

## Compose

### Fixed in M6

**C1. Step complete: the two captions read as two sections.**
- Problem (proximity): item 7 added "Step N is marked done." with Undo. It sat 24 px below "Step N will be here when you come back.", which is the card's gap between sections. So the two small captions read as separate blocks, and the Undo row looked unrelated to the rest of the card.
- Fix: both captions now share one footer block with a 4 px gap, so they read as one footer under the buttons (commit `deba3df`; see `m6-step-complete-600.png`).

### Solid

- **C2. The failed save status reads differently at a glance.** It has the alert icon and Ink text; Saved has a check icon and Faint pencil text. That's three differences (icon, colour and wording), and the extra weight on the right of the top bar is right for a warning (`m6-save-failed-*.png`).
- **C3. Brief entry over the limit.** The error sits directly under the field, with the count below it, so the eye goes from field to problem to number. Break it down stays where it was (`m6-brief-entry-over-limit-*.png`).
- **C4. Done-step view.** "You marked this step done." and "Back to step 3" sit 12 px apart, so they read as one group. The Secondary weight fits: the student is looking back, and the button is the only action on the view (`m6-done-step-*.png`).
- **C5. Final check.** It's unchanged apart from the description link. The footer row ("Step N is marked done." with Undo) is the pattern step complete now matches.

### M7 candidates (not changed)

- **C6. The rail doesn't show which done step is on screen.** On step 1's done view, the dot and medium weight mark step 3, the one in progress, as the M6 brief asked. Step 1 looks the same as done step 2. "Step 1 of 6" above the h1 carries the location, and `aria-current` is on step 1's row for screen readers.
  - Possible change: give the on-screen done row its own marker, for example Pencil text instead of Faint pencil, still struck through.
- **C7. Error 03 for the rate limit keeps Try again as the primary action**, although it will keep failing for several minutes. The brief said to keep Try again, so it stays.
  - Possible change: make Try again secondary for `rateLimited` only, or keep it and rely on the wording.
- **C8. Over the limit, the brief doesn't show where character 12,000 falls**, so the student has to guess what to cut.
  - Possible change: none in the MVP. Watch in sessions whether anyone pastes that much.

## Responsive

### Breaks

None found at 1280×800 or 600×800.

### Compromises

- **R1. Below about 420 px, the assignment context in the top bar shrinks to nothing.** It's 22 px wide at 420 and 0 at 375, so the save status keeps its full wording on one line with no sideways scroll. Phones are secondary (PRODUCT.md), so this is acceptable.
  - **M7 candidate:** hide the context below a set width rather than leave a stub.
- **R2. At 600×800, "Back to step 3" is below the fold.** The rail stacks above the step and pushes the button down, to about 980 px. The rail's own link to step 3 is in the first screen, so a way back is still visible without scrolling. At 1280 the button is in view (about 635 px).
  - Accepted for M6. Note for the sessions: watch whether participants find their way back at 600.

### Solid

- **R3. The save status stays on one line** at every width checked (1280, 600, 540, 480, 420, 375), in both states. No horizontal scroll. The full wording is kept, so no shorter wording was needed (decisions.md, M6).
- **R4. Error 03 for the rate limit** wraps to two lines at 600 and stays inside the card. Both buttons fit on one row.
- **R5. Brief entry over the limit at 600:** the error and the count are visible without scrolling right after the paste. The field keeps its 11 rows.
- **R6. Touch and pointer:**
  - "Back to step N" is 44 px tall.
  - The wordmark link is 20 px tall, but no other target is within 24 px, so it meets 2.5.8 through the spacing exception. axe's `target-size` rule passed on every screen.
- **R7. Keyboard:**
  - The wordmark is now the first Tab stop in the page. Focus still lands on the h1 when a screen opens (unchanged), so the wordmark is reached with Shift+Tab, or when Tab wraps, not on the way to the main action. On the working step and done view, Shift+Tab reaches the rail first (H-13).
  - **Re-run on Aidan's request** (`keyboard-m6.mjs`, both widths): no traps. On the done view, "Back to step 3" is the 2nd Tab from the h1. Details in [accessibility.md](../evidence/accessibility.md), "Keyboard pass, M6".
