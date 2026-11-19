# /craft compose and /craft responsive: several assignments (M7d, 2026-11-19)

Run by Claude Code on `feat/m7d-polish-evidence`, on the production build (`next start`), in Chrome at **1280×800, 600×800 and 375×800**.
- `/api/plan` was answered by the script with a 2.5 s delay (200, 422, 200); no model calls were made.
- Screenshots: `docs/evidence/screenshots/m7d/m7d-<screen>-<width>.png` before the fixes, and `…-after.png` after them.
- Fixture: the mixed home list from the tests (`mixedHomeList()`, plans of 1, 3 and 9 steps), plus one kept brief draft.

**Operating Conditions** (PRODUCT.md):
- consequence: lost work, then misplaced trust;
- environment: laptop first, split screens down to about 600 px, short interrupted sessions; phones secondary and not a target;
- users: mixed skill, overwhelmed.

Grouping and the next action must read at a glance. At 375 px, the breaks that matter are lost content and unreachable actions; cramped but usable layouts are compromises.

**Screens:**
- the home list (`/`);
- weekly upload entry (`/new` with 3 briefs);
- Building your plans: mid-run, with a failure, and done.

**Rule for this pass:** fix only small items (spacing, wrapping, alignment, focus order). Anything bigger is an M8 candidate in [decisions.md](../decisions.md).

## Compose

### Fixed

**C1. Home list at 375: "Add assignments" split the heading from its intro.**
- Problem (proximity): below 600 px the button wrapped between the h1 and "Soonest deadline first…". So the intro line read as a caption for the button, not for the page.
- Fix: below 600 px the order is h1, intro, then button; from 600 px it is unchanged (button beside the h1, intro below both). Commit `c9321e2`.
- Tab order is unchanged (the button is the only control). A screen reader now reads the intro before the button at every width.

### Solid

- **C2. The Up next card is the focal point at every width.** It's the only bordered card, it carries the only Primary button, and the groups below are quiet rows under small Label headings. The squint test passes: card, then rows, then the Finished toggle.
- **C3. Building rows group cleanly.** Each row is icon then text. A failure's explanation and its button sit indented under the row text, so they read as part of that brief (continuation), and the actions sit apart below the list.
- **C4. Brief cards.** Each card is bordered, with its number and Remove on one line, then the brief, then its deadline. Cards are 16 px apart; the card's own sections are 24 px apart, so a card reads as one unit. "Add another brief" sits 32 px below the last card, apart from them.

### M8 candidates (not changed)

- **C5. The list's status links look like the back link on `/new`.**
  - Problem (similarity): "1 brief not built yet" and "Building plans: X of N ready" use the same underlined link style, in the same place above the h1, as "Back to your assignments" on `/new`. A student may take them for navigation back rather than a status.
  - Possible change: show them as a status line (caption with an icon, like "Progress saved"), with the link inside the text.
- **C6. Building done: "Edit brief" and "Back to your briefs" do the same thing.** Both clear the run and open entry with the briefs not built. Two labels for one action, side by side when a brief is unreadable.
  - Possible change: once "Back to your briefs" shows, drop the per-row "Edit brief" and keep the row line "Your brief is kept. Edit it and try again."
- **C7. Brief cards are tall.** Each text area is 8 rows, so 3 briefs make a page of about 1,850 px at 1280, and 8 briefs about 4,200 px (estimated from the card height).
  - Possible change: 5 rows in cards (they still resize), or watch in sessions whether anyone uploads more than 3 or 4.

## Responsive

### Fixed

- **R1. Brief entry at 375: the disclosure was squeezed into a narrow column beside "Build 3 plans".**
  - Problem: at 375 it took six short lines; this predates M7 (single-brief entry had the same footer), but M7's longer page makes it the last thing read.
  - Fix: below 600 px the captions take the full width and the button wraps under them; from 600 px it is unchanged. Commit `1cf1f30`.
- **R2. Up next card at 375: 32 px padding plus the well's 24 px left about 230 px for the step text.** "Done when…" wrapped to four lines, and the note to three.
  - Fix: the card's padding is 24 px below 600 px (32 px from 600). Commit `3621691`.

### Solid

- **Layout:** no horizontal scroll and no element wider than the viewport on any screen at 1280, 600 or 375 (checked by script on every element in `main`).
- **axe** (axe-core 4.10): **0 violations** on all 15 captures (3 screens in 5 states, at 3 widths), both before and after the fixes.
- **600 px** (the split-screen target): every screen keeps its desktop arrangement; rows keep their button on the right.
- **Keyboard:** the orders checked in M7b (list) and M7c (entry with three briefs) are unchanged by these fixes. The building screen's focus moves (M7c risk 9) are covered by tests.
- **Touch:** buttons are 44 px tall, text-link buttons 32 px, as elsewhere in the app. The wordmark link is 22 px tall; that predates M7.

### Compromises (accepted for phones, which aren't a target)

- **R3. Meta lines break inside a date at 375**, for example "Due date passed · Mon, Nov 16, / 5:00 PM". Keeping the date together (a non-breaking span) would be a small change; it's listed as an M8 candidate rather than fixed, since 375 isn't a target width.
- **R4. Rows at 375:** the right-hand button takes about a third of the width, so the "Ready to review" chip drops under the title and status lines wrap ("About 4 h / 30 min"). Everything stays readable and reachable.
- **R5. Building screen at 375:** "Stop after this one" wraps under "Go to your assignments". That's fine.
