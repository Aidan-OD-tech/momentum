# M7: several assignments at once (plan)

Status: **planned**, not built. Written 2026-11-18 from Aidan's request in the project thread:
"add multiple assignments at a time ... it's Sunday and you want to upload all your assignments for the
week ... the homepage turns into a list of current assignments, prioritized by predicted time left and deadlines."

## 1. This is a scope change (flag)

- `docs/MOMENTUM_CONTEXT.md` (professor feedback): "Defer calendars, time analytics, and **multiple-assignment management**."
  `docs/product.md` lists multiple-assignment management under **Out**. DESIGN.md: "should read like a calm, well-marked page, **not a dashboard**."
- Aidan owns the product and this is his explicit decision, so it can go ahead, but the case study should say
  plainly that it reverses an earlier recommendation and why. It is Aidan's idea, **not** participant feedback;
  don't present it as research-driven unless a session actually surfaces it.
- Evidence impact: the M5 session guide's three tasks are all single-assignment, and no participant sessions or
  VoiceOver pass have run yet. If M7 ships before the sessions, participants will test a different home screen
  from the one the heuristic evaluation and session guide describe, and the guide needs a new task.

**Decision (Aidan, 2026-11-18): build M7 first, then run the participant sessions on the new build.** The session guide gets a weekly-upload task in M7d, before any session.

## 2. What the current code already gives us (checked in the repo, 2026-11-18)

- `MomentumData` already stores `assignments: Assignment[]` plus `activeAssignmentId`. Completed records already
  stay in the array. So **no storage version bump or migration is needed**; new fields can be optional, as M3 and M5 did.
- Every route (`/plan`, `/step/[n]`, `/final`, `/review`) acts on the open assignment (`activeAssignmentId`).
  Recommended: keep those routes and make "open an assignment" set `activeAssignmentId`. Changing URLs to
  `/a/[id]/step/[n]` is cleaner but touches every screen and test; not worth it for this course build.
  Known limit: two tabs open on different assignments will switch each other (the storage event syncs `activeAssignmentId`).
- `/api/plan` makes one model call per brief, 15–18 s each on gpt-6.1-terra, limited to **5 per 10 minutes per IP**
  and 100 per hour overall (in memory, best effort). A Sunday upload of 6 briefs would hit the per-IP limit.

## 3. Recommended design

**Time left** = the sum of `estimateMin` for steps not done. A step in progress counts in full, because Momentum
doesn't track partial work (the timer is optional and off by default). Label it as approximate:
"About 2 h 30 min of steps left", never a countdown.

**Order on home** (simple enough to explain in one sentence to a participant):
1. Assignments with a deadline, soonest first. A date with no time counts as the end of that day.
2. Same deadline: more time left first.
3. No deadline: after the dated ones, oldest plan first.
4. Finished assignments: a quiet "Finished" list below, newest first (keeps "retain completed records" without an archive UI).
A deadline that has passed stays in order with neutral copy ("Due date passed"), no red and no warning icon (principle 5, no pressure).

Not recommended: a "start-by" or slack score (deadline minus time left). It assumes the student works without
breaks, is hard to explain, and in practice orders almost the same as deadline-first.

**Weekly upload**: a brief entry that holds several briefs (each its own text and optional deadline), then one
`/api/plan` request per brief, **one at a time**, each with its own honest status (waiting, building, ready to
review, couldn't build). A failed brief keeps its text and gets its own Try again. Each plan lands in `review`
and shows "Ready to review" on the home list; the existing plan review screen is reused unchanged.
Rate limit: raise the per-IP plan limit modestly (for example 12 per 10 minutes) and keep the global limit and
the OpenAI monthly budget as the real cost guard. Batching several briefs into one model call is not recommended:
one bad brief or a token cut-off would fail the whole week.

**Figma**: new frames on the existing "Design additions (post-R3)" page, labeled M7: Home list (with
ready-to-review, in progress, not started, no deadline, due passed, finished), Weekly upload entry, and
Building several plans. No existing frame is edited.

## 4. Milestones (each one a branch and a PR)

| | Scope | Visible change |
|---|---|---|
| **M7a** | Data and ordering logic: `openAssignment` action, `remainingMinutes`, `prioritize`, storage tests, docs record the scope change | None |
| **M7b** | Home list: "/" shows the prioritized list; opening one shows today's per-assignment home; "Add assignments" | Yes |
| **M7c** | Weekly upload: several briefs, sequential generation queue, per-brief errors, drafts kept across refresh, rate-limit change | Yes |
| **M7d** | Polish and evidence: axe and keyboard pass, 600 px check, session guide task update, decisions and status, screenshots | Docs |

M7b and M7c need the Figma frames first (or Aidan's OK to build from this plan and draw afterwards).

## 5. Figma drafts (2026-11-18, for Aidan's review)

Drawn on the existing "Design additions (post-R3)" page (35:1708). No existing frame was edited.
- `M7-1 · Home — your assignments` (63:361): Up next card (reuses the Core 05 card), then "After that" rows, a "No deadline" group and a collapsed "Finished (2)".
- `M7-2 · Add this week’s assignments` (64:426): brief cards, each with Remove and an optional deadline; "Add another brief"; "Build 2 plans" (empty briefs are skipped).
- `M7-3 · Building your plans` (64:491): Status rows per brief (ready, building, couldn't build with Try again, waiting); "Go to your assignments", "Stop after this one".
- New local component `M7 · Assignment row` (62:359): Meta, Title, Status, Show chip ("Ready to review"); nested Secondary button "Review plan" / "Open".
Not drawn yet: due date passed, 600 px width, the empty list.
