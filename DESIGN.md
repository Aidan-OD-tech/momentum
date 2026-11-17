# DESIGN.md

Momentum's visual system and design rules, in the Google Stitch DESIGN.md format. Values come from the implementation handoff ("Design tokens", "Effects", "Layout", "Components"). If this file and the handoff disagree, the handoff wins; flag the difference. Read [PRODUCT.md](PRODUCT.md) first.

## Overview

**Creative North Star: "The annotated brief."** (Proposed; Aidan to confirm.) Ink on paper: near-black text and actions on white, gray for secondary information, and no accent color. The interface should read like a calm, well-marked page, not a dashboard.

The system optimizes for:
- **Re-entry:** a returning student sees where they left off and the next action within one glance.
- **Honest state:** save and progress status reflect confirmed writes only.
- **Low pressure:** time is optional and approximate; nothing flashes, counts down loudly or celebrates.

Operating Conditions (see PRODUCT.md) turn into these rules:
- Lost work is the main risk, so state changes are undoable where the handoff provides undo (step completion, including from the final check), and closing or hiding never deletes text.
- Misplaced trust is the second risk, so the final check describes itself as the student's own review and never as verification or submission.
- The audience is mixed and overwhelmed, so there is one primary button per view, labels are visible text, and nothing is hidden behind hover or overflow menus.

**Accessibility:** WCAG 2.2 AA target (proposed). Full keyboard operation, token focus ring on every control, `motion-reduce` respected.

**Layout:**
- Desktop first: 1440 design width, checked at 1280×800. Keep Mark complete within 700px of the top at 1280×800.
- Top bar: 64px (`h-top-bar`), 32px side padding, 1px bottom border.
- Working step: 220px rail (`w-rail`), 64px gap, 640px column (`max-w-column`), centered, 40px top padding (`pt-step-top`), 24px between main sections (`gap-6`). Below 960px (`wide:`) the rail stacks above the column.
- Home and completed home: 720 column (`max-w-home`). Final check: 640 (`max-w-column`). Step-complete card: 560 (`max-w-complete-card`) on `surface/subtle`.
- Spacing uses Tailwind's 4px unit, these steps only:

| Tailwind | 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| px | 0 | 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64 |

**Where things live:**

| What | Where |
| --- | --- |
| Token values (color, radius, shadows, named sizes) | `src/app/tokens.css`, named after the Figma variables (`text/primary` is `--text-primary`) |
| Tailwind names for tokens, type styles, breakpoints | `src/app/globals.css` (`@theme inline`) |
| shadcn semantic variables (`--background`, `--primary`, ...) | `src/app/globals.css`, mapped onto the tokens |
| Button, Collapsible, Dialog/Sheet, Checkbox, Tabs | `src/components/ui/` |
| Momentum components | `src/components/` |
| Screens | `src/components/screens/` |
| State: storage, reducer, store | `src/lib/storage.ts`, `src/lib/reducer.ts`, `src/lib/momentum-store.tsx` |
| Sample data | `src/data/sample-assignment.ts` |

`src/design-rules.test.ts` enforces the spacing steps and bans arbitrary values (`p-[13px]`) and hex colors in components.

## Colors

Light mode only. Neutral grayscale with no accent; emphasis comes from weight and near-black fills. The descriptive names are proposals.

| Token | Value | Name | Use |
| --- | --- | --- | --- |
| `text/primary` | #111111 | Ink | Body text, headings |
| `text/secondary` | #525252 | Pencil | Supporting text, labels, progress text |
| `text/tertiary` | #737373 | Faint pencil | Captions, estimates, placeholders, disabled text |
| `text/on-primary` | #ffffff | Paper | Text on primary buttons and checked checkboxes |
| `surface/page` | #ffffff | Paper | Page, cards, dialogs |
| `surface/subtle` | #f5f5f5 | Margin | Step-complete background, "Next up" well, hover on secondary |
| `surface/sunken` | #fafafa | Underlay | Return note on the working step |
| `border/default` | #e5e5e5 | Hairline | Dividers, cards, chips |
| `border/input` | #d4d4d4 | Rule | Inputs and secondary buttons at rest, dashed hidden-note row |
| `border/strong` | #111111 | Ink rule | Focused inputs, checkbox outline |
| `action/primary` | #111111 | Ink | Primary button, checked checkbox |
| `action/primary-hover` | #000000 | Deep ink | Primary hover |
| `progress/track` | #e5e5e5 | Hairline | Empty progress segments |
| `progress/fill` | #111111 | Ink | Filled progress segments |
| `overlay/scrim` | #111111 at 32% | Shade | Behind dialogs and the side panel |

Tailwind classes: `bg-surface-subtle`, `text-text-secondary`, `border-border-default`, `bg-action-primary`, and so on. Default Tailwind colors are removed, so only these exist.

Contrast on white: Ink 18.9:1, Pencil 7.8:1, Faint pencil 4.7:1 (4.35:1 on `surface/subtle`, which is below AA for body text). `border/input` is 1.5:1 against white.

## Typography

Inter (`--font-inter`), system-ui fallback. Fixed pixel sizes (product register). One utility per style sets size, line height, weight and letter spacing together:

