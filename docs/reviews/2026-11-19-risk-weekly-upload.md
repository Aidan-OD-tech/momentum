# /craft risk: a week's briefs at once (M7c, 2026-11-19)

Covers M7c on `feat/m7c-weekly-upload`: several brief drafts and the move from the old single draft, the build queue, saving each plan as it arrives, the 429 handling, the per-IP plan limit going from 5 to 12, and the two known limits (two tabs, a reload mid-queue). These are **recommendations, not decisions**. No code was changed for this review. Accepted items become M7c fixes only after Aidan's OK.

**Operating Conditions (PRODUCT.md):** lost work first, misplaced trust second; laptop, often split screen, short interrupted sessions; mixed skill, overwhelmed. Here, lost work means a brief's text, and misplaced trust means a student who believes every brief became a plan when one didn't. An interrupted, Sunday-evening upload raises Detectability: the student often looks away while plans build. Split screen makes a second tab plausible.

**Scoring:** Severity × Probability × Detectability, each 1–3. 18+ critical, 8–17 significant, 1–7 minor.

**Checked for this review (2026-11-19):**
- **Undo at 8 briefs (finding 3): reproduced** in a throwaway test, since deleted. On `/new`: 8 briefs with text → Remove brief 3 → Add another brief → type "New eighth" → Undo. Afterwards the 8 text areas read "Text 1" to "Text 8"; **"New eighth" was gone**. The cause is `undoRemove` in `src/components/screens/BriefFlow.tsx:127`, which cuts the list back to 8 with `slice(0, MAX_BRIEFS)`.
- **"Add another brief" on first run: reproduced.** With nothing stored, "/" shows brief entry with one "Add another brief" button. `BriefEntryScreen.tsx:118` renders it for both first run and `/new` whenever fewer than 8 briefs are on screen. The test "from first-run brief entry, it moves to /new" (`WeeklyUpload.test.tsx:276`) also clicks it.
- **Two tabs (finding 5): found by reading the code, not reproduced.** A test that rendered two "tabs" in one page proved nothing: one page gets no `storage` events, so it doesn't behave like two browser tabs. A Playwright check with two real tabs would confirm it.
- Code read for the rest: `src/lib/build-queue.tsx`, `src/lib/brief-drafts.ts`, `src/lib/reducer.ts` (`setBriefDrafts`, `addPlanFromDraft`), `BriefFlow.tsx`, `BuildQueueScreen.tsx`, `HomeListScreen.tsx`, `src/lib/server/rate-limit.ts`.

## Critical (18+)

None.

## Significant (8–17)

**[1] After a run ends, the briefs that weren't built don't show anywhere on the list.** S2 × P2 × D3 = **12**
- **Risk:** the list's "Building plans: X of N ready" line shows only while the queue runs. A brief can end up unbuilt in four ways: Error 02 or 03 for that brief, Stop after this one, a 429, or a reload mid-queue. In each case it stays a draft, but the list says nothing about it. A student who uploaded 5 briefs sees 4 assignments and may not notice the fifth is missing until its deadline. This is the misplaced-trust case: "I added my week" when one brief never became a plan.
- **Recovery:** the brief is kept, so nothing is lost. But the only way to find it is to open "Add assignments" and see it already filled in.
- **Fix:** when drafts with text remain and no queue is running, show one quiet line at the top of the list, linking to `/new`: "2 briefs not built yet" (wording for Aidan, below). This also covers a reload mid-queue (finding 6) and a single brief left typed in `/new`. Test: after a run with one unreadable brief, the list shows the line, and it goes away once that brief is built or removed.

**[2] After a 429 or Stop, the building screen gives no direct way back to the unbuilt briefs.** S2 × P2 × D2 = **8**
- **Risk:** when a run ends, the screen offers only "Go to your assignments". "Edit brief" appears only on unreadable rows. After a 429 the student reads "Try again in about 10 minutes" but has no button for it. Later they have to know to go to the list, then "Add assignments", to find the briefs again. Probability is 2, not 1: the per-IP limit is shared by everyone on one network. On campus Wi-Fi, or in participant sessions run in one room, 12 requests in 10 minutes is three students uploading 4 briefs each.
- **Recovery:** the briefs are kept; the path back is just hidden.
- **Fix:** once nothing is running and any brief isn't built, add a Tertiary "Back to your briefs" on the building screen (wording for Aidan). It does what Edit brief does now: clear the run and show entry with the remaining briefs. Separately, for M7d: run sessions on networks that don't share one IP, or space the sessions apart, and say so in the session guide.

## Minor (1–7)

