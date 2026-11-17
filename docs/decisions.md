# Decisions

## 2026-11-17

**Tailwind CSS + shadcn/ui + Radix, restyled to Momentum tokens.** (Aidan) Default shadcn styling is not used. Only `button` and `collapsible` are installed; unused shadcn variables are removed.

**Keep Core 01's short "From your brief" line for M1.** (Aidan) Collapsed shows the short labels joined with " · "; expanded shows every requirement as a chip.

**Add `Step.intro?: string`.** Core 01 shows a context line under the step title; the handoff's data model has no field for it.

**Add `Requirement.shortLabel?: string`.** The collapsed "From your brief" line needs short forms like "APA 7th". Requirements without a shortLabel (the sample's substantive one) are left out of that line and still appear as chips when expanded.

**Display-state helper for the M1 preview.** `getStepDisplayStates(stepCount, n)` in `src/lib/step-state.ts`: steps before n are done, step n is current, later steps upcoming. It exists only so `/step/n` can show Core 01 and its siblings without storage. M2 replaces it with real step status.

**`cn()` is plain clsx, no tailwind-merge.** tailwind-merge reads custom `text-*` type styles as colors and drops one of them. The shadcn CLI's own `cn` package was replaced for the same reason: it is opaque and Aidan has to be able to explain every line.

**Icons are inline SVG, not lucide-react.** Six small icons; no dependency.

**Step title uses Heading L (24/32).** The brief said "Heading L or Display; match Core 01", but Core 01 could not be read. Switching is one class in `WorkingStep.tsx`.

**Step route is `/step/[n]` with `export const instant = false`.** Next 16 with Cache Components warns in dev that a route reading `params` may not navigate instantly. All data is in memory, so the route opts out.

**Disable Cache Components.** (Aidan, 2026-11-17) Removed `cacheComponents` and `partialPrefetching` from `next.config.ts` and the `instant = false` export from the step route. Reason: with Cache Components on, the first request to an invalid step returned HTTP 200 with the Not found page (later requests returned 404). Verified on `npm run build && npm start` with curl: `/step/abc`, `/step/0`, `/step/03`, `/step/-1` and `/step/1.5` each return 404 on the first request.
Known limit: once plans live in local storage, the server can't know how many steps a plan has. A well-formed number past the end of the stored plan (e.g. `/step/9` on a six-step plan) shows the Not found content from the client and cannot return HTTP 404. Plans are not capped at six steps to get around this.
