# Design rules

Source: the handoff's "Design tokens", "Effects", "Layout" and "Components" sections.

## Where things live

| What | Where |
| --- | --- |
| Token values (color, radius, shadows, named sizes) | `src/app/tokens.css`, named after the Figma variables (`text/primary` is `--text-primary`) |
| Tailwind names for the tokens, type styles, breakpoint | `src/app/globals.css` (`@theme inline`) |
| shadcn semantic variables (`--background`, `--primary`, ...) | `src/app/globals.css`, mapped onto the tokens |
| Button, Collapsible, Dialog/Sheet, Checkbox, Tabs | `src/components/ui/` |
| Screens | `src/components/screens/` |
| State: storage, reducer, store | `src/lib/storage.ts`, `src/lib/reducer.ts`, `src/lib/momentum-store.tsx` |
| Momentum components | `src/components/` |
| Sample data | `src/data/sample-assignment.ts` |

Default Tailwind colors, radii, shadows and type sizes are removed, so only Momentum tokens exist as classes. Classes: `bg-surface-subtle`, `text-text-secondary`, `border-border-default`, `bg-action-primary`, `rounded-sm|md|lg`, `shadow-dialog`, `shadow-side-panel`.

## Spacing

Tailwind's 4px unit. Use only these steps:

| Tailwind | 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| px | 0 | 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64 |

`src/design-rules.test.ts` fails on any other step, on arbitrary values (`p-[13px]`) and on hex colors in components.

## Type

One utility per style: `text-display`, `text-heading-l`, `text-heading-m`, `text-body-l`, `text-body-l-strong`, `text-body`, `text-body-strong`, `text-caption`, `text-label`, `text-link` (underlined, for text-link buttons only). Each sets size, line height, weight and letter spacing together.

## Layout

- Top bar: 64px (`h-top-bar`), 32px side padding, 1px bottom border.
- Working step: 220px rail (`w-rail`), 64px gap, 640px column (`max-w-column`), centered, 40px top padding (`pt-step-top`), 24px between main sections (`gap-6`).
- Buttons: primary and secondary 44px (`h-button`), tertiary 32px (`h-button-text`), radius sm.
- Home and completed home: 720 column (`max-w-home`). Final check: 640 (`max-w-column`). Step-complete card: 560 (`max-w-complete-card`) on `surface/subtle`.
- Pause dialog: 520 (`max-w-dialog`), centered. Side panel: 520 (`max-w-side-panel`), docked right, full height. Both full width below 600px (`sm:` breakpoint).
- Checkbox 20px (`size-checkbox`), plan badge 24px (`size-badge`), wordmark square 20px (`size-logo`).
- Below 960px (`wide:` breakpoint) the rail stacks above the main column.
- Keep Mark complete within 700px of the top at 1280×800.

## Focus and motion

One rule in `globals.css`: every control shows the token focus ring (2px white inner, 4px #111111 outer) on `:focus-visible`. Text fields instead turn their border `border/strong` on focus (handoff: "Focused or active input"). Headings that receive focus on a route change (`tabIndex={-1}`) show no ring. Transitions use `motion-reduce:transition-none`.

## Copy

- Never write "submitted". Never write "saved" unless a write has succeeded.
- "Saved in this browser" appears only after a confirmed local write; "Couldn't save in this browser" if the write fails.
- Estimates are approximate ("about 30 min for the full step").
- Stored `doneWhen` is the criterion only; the component adds the "Done when" label, or "Done when " plus the criterion with its first letter lowercased in sentences (`doneWhenSentence`).
- Typographic apostrophes and quotes (’ “ ”), as in Figma.
- "Progress saved" only right after a confirmed Finish for now; never when the save failed.
