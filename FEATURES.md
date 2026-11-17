# FEATURES.md

What Momentum does, feature by feature. [docs/product.md](docs/product.md) is the source of truth for scope: if this file and it disagree, product.md wins and this file gets fixed. What has been checked, and how, is in [docs/status.md](docs/status.md).

**Status values used here.** `built`: in code on `feat/m2-core-loop`, not merged or deployed. `planned`: in the MVP, not in code yet. (This replaces /craft's "shipped", which means "in production"; nothing is deployed yet.)

## Summary
Momentum helps a student turn a dense assignment brief into manageable steps, start working, and return after a pause without rebuilding their context. It holds one active assignment at a time and saves it in the student's browser. The student does the work in their own tools; Momentum never sees, checks or submits it. There are three areas: planning (brief to plan), working through steps, and finishing with a final requirements check. Saving honestly in the browser runs underneath all three.

## Feature Map
| Area | Major features | Supporting features | Status |
|------|----------------|---------------------|--------|
| Planning | Brief entry, Plan building, Plan review and editing | | planned |
| Working through steps | Working step, Pause and return notes | Step completion and undo, Optional timer, Full plan and original brief | built |
| Finishing | Final requirements check | Completed home and review | built |
| Saving | Saved in this browser | | built |

## Needs Review
- Is "Saving" right as its own area, or should it be a supporting feature under Working through steps?
- Should Plan building and Plan review be one major feature ("Turn a brief into a plan"), since students experience them as one moment?
- The Marketing rows are written for a portfolio or case-study page, since there is no product site. Keep them, or drop the field?

## Planning

> **Area summary:** Gets a student from a pasted brief to a plan they trust: summary, requirements and steps with "Done when" criteria. Until M3, every plan is a copy of the sample assignment.

### Brief entry

| Field | Value |
|-------|-------|
| Scale | major |
| Status | planned (M3) |
| One-liner | Paste your assignment brief and an optional deadline. |
| Short | The student pastes the brief text and can add a deadline. PDF import is out of scope. |
| Marketing | Paste the brief as you got it. Add a deadline if you have one. |
| Technical | Pasted text only. Validation and empty states follow the handoff. Input is preserved if anything fails. |

### Plan building

| Field | Value |
|-------|-------|
| Scale | major |
| Status | planned (M3 building state, M4 real generation) |
| One-liner | Turns the brief into a summary, requirements and steps. |
| Short | One server-side model request returns structured plan data, which is validated before use. After that, navigating and editing never call the model again. |
| Marketing | Momentum reads your brief and suggests steps, each with what “done” looks like. |
| Technical | Server-side request with a validated structured output; the API key never reaches the browser. One indeterminate loading state unless real stages can be observed. The brief is kept when generation fails. Copy must say the brief is sent to an AI service even though progress stays in the browser. |

### Plan review and editing

| Field | Value |
|-------|-------|
| Scale | major |
| Status | planned (M3) |
| One-liner | Check and adjust steps, estimates and requirements before starting. |
| Short | The student can edit, add and delete steps, change estimates and edit requirements. Editing requirements updates the final checklist and shows "Requirements updated" without silently rewriting steps. |
| Marketing | It’s your plan. Change the steps, the estimates or the requirements before you begin. |
| Technical | Plans have any number of steps; nothing assumes six. Requirement edits flow to `finalChecks` only. |

## Working through steps

> **Area summary:** One step at a time, with the return context first. This is the core loop students come back to between sessions.

### Working step

| Field | Value |
|-------|-------|
| Scale | major |
| Status | built |
| One-liner | One step in focus: what to do and when it’s done. |
| Short | Shows the current step's title, intro, what to do, "Done when", an approximate estimate and the relevant brief requirements, with a rail of all steps alongside. Mark complete stays within 700px of the top at 1280×800. |
| Marketing | Just the step in front of you: what to do, and how you’ll know it’s done. |
| Technical | Route `/step/n`; malformed numbers return 404 from the server, while a number past the end of the stored plan shows Not found on the client with HTTP 200 (known limit). The rail stacks above the column below 960px. The "From your brief" line is collapsible. Focus moves to the h1 on route change. |

### Pause and return notes

| Field | Value |
|-------|-------|
| Scale | major |
| Status | built |
| One-liner | Leave yourself a note; it greets you when you return. |
| Short | "Pause for later" opens a dialog for an optional note. Finish for now saves it to that step. Home and the step then show it as "Where you left off". Notes can be hidden per step without being deleted. |
| Marketing | Stop whenever you need to. Leave a line for future you, and pick up exactly where you left off. |
| Technical | `note`, `noteSavedAt`, `noteHidden` and `pauseDraft` per step. The draft survives close and reload separately from the saved note; Finish for now clears it. "Progress saved" shows only after a confirmed write. Return note has Shown, Hidden and Static variants. |

### Step completion and undo

| Field | Value |
|-------|-------|
| Scale | supporting |
| Status | built |
| One-liner | Mark a step done, see what’s next, undo if needed. |
| Short | Mark complete leads to a "Step N done." screen with progress, the next step and an Undo. Undo restores the step's previous state, including its note. |
| Marketing | Finish a step and see what’s next. Undo if you clicked too soon. |
| Technical | Route `/step/n/done`. `lastUndo` stores the previous step fields; one level of undo. Progress counts come from the plan. |

### Optional timer

| Field | Value |
|-------|-------|
| Scale | supporting |
| Status | built |
| One-liner | An optional, off-by-default timer that never ends a step. |
| Short | Students can start a timer for the step and pause, hide or resume it. It is off by default and kept low-key so it doesn't add pressure. |
| Marketing | A timer if you want one, and none if you don’t. |
| Technical | Client-side only, never stored. States: off, running, running hidden, paused, ended. Time left comes from an end timestamp, so a sleeping tab stays accurate. Hiding doesn't pause it, and no timer action completes a step. The Ended state is announced through a live region. |

### Full plan and original brief

| Field | Value |
|-------|-------|
| Scale | supporting |
| Status | built |
| One-liner | The whole plan and the original brief, one click away. |
| Short | A side panel with Plan and Original brief tabs, available from the working step and the final check. |
| Marketing | The full plan and your original brief are always one click away. |
| Technical | Radix Sheet and Tabs, 520px, full width below 600px. Opens on Plan, arrow keys switch tabs, Escape returns focus to the trigger. Chips show full requirement labels. |

## Finishing

> **Area summary:** Closes the assignment honestly: the student reviews their own work against the requirements, and Momentum says plainly that it hasn't checked or submitted anything.

### Final requirements check

| Field | Value |
|-------|-------|
| Scale | major |
| Status | built |
| One-liner | Review your work against every requirement from the brief. |
| Short | After the last step, a checklist of every requirement, substantive ones first, for the student to tick. Finishing the review doesn't require every box ticked and doesn't mean the work is verified or submitted. |
| Marketing | Before you hand it in, go through the brief’s requirements one by one. Momentum can’t see your document, so the check is yours. |
| Technical | Route `/final`, which redirects home when it doesn't fit the state. `finalChecks` maps requirement id to ticked. The last step can be undone from here and ticks are kept. Finish review sets the assignment to completed. |

### Completed home and review

| Field | Value |
|-------|-------|
| Scale | supporting |
| Status | built |
| One-liner | See the finished assignment and start the next one. |
| Short | The completed home makes "Start a new assignment" the primary action. Review shows the plan, each step's note and the final checklist as read-only. Completed records stay in the browser, with no archive interface. |
| Marketing | Look back at what you did, then start the next one. |
| Technical | Route `/review`. `startNewAssignment` keeps the completed record and creates a new active one (a sample copy until M3). |

## Saving

> **Area summary:** Progress lives only in this browser, and the interface says exactly what has and hasn't been saved.

### Saved in this browser

| Field | Value |
|-------|-------|
| Scale | major |
| Status | built |
| One-liner | Progress is saved in your browser, and Momentum tells you if it isn't. |
| Short | Every change is written to local storage. "Saved in this browser" appears only after a confirmed write; if writing fails, the app keeps working in memory and says "Couldn’t save in this browser". No accounts or cloud sync. |
| Marketing | No account needed. Your progress stays in this browser, and if saving ever fails, Momentum tells you. |
| Technical | One versioned key, `momentum:v1`. Unreadable data is copied to `momentum:v1:unreadable` before starting fresh. If storage can't be read or backed up, the app stops writing for the session so nothing is overwritten. Writes happen after each reducer change in `momentum-store.tsx`. |
