# M6 test scripts

Playwright scripts Claude Code used for the M6 checks on 2026-11-18, on the production build of `feat/m6-fixes`. Like the [M5 scripts](../m5-scripts/), they are a record of how the evidence was made, not part of the app.

- `walk-m6.mjs <width> <out.json> <screenshot dir>`: the M5 walkthrough plus the M6 views and a check for each M6 item:
  - 13,000-character paste;
  - Error 03 for the rate limit;
  - the local date in the plan request;
  - save status (empty while hidden, failed with its icon, one line);
  - the done-step view and Back to step 3;
  - the side-panel line;
  - the wordmark;
  - Undo's description.
  Results: [axe-m6.json](../axe-m6.json). Screenshots: `docs/evidence/screenshots/m6-<screen>-<width>.png`.
- `tabs-m6.mjs`: the M5 two-tab check (H-01) run again on the M6 build.
- `narrow.mjs`: the top bar with the failed save status at 600, 540, 480, 420 and 375 px.
- `keyboard-m6.mjs <out.json> <width>`: the M5 keyboard pass, plus Shift+Tab from each h1 and the done-step view reached from step 3's rail. Results: [keyboard-m6.json](../keyboard-m6.json).
- `deadline-focus.mjs` and `deadline-shot.mjs`: the deadline field's border and ring at each of its Tab stops, 60 ms and 600 ms after the key, and a screenshot of the calendar button's focus.

To run them, follow the M5 README (same packages, `sample.json` one folder above, `PORT=3100 npm start`).