**[3] Undo can silently drop a brief when 8 are on screen.** S2 × P1 × D3 = **6** (reproduced)
- **Risk:** with 8 briefs, remove one with text, then add a new one (back to 8), then press Undo. The removed brief comes back and **the last brief is cut off with no message**. The student's words vanish, which the prompt says must never happen. Probability is low (it needs exactly 8 briefs and that order), but Detectability is 3: nothing on screen says a brief went.
- **Recovery:** none. The cut brief is also gone from storage on the next save.
- **Fix:** offer Undo only while there is room. At 8 briefs, the notice reads "Brief 3 removed. Remove another brief to undo." (wording for Aidan), with no Undo button. Never cut the list. Test: the exact sequence above keeps all 9 briefs' text reachable or offers no Undo.
- Recommended even though it scores minor: it is a verified loss of typed text, and the fix is a few lines.

**[4] The old and new draft shapes can both be stored, and then the old one is dropped.** S2 × P1 × D3 = **6**
- **Risk:** this can only happen during a deploy, while a tab still running the M7b build stays open. That old tab writes `briefDraft` and keeps `briefDrafts` as it is. `readBriefDrafts` prefers `briefDrafts` (`brief-drafts.ts:10`), so the newer text in `briefDraft` isn't shown, and the next write removes it.
- **Recovery:** none, and invisible.
- **Fix:** when both are stored and the `briefDraft` text isn't one of the `briefDrafts`, read it as one more brief at the end. Test both shapes together.

**[5] Two tabs can build the same briefs twice, or bring back briefs already built.** S2 × P1 × D2 = **4** (from reading the code)
- **Risk, two ways:**
  - **Both tabs start a queue on the same drafts.** Each tab has its own queue in memory, and nothing is stored to say a brief is being built (by design: no queue state in storage). `addPlanFromDraft` always adds a plan (`reducer.ts:93`), so every brief becomes two plans. That costs two model requests per brief and leaves duplicate rows on the list.
  - **One tab sits on `/new` while the other builds.** The waiting tab keeps the briefs it read when it opened (`BriefFlow.tsx:53`). If the student types there, its next save writes back the whole list, including briefs the other tab has already turned into plans. Building again then makes duplicates.
- **Recovery:** duplicate plans are visible on the list and harmless to leave, but they cost requests and attention.
- **Fix:**
  - (a) Before each request, the queue checks that the brief's draft is still stored. If it's gone (built or removed elsewhere), skip it and mark the row "built in another tab" (wording for Aidan). That's a small change with a test.
  - (b) When another tab changes the stored drafts and this tab hasn't edited its briefs since opening, load the new drafts.
  - Recommend (a) now; (b) only if sessions show two tabs in use. Record what's left in decisions.md: two queues started at the same moment can still build one brief twice.

**[6] A reload mid-queue stops it without saying so, and the request that was out is wasted.** S1 × P2 × D2 = **4**
- **Risk:** the screen says "Keep this tab open", but a reload, a closed laptop lid or a crash stops the queue. The request that was out still runs on the server and counts against the 12 per 10 minutes, but its plan is thrown away. After the reload, the list shows the plans already built and nothing about the rest (finding 1).
- **Recovery:** the briefs not built are still drafts, so nothing is lost.
- **Fix:** finding 1's line covers it. Don't add a "leave this page?" prompt: the browser's wording is generic, and asking every time adds friction for little gain.

**[7] If storage fails mid-queue, requests keep going for plans that can't be saved, and the list calls them "Ready to review".** S2 × P1 × D2 = **4**
- **Risk:** after the first failed write, every later write fails too, because the store stops writing for the session. The queue still sends the remaining requests. Each plan is then shown as "built, but not saved in this browser" and kept only in memory, while the list shows those plans with the "Ready to review" chip. The top bar says "Couldn't save in this browser", but a student may review and start a plan that disappears on reload.
- **Fix:** stop the queue after the first plan that wasn't saved, as for a 429, so the rest stay drafts. Show the save failure once on the building screen. Leave the list as it is: the top bar already says saving failed, and the same is true of every screen today.

**[8] A second removal replaces the first one's Undo.** S2 × P1 × D2 = **4**
- **Risk:** removing brief 2 (with text), then brief 4 (with text), leaves only "Brief 4 removed. Undo". Brief 2's text can no longer be brought back. It was removed on purpose, so the score stays low.
- **Fix:** keep one notice per removed brief this visit, each with its own Undo, or keep the single notice but say how many: "2 briefs removed. Undo" restores both. Recommend the second, which stays simple.

**[9] Focus is lost when Stop, Try again or the running buttons disappear.** S1 × P2 × D2 = **4**
- **Risk:** pressing "Stop after this one" replaces the button with a caption. Pressing "Try again" changes the row to waiting and removes its button. When the run ends, the Secondary "Go to your assignments" becomes a different Primary button. Each time, a keyboard or screen-reader user is left on the page body.
- **Fix:**
  - After Stop, focus "Go to your assignments".
  - After Try again, focus that row's text: give it `tabIndex={-1}`, the same pattern as the headings.
  - When the run ends, move focus only if it was on a button that went away.
  - Tests for each.

