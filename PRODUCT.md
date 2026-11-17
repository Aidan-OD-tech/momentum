# PRODUCT.md

Design context for `/craft`. Scope, the MVP list and the order of authority live in [docs/product.md](docs/product.md); full rationale in [docs/MOMENTUM_CONTEXT.md](docs/MOMENTUM_CONTEXT.md). This file does not repeat or override them.

## Register
Product. A working tool with no marketing surface.

## Users
Students with an assignment they are already committed to but finding hard to start or return to. They often feel overwhelmed or have been putting it off. They come back in short sessions, sometimes after days away, and need to know straight away where they were and what to do next.

## Purpose
Turn a dense assignment brief into manageable steps, help the student start, and let them return after a pause without rebuilding their context.

## Operating Conditions

**Consequence when wrong:** lost work first, misplaced trust second.
- Lost work: notes, pause drafts and progress live only in this browser's local storage. A failed or silent write, a cleared site, or a careless reset loses them.
- Misplaced trust: a student believes Momentum submitted the assignment, or that finishing the final check means the requirements are met. Momentum never sees their document or Turnitin, so it can't know either.

**Environment:** laptop first; 1280×800 is the main check size. Often in a split screen beside Google Docs, Word or the PDF brief, so windows down to about 600px wide must stay usable. Used in short, interrupted sessions spread over hours or days, sometimes late at night near a deadline. Phones are secondary and not a target platform.

**User skill level:** mixed web literacy, arriving overwhelmed with little attention to spare. Every primary action and every piece of return context must be clear without exploring, with no hidden menus.

## Voice
- Calm
- Plain
- Honest: says what happened, never more ("Saved in this browser", never "submitted")
- Grounded: approximate estimates and concrete "Done when" criteria, no hype

## References
- A writing-center tutor's margin notes on a printed brief
- Things 3: quiet, one task in focus

## Anti-references
- Pomodoro timers: the countdown as pressure
- Duolingo-style streak trackers: guilt, badges, gamified urgency
- Generic AI chat: a chat box as the interface, "thinking" theatrics
- Material 3 styling (ruled out in MOMENTUM_CONTEXT)

## Design principles
1. **One next action.** Every screen makes the next step obvious without exploring.
2. **Return context first.** Coming back after a gap, the student sees where they left off before anything else.
3. **Say only what's true.** Status copy reflects confirmed state. No "saved" without a successful write, nothing implies submission or verification.
4. **Never lose their words.** Notes, drafts and progress survive closing, hiding, refreshing and failed saves.
5. **No pressure.** Time is optional and approximate, and nothing punishes a pause.

## Accessibility
Target WCAG 2.2 AA (proposed; Aidan to confirm). Full keyboard operation with a visible focus ring on every control. Must work in a half-width laptop window (about 600px). Respect `prefers-reduced-motion`. Screen readers (VoiceOver, NVDA) are expected to work but have not been tested yet; see [docs/status.md](docs/status.md).
