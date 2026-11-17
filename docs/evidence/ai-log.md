# AI contribution log

Records what AI tools produced and where Aidan changed, corrected or decided. Kept honest for the course's AI-disclosure requirement.

## M1: foundation and working-step screen (2026-11-17)

- Implemented by Claude Code from a written M1 prompt: repository setup, Next.js scaffold, tokens, UI primitives, Momentum components, sample data, `/step/[n]` route, tests, docs.
- Aidan's inputs: the handoff, the Figma designs, the decisions in [../decisions.md](../decisions.md), and the M1 prompt itself.
- Sample copy (brief text; intros and What to do for steps 1, 2, 4, 5, 6) was written by Claude Code for development and is marked in `src/data/sample-assignment.ts`.

### Aidan's corrections and decisions

- Asked for Figma copy instead of the M1 placeholder brief and step copy (done in M2).
- Chose Display for the step title (M1 had Heading L).
- Decided to disable Cache Components after the M1 report of 200-then-404 for invalid steps.

## M2: core loop with browser persistence (2026-11-17)

- Implemented by Claude Code from Aidan's written M2 prompt, with Aidan's Figma reference screenshots in `docs/reference/figma/`.
- Claude Code's own corrections during M2, found by its browser walkthrough or tests:
  - A loading state rendered *instead of* the page hid `notFound()` from the server render, so malformed URLs returned 200 again. Fixed with `<WhenLoaded>`.
  - Undo on step complete and on the final check raced with the screen's own "wrong state, go home" redirect. Fixed with a "leaving" flag.
  - "Progress saved" was cleared by a no-op action fired when the step screen re-rendered. Fixed by clearing it only when data changes.
  - The undo unit test passed even with a broken undo; it was strengthened so it fails without a real restore.
- Choices Claude made where the sources were silent are marked "(Claude)" in [../decisions.md](../decisions.md) for Aidan's review.

### Aidan's corrections and decisions (M2)

(Add entries here.)
