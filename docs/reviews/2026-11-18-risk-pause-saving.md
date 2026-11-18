# /craft risk: pause, return, saving, and the first_step_started event (2026-11-18)

Covers the pause dialog and Finish for now, returning (home after a pause, Resume, the return note), step completion and Undo, saving in local storage (the save indicator, "Progress saved", the unreadable-data backup), and the M5 event (`POST /api/event`). These are **recommendations, not decisions**. Nothing here changes behavior in M5. Accepted items go to "M6 candidates" in [decisions.md](../decisions.md) only after Aidan accepts them.

**Operating Conditions (PRODUCT.md):** lost work first, misplaced trust second; laptop, often split screen, interrupted sessions over hours or days; mixed skill, overwhelmed. For these flows, lost work means a note, a pause draft or progress. Misplaced trust means "Saved in this browser" being read as "safe". Interrupted, multi-day use raises Detectability scores. Split-screen use makes a second Momentum tab plausible.

**Scoring:** Severity × Probability × Detectability, each 1–3. 18+ critical, 8–17 significant, 1–7 minor.

**Checked for this review (2026-11-18, production build, Chrome via Playwright):**
- **Two tabs (item 1)**: reproduced with `docs/evidence/test-results/m5-scripts/tabs.mjs`. Tab A saved the note "Note written in tab A" and showed "Progress saved". Tab B, still on step 1, then pressed Mark complete. Afterwards the stored note was `""` and tab B's top bar read "Saved in this browser".
- **No `storage` event listener:** `src/lib/momentum-store.tsx` reads local storage once, on load.
- **Vercel Hobby runtime logs (item 8):** kept for **1 hour** ([docs](https://vercel.com/docs/logs/runtime), "Limits", updated 2026-08-28). Web Analytics custom events need Pro or Enterprise ([docs](https://vercel.com/docs/analytics/custom-events)). Aidan confirmed the project is on Hobby.

## Critical (18+)

None.

## Significant (8–17)

**[1] A second Momentum tab overwrites saved work.** S2 × P2 × D3 = **12** (verified)
- Risk: each tab keeps its own copy in memory and writes the whole object after every change. The scenario:
  1. A tab from yesterday is still open.
  2. The student opens Momentum in a new tab, pauses with a note, and later goes back to the old tab.
  3. Any action in the old tab (open a step, Mark complete, hide a note) writes its old copy over the new one.

  The note, and any steps completed in the other tab, are gone. The old tab says "Saved in this browser", which is literally true and still misleading.
- Detectability: nothing signals it. The loss shows only on the next return, maybe days later.
- Recovery: none.
- Recommendation (M6): listen for the browser's `storage` event in `MomentumProvider` and replace the in-memory data with what another tab wrote. That's about 10 lines, with the same `parse` and backup rules as `load()`. A full merge isn't needed: the newest write wins, but every tab sees it before acting.

**[2] "Saved in this browser" on a computer that forgets.** S2 × P2 × D3 = **12**
- Risk: on a lab or library computer that wipes on logout, in a private window, or after "clear browsing data", every write succeeds and the indicator is truthful. But the student reads it as "my progress is kept" and comes back to an empty brief entry. "Lost work" is the first risk in PRODUCT.md.
- Current copy: brief entry says "Your plan and progress stay in this browser." Nothing mentions shared or private computers.
- Recovery: none (the data is gone).
- Recommendation: observe whether participants assume it syncs ("Will this be here on my phone?"). If they do, M6 adds one plain sentence where it matters (e.g. under the completed or paused home: "Saved only in this browser on this computer."). Don't add a warning dialog.

**[3] The save failure is quiet and isn't announced.** S2 × P1 × D3 = **6** on its own; listed here because it combines with [1] and [2].
- Risk: when a write fails, the only signal is "Couldn’t save in this browser" in the top-right caption. It is 13 px and `text/secondary`, with no icon and no live region, so screen-reader users never hear it (WCAG 4.1.3). An interrupted student who closes the tab loses everything since the failure.
- What's right: "Saved" and "Progress saved" never show after a failed write (tested in M2).
- Recommendation (M6): put the indicator in a polite live region. Consider showing the failed state in the content area too, on the screens where work is entered (working step, pause dialog), not only in the corner.

**[4] The event's numbers disappear after an hour.** S2 × P3 × D2 = **12** (cost to the evaluation evidence, not to students)
- Risk: on Hobby, runtime logs (where `/api/event` writes) are kept for 1 hour. Anything not read within the hour is lost, so the "gathered after launch" numbers can't be built up over days without someone watching.
- Recommendation: for the sessions, keep the Logs tab open in Live mode and copy each line into the session file straight away (docs/evidence/feedback/README.md). After launch, Aidan decides between:
  - (a) reporting only what was copied within the hour;
  - (b) a paid plan, Log Drains or a store. Each is a scope or cost change, so not in M5.

**[5] Counts include Aidan, previews and bots.** S1 × P3 × D3 = **9**
- Risk: every production build sends the event: Aidan's own checks on production, Vercel previews (also `NODE_ENV=production`), session runs and scripted calls to the public route. A raw count overstates real use.
- Recommendation:
  - filter the logs to Environment = production;
  - write down when Aidan tested;
  - keep "observed in sessions" and "gathered after launch" apart (measurement.md does).

## Minor (1–7)

**[6] Clearing the note field and pressing Finish for now deletes the saved note.** S2 × P1 × D2 = **4**
- The dialog opens with the saved note (or the draft). Emptying it and finishing removes the note by design ("Empty means no note"), with no undo and no message. Recommendation: keep the behavior, and watch for it in Task 2.

**[7] A mistaken Mark complete can't be undone once the student moves on.** S1 × P2 × D2 = **4**
- Undo is one level and is cleared when another step starts. A done step opened from the rail stays done. The note survives, so no text is lost, but progress is wrong. Recommendation: leave it unless sessions show it.

**[8] A pause draft typed in the last 300 ms before the tab closes is lost.** S1 × P1 × D3 = **3**. The draft is written 300 ms after typing pauses, and on close of the dialog, but not on tab close. Recommendation: none for now.

**[9] Unreadable data starts fresh with no message.** S2 × P1 × D1 = **2**
- The student sees brief entry and notices at once, but the backup in `momentum:v1:unreadable` is reachable only through DevTools. Recommendation: none for the MVP. The rule is "never overwrite", and that holds.

**[10] A previous participant's plan is still in the browser.** S2 × P2 × D1 = **4** (session-only)
- If storage isn't cleared between sessions, the next participant sees someone else's brief and notes, and the "first visit" task is spoiled. Recommendation: the reset steps in [feedback/README.md](../evidence/feedback/README.md). A fresh Chrome Guest window per participant is the simplest way to start clean.

**[11] An event lost on the way.** S1 × P2 × D3 = **6**
- A blocked request (an extension, the network) means no event; the request is sent once and never retried. That undercounts. The student never sees it: a failed send is ignored (tested). Recommendation: read the after-launch numbers as a lower bound.

**[12] "Started step 1" isn't "began the work".** S1 × P2 × D3 = **6**
- A student may press Start step 1 just to see the step. Recommendation: measurement.md says so, and the sessions show what happens next.

**[13] Two tabs on plan review send two events.** S1 × P1 × D3 = **3**. This is the same root cause as [1]. Fixed by the same `storage` listener.

**[14] Forged events.** S1 × P1 × D3 = **3**
- Anyone can post a valid body. The rate limit (10 per IP per 10 minutes, 300 per hour, best effort) bounds it. The numbers are indicative, not proof.

**[15] "Anonymous" in the disclosure.** S1 × P1 × D2 = **2**
- True of what Momentum sends: a bucket and a count, no text, no ids, no IP logged by the route. Vercel's own platform logs record request details for every request, as for any hosted site, for their retention period. Recommendation: Aidan approves the wording. Don't claim more than "anonymous usage".

## Edge cases not handled

- Plans saved before M5 have no `planCreatedAt`, so they never send the event (by design; there's no honest time to bucket).
- The device clock changes between plan creation and Start step 1: the bucket is off by the change. Negligible.
- Two browsers or devices: each has its own data. This is by design (no sync), and the measure counts browsers, not people.

## For M6, if Aidan accepts

| # | Item | Size |
| --- | --- | --- |
| 1, 13 | `storage` event listener so tabs stay in step | small |
| 3 | Save indicator in a live region; failed state visible near the work | small |
| 2 | One sentence on "this browser on this computer", if sessions show the assumption | copy only |
| 4 | Decide how after-launch numbers are kept (copy within the hour, or a paid plan / drain / store) | decision |