| Utility | Size / line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `text-display` | 32 / 40 | 600 | -0.02em | Step title, screen h1 |
| `text-heading-l` | 24 / 32 | 600 | -0.01em | Section headings |
| `text-heading-m` | 18 / 26 | 600 | -0.005em | Card and "Next up" titles |
| `text-body-l` | 16 / 26 | 400 | | Notes, primary reading text |
| `text-body-l-strong` | 16 / 26 | 500 | | Emphasis in large body |
| `text-body` | 14 / 22 | 400 | | Default body |
| `text-body-strong` | 14 / 22 | 500 | | Button labels |
| `text-caption` | 13 / 20 | 400 | | Estimates, progress text, helper lines |
| `text-label` | 12 / 16 | 600 | | Small labels ("Where you left off") |
| `text-link` | Body Strong, underlined | 500 | | Tertiary text-link buttons only |

Use typographic apostrophes and quotes (’ “ ”), as in Figma.

## Elevation

Flat by default. Hierarchy comes from borders, gray surfaces and type, not shadows.
- `shadow-dialog` (0 12px 32px, 12% black): the pause dialog only.
- `shadow-side-panel` (-8px 0 32px, 10% black): the Plan / Original brief panel only.
- Both sit over `overlay/scrim`. Nothing else casts a shadow.
- Radii: `rounded-sm` 6px (buttons, inputs, chips, checkbox), `rounded-md` 8px (wells, Done when, notes), `rounded-lg` 12px (cards, dialogs), `rounded-full` (progress segments).

## Components

Every control shows the token focus ring on `:focus-visible` (2px white inner, 4px #111111 outer; one rule in `globals.css`, with a transparent outline for forced-colors mode). Transitions use `motion-reduce:transition-none`.

**Buttons** (`ui/button.tsx`). 44px (`h-button`) for primary and secondary, 32px (`h-button-text`) for tertiary, `rounded-sm`.
- Primary: Ink fill, Paper text. Hover: `action/primary-hover`. Disabled: `surface/subtle` fill, `text/tertiary`, not-allowed cursor.
- Secondary: Paper fill, `border/input`, Ink text. Hover: `surface/subtle`. Disabled: `text/tertiary`.
- Tertiary: underlined `text-link`. Hover: `text/secondary`. Disabled: `text/tertiary`.
- Use one primary per view. Undo, Hide note and Show note are tertiary.

**Text area** (pause dialog note). `border/input`, `rounded-sm`, `text-body-l`, `text/tertiary` placeholder. Focus: the border turns `border/strong` instead of showing the ring (handoff: "Focused or active input"). Its draft is stored separately from the saved note and survives close and reload.

**Checkbox** (`ui/checkbox.tsx`, final check). 20px (`size-checkbox`), `border/strong` outline, `rounded-sm`. Checked: Ink fill with a Paper check. Always labeled; Space toggles.

**Dialog** (pause). 520 (`max-w-dialog`), centered, `rounded-lg`, `shadow-dialog`, full width below 600px (`sm:`). Opens focused in the note field; Escape returns focus to the trigger. Closing keeps the draft and the saved note.

**Side panel / Sheet** (Plan, Original brief tabs). 520 (`max-w-side-panel`), docked right, full height, `shadow-side-panel`, full width below 600px. Opens on the Plan tab; arrow keys switch tabs.

**Return note.**
- Shown: `surface/sunken` well with the label "Where you left off · <saved time>" and a Hide note button.
- Hidden: a dashed `border/input` row reading "Your note is hidden for this step." with Show note.
- Static (home, review): Paper with a "Your note" label.
- Hiding never deletes the note.

**Progress.** One segment per step (derived from the plan, never a fixed count), plus a text line ("n of N steps done"). The segments are `aria-hidden`; the text carries the meaning.

**Chip.** Read-only requirement label: `border/default`, `rounded-sm`, `text-caption`.

**Timer.** Off by default, with five states. Hiding it doesn't pause it, and no timer action completes a step.

**Save status** (top bar). "Saved in this browser" only after a confirmed write; "Couldn’t save in this browser" when a write fails.

**Sizes:** plan badge 24px (`size-badge`), wordmark square 20px (`size-logo`).

## Do's and Don'ts

- **Do** use only the token classes. **Don't** use hex colors, arbitrary values (`p-[13px]`, `text-[#111]`), default Tailwind palette, or default shadcn styling.
- **Do** use only the spacing steps 0, 1, 2, 3, 4, 6, 8, 12, 16.
- **Do** derive every count (steps, segments, "n of N") from the data. **Never** assume six steps.
- **Never** write "submitted". **Never** write "saved" unless a write succeeded. "Progress saved" appears only right after a confirmed Finish for now.
- **Never** imply the final check verifies the work. It is the student's own review of their requirements.
- **Do** write estimates as approximate ("about 30 min for the full step").
- **Do** store `doneWhen` as the criterion only; the component adds "Done when" (or uses `doneWhenSentence`).
- **Never** delete user text on close, hide or failed save. Keep it in memory and say honestly that saving failed.
- **Do** keep one primary action per view, as visible text. **Don't** hide primary or return actions in menus, hover or icon-only buttons.
- **Don't** use color as the only signal. Done steps are struck through and checked, not just grayed out.
- **Don't** add shadows beyond the dialog and side panel. **Don't** add an accent color, celebrations, streaks or countdown pressure.
- **Don't** put `text/tertiary` body text on `surface/subtle` (4.35:1).
- **Do** keep Mark complete within 700px of the top at 1280×800, and keep layouts free of horizontal scroll down to 375px.
- **Don't** introduce Material 3 styling or a broad aesthetic redesign.
