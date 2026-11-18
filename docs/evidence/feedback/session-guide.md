# Momentum · M5 session guide (for Aidan)

This is a guide for task-based sessions with at least two people on the deployed build. It uses the suggested tasks and measures from `docs/MOMENTUM_CONTEXT.md`. Write down only what happens. If something wasn't observed, leave it blank.

## Who and how

- **Participants:** at least 2, ideally 3–5. Look for students who have, or recently had, a written assignment, including anyone who tends to put work off. Don't use people who saw the Figma designs.
- **Length:** about 25–30 minutes each, in person or on a screen-share call.
- **Device:** a laptop at about 1280×800 in Chrome, using the deployed URL (https://momentum-five-xi.vercel.app). If you can, put a document window beside it, the way the product is meant to be used.
- **Before each session:**
  - clear Momentum's storage (see `docs/evidence/feedback/README.md`);
  - check that "Use a sample brief" is hidden;
  - open a fresh tab.
- **Brief to give them:** if they have a real brief of their own that they're happy to paste, use it, and note that they did. Otherwise, give them the PSYC 3024 essay brief as plain text to copy.
  - Remind them that the brief is sent to OpenAI. They shouldn't paste anything private.
- **Recording:** take notes. Record the screen only if they agree. Don't record their face or voice unless they agree to that too.

## Consent script (read aloud)

"I'm testing a study-planning tool I built for a course project, not testing you. There are no wrong answers, and anything confusing is useful to me. Please think aloud as you go. I'll take notes and use what I see, with no names, in my course writeup. If you're happy, I'll also record the screen. You can stop at any time. Is that OK?"

Write down that they agreed, and whether they agreed to screen recording.

## Tasks

Read each task as written, then stay quiet. If they're stuck for about 60 seconds, ask "What are you looking for?" Write down any help you give, word for word if you can.

**Task 1: Turn a brief into a plan and find the next action.**
"Here's an assignment brief. Use Momentum to turn it into a plan, then show me what you'd do first."
- **Success:** they build a plan and open step 1, or name it as the next action, without help.
- **Note:**
  - the time from pasting to Start step 1;
  - whether they read or edited the plan, and which parts;
  - their reaction to the total time;
  - any hesitation at building or at an error.

**Task 2: Pause with a note, then return.**
"Imagine you've got a few minutes into this step, but you have to stop. Leave it so you can pick it up later." When they finish, have them close the tab and chat for about 3 minutes about something unrelated. Then say: "You're back. Carry on where you left off."
- **Success:**
  - they pause with a note that would actually help them;
  - after reopening, they find and resume the same step, without help.
- **Note:**
  - whether they found Pause for later;
  - what they wrote, paraphrased, not quoted unless they agree;
  - whether they noticed "Progress saved" or the save status;
  - how long it took them to resume.

**Task 3: Finish and explain the final check.**
"Pretend you've done the work for each step. Take it to the end." On the final check, ask: "What does this checklist tell you? What doesn't it tell you?"
- **Success:**
  - they complete the steps and reach the completed home;
  - they say the check is their own self-check, and that Momentum didn't verify or submit anything.
- **Note:**
  - whether they used Undo, or would want to;
  - any belief that Momentum submitted or checked their work.

**Optional, if there's time:** edit one step's time estimate or Done when, then add a requirement. Note whether the "Requirements updated" notice made sense.

## After the tasks (questions)

1. On a scale of 1 to 5, how easy was it to know what to do next? Why that number?
2. What, if anything, made you hesitate?
3. How did the total time estimate feel?
4. Would you use something like this for a real assignment? When?
5. Is there anything you expected that wasn't there?

## Observation sheet (one per participant: `docs/evidence/feedback/P<n>-<date>.md`)

| Field | Notes |
|---|---|
| Participant (no name), and their context | |
| Consent, and screen recording yes/no | |
| Brief used (their own or PSYC 3024) | |
| Task 1 result (unaided / with help / not completed), time to Start step 1 | |
| Task 2 result, time to resume | |
| Task 3 result, and what they said the check means | |
| Help given (word for word) | |
| Issues seen (screen, what happened, severity 0–4) | |
| Ease of knowing what to do next (1–5), and their reason | |
| Answers to the other questions (paraphrased) | |
| Anything surprising | |

## Afterwards

- Combine all sessions into one patterns table: each issue, how many participants it affected, severity, and the M6 fix. Put it in `docs/evidence/feedback/summary.md`, and only after the sessions have run.
- **Primary measure, as observed:** how many participants (n of N) built a plan and began step 1 without help.
- **Complementary measure:** n of N resumed the right step after the pause, without help.
- Keep these observed numbers separate from the event data in `measurement.md`.
