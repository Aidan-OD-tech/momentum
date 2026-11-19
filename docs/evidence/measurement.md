# Success measure and the one tracked event

Defined in M5 (2026-11-18) from the proposed measures in [MOMENTUM_CONTEXT.md](../MOMENTUM_CONTEXT.md) ("Course obligations and evidence"). Decisions: [decisions.md](../decisions.md), M5.

## The question

Can a student who arrives with a brief **identify and begin the next action without help**? Momentum's job is to get them from "I have to do this essay" to working on the first step, and back to the right step after a pause.

## Primary measure: starts within the first visit

**The share of created plans where step 1 is opened in the same browser within 15 minutes of the plan being created.**

- Numerator: `first_step_started` events whose bucket is `<2`, `2–5` or `5–15` (under 15 minutes).
- Denominator: plans created in the same period. That's `[api/plan] 200 ok` lines in the server log; each one is a plan returned to a browser.
- Plans never started appear only as the gap between the two counts. Plans started after 15 minutes or more show as bucket `>15`. They count as started, not as started within the first visit.

Why 15 minutes: plan review takes a few minutes to read, and an edit or two fits within 15. A start after that most likely means the student left and came back.

## Complementary measure: comes back and resumes

**The share of paused steps where the student later resumes the same step.**

This is **not instrumented**: M5 adds one event only. It is observed in the sessions (Task 2) and, after launch, isn't measured. Counting it would need a second event (pause and resume), which is Aidan's call for a later milestone.

## The event

`first_step_started` is sent when Start step 1 is pressed for the first time on a plan. It has two properties:

| Property | Values |
| --- | --- |
| `minutesSincePlanCreated` | `<2`, `2–5`, `5–15`, `>15`: under 2 minutes; 2 to under 5; 5 to under 15; 15 or more |
| `stepCount` | the plan's number of steps when it was started (1 or more) |

Nothing else is sent: no brief, plan or note text, no ids, no timestamps. The route logs no IP address.

**Once per plan.** `createPlan` records `planCreatedAt`; Start step 1 records `firstStepStartedAt`. The event is built only while `firstStepStartedAt` is unset, so a reload, Undo or reopening step 1 sends nothing more. Tests: `src/lib/first-step-event.test.ts` and `src/components/screens/PlanReviewScreen.test.tsx`.

**Only from a production build.** `npm run dev` and tests never send it (tested). Vercel previews and `npm start` are production builds, so they do send it.

**Where it goes.** Web Analytics custom events need a Pro or Enterprise plan; the project is on Hobby (Aidan, 2026-11-18). So the browser posts to `POST /api/event` on Momentum itself. The route:
- accepts only this name and these two fields (strict zod schema; anything extra → 400);
- rejects bodies over 256 characters (413);
- rate limits to 10 per IP per 10 minutes and 300 per hour (429);
- writes one line, and stores nothing:

```
[api/event] event=first_step_started stepCount=6 bucket=2–5 env=production
```

`env` is Vercel's `VERCEL_ENV`: `production`, `preview` or `development`, and `unknown` outside Vercel (`npm start` on a laptop). Only `env=production` lines count toward the measure.

## How Aidan reads the numbers

1. Vercel → the Momentum project → **Logs**.
2. Filter **Environment: production** (previews are separate), and set the time range.
3. Search `event=first_step_started env=production` for the starts, and `[api/plan] 200 ok` for the plans created (that line has no `env=` tag, so rely on the Environment filter for it).
4. Count the start lines by `bucket=`. Primary measure = (starts with `<2`, `2–5` or `5–15`) ÷ plans created.

**Retention: Hobby keeps runtime logs for 1 hour** ([Vercel docs](https://vercel.com/docs/logs/runtime), "Limits"). Lines older than an hour are gone. In practice:
- **During a session:** keep Logs open in **Live** mode and copy the participant's lines into your session notes straight away.
- **After launch (on Hobby):** numbers exist only for the hours when someone copied them.

**Sessions vs a real launch.** The 1-hour window suits the sessions: Aidan is watching, and he copies each participant's lines within the hour. A real post-launch deployment would need durable collection instead, without adding a database to Momentum:
- **Vercel Web Analytics custom events** (Pro plan): `track("first_step_started", { … })` with the same two properties, counted in the Analytics dashboard;
- or a **Vercel log drain**, which forwards the existing `[api/event]` lines to a log service that keeps them.

Either way, observed session results and post-launch telemetry stay in separate tables (below) and are never added together. Neither is built for M5.

Before counting, leave out:
- Aidan's own test runs on production (note their times);
- session participants, who are counted separately below;
- anything that looks scripted (bursts from one source).

## What the measures can and can't show

They **can** show whether a plan led to pressing Start step 1, and how soon, without anyone watching.

They **can't** show:
- **whether any work was done**, in the student's own tools or at all. Pressing Start step 1 isn't writing a sentence, and a student may press it only to look;
- **people**: they count browsers. One student in two browsers is two; two students on one lab computer can look like one;
- **visits across devices**: data lives in one browser's local storage, so a plan made on a laptop and continued on a phone isn't linked;
- **plans from before M5**: they have no creation time, so they never send the event;
- **every start**: a blocked or failed request is not retried, so counts are a lower bound;
- **why**: a low number says something is in the way, not what.

## If the primary measure is low

Likely causes, and what Aidan would change (each tied to the heuristic evaluation and session observations, not guessed):

| Possible cause | What to look at | Possible change |
| --- | --- | --- |
| Plan review is too long to get through | Start step 1 sits about 1,315 px down at 1280×800, below six step rows | Shorter rows, or bring Start step 1 within view |
| Estimates feel daunting | Generated plans for the sample brief total about 6.5 h (hand-written: 3 h 20 min) | Tune the prompt toward smaller first steps; show step 1's own estimate prominently |
| Start step 1 is hard to find | Participants scroll or hesitate on plan review | Make the next action visible without scrolling |
| The plan isn't trusted | Participants reopen the original brief to check requirements | Clearer requirement chips, or say where each came from |
| Step 1 is too big to begin | The first step's "Done when" sounds like a lot of work | Instructions ask for a 5–15 minute first step |

## Numbers

Keep the two kinds apart. Never combine them in one figure.

### Observed in sessions (Aidan fills in; nothing here is real until he does)

| Participant | Plan built | Started step 1 without help | Minutes from plan to Start step 1 (observed) | Event line seen in the log | Paused and resumed the same step without help |
| --- | --- | --- | --- | --- | --- |
| P1 | | | | | |
| P2 | | | | | |

### Gathered after launch (from the event; Aidan fills in)

| Period (dates, UTC) | Plans created (`[api/plan] 200 ok`) | Starts `<2` | `2–5` | `5–15` | `>15` | Primary measure | Excluded (and why) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |
