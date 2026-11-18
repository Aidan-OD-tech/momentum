# M5 test scripts

Playwright scripts Claude Code used for the M5 checks on 2026-11-18. They are a record of how the evidence was made. They aren't part of the app, and their packages aren't in `package.json`.

- `walk.mjs <width> <out.json> <screenshot dir>`: every screen in the heuristic list, axe on each, screenshots, and a count of `/api/event` requests (one plan → one event, none after reload, Undo or reopening step 1).
- `keyboard.mjs <out.json> <width>`: the keyboard-only pass.
- `tabs.mjs`: the two-tab overwrite check (risk item 1).

To run them again:
1. Install `playwright@1.56.1` and `@axe-core/playwright@4.11.0` in a scratch folder, with Google Chrome installed.
2. Put a `sample.json` holding `{ plan, brief }` (from `createSamplePlan()` and `sampleAssignment.brief`) one folder above the scripts.
3. Start `npm run build && PORT=3100 npm start`.

The scripts answer `/api/plan` themselves, so they make no OpenAI request.