**[10] At 12 per IP, one address can use more of the shared hourly limit.** S2 × P1 × D2 = **4**
- **Risk:** at 5 per 10 minutes, one IP could use at most 30 of the 100 plan requests per hour. At 12, it can use 72. One heavy user, or a script, can leave everyone else on Error 03 for the rest of the hour. And because each Vercel instance keeps its own count, the real total can be higher. The OpenAI monthly budget is still the only hard cap, as deploy.md says.
- **Fix:** no code change now. Before the sessions, check that the OpenAI budget limit and its email alert are set (deploy.md step 3), and look at the plan log lines (`[api/plan]`) for 429s after each session day.

**[11] An unreadable row asks the student to edit the brief while there's no button to do it.** S1 × P2 × D1 = **2**
- **Risk:** while other briefs are still building, the row says "Your brief is kept. Edit it and try again." but "Edit brief" shows only after the run ends.
- **Fix:** while running, say "Your brief is kept. You can edit it once the others are done." (wording for Aidan).

**[12] Brief numbers change after Edit brief.** S1 × P2 × D1 = **2**
- **Risk:** the building screen said "Brief 2 · couldn't find clear requirements". Edit brief opens entry with only the briefs not built, so that brief is now "Brief 1", or it's the only one, labelled "Assignment brief".
- **Fix:** none needed if the student sees their own text. If sessions show confusion, show the first words of each brief in its row instead of a number.

## The two known limits

- **Two tabs starting a queue on the same drafts:** finding 5. Also, in a second tab the list doesn't show "Building plans" for a queue running in the first tab, so that tab's "Add assignments" opens entry and can start the second queue. Fix (a) of finding 5 is the guard.
- **A reload mid-queue:** findings 6 and 1. Nothing is lost: built plans are stored, and the rest are drafts. What's missing is telling the student; finding 1 fixes that.

## "Add another brief" on first run

**It shows.** On first run, with nothing stored, "/" has one "Add another brief" button (Secondary) under the deadline field, so a student can find the weekly upload from the very first screen. Two observations, both for `/craft signal` rather than risk:
- The first-run intro ("Paste your brief. Momentum suggests a plan…") doesn't say you can add several. The `/new` intro does.
- On first run, building two or more briefs moves to `/new`, so the heading changes to "Add this week's assignments" mid-flow. That's harmless, but participants may comment on it.

## Edge cases not handled

- A brief with only spaces counts as empty and is skipped, but stays stored if it has a deadline. A card with only a deadline shows again next visit with no text.
- Two briefs that produce plans with the same title are both listed with nothing to tell them apart except course and deadline.
- A brief that takes longer than the server's 45 s timeout gets 504 → "couldn't build this plan" → Try again. That's correct, but Try again costs another request against the 12.
- Browser back from the building screen goes to wherever the student was before (often the list); the queue keeps running, which is fine.
- Eight briefs of 12,000 characters each is about 100 KB in local storage, well inside the usual 5 MB.

## Development copy for Aidan's wording approval

| Where | Current development copy | Notes, and an alternative if you want one |
| --- | --- | --- |
| Building screen, a brief not sent after Stop or a 429 | "Brief N · not built yet" | Says nothing was lost only by implication. Alternative: "Brief N · not built yet · your brief is kept" |
| Building screen, after "Stop after this one" is pressed | "Stopping after this one." | Alternative: "Stopping after the plan being built now." |
| Building screen, a plan built but its write failed | "<title> · built, but not saved in this browser" | Must not say "ready". Alternative: "<title> · built, but couldn't be saved in this browser. It's gone if you reload." That's more alarming but true; pairs with finding 7. |

New copy proposed in this review, also for approval:
- Finding 1: "2 briefs not built yet" (link to `/new`). One: "1 brief not built yet".
- Finding 2: "Back to your briefs".
- Finding 3: "Brief 3 removed. Remove another brief to undo."
- Finding 5: "Brief N · built in another tab".
- Finding 8: "2 briefs removed." with "Undo".
- Finding 11: "Your brief is kept. You can edit it once the others are done."

## Recommended order, if accepted

1. Finding 3 (verified text loss; a few lines).
2. Finding 1 (the list line).
3. Finding 2 (Back to your briefs), plus the M7d session-network note.
4. Finding 5a (skip briefs no longer stored).
5. Findings 7, 9, 4, 8, 11, in that order.

Leave 6, 10 and 12 as they are and record them.
