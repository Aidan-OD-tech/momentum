# Session feedback

Task-based sessions with at least two people (course requirement). **Aidan runs the sessions and fills in these files himself.** One file per participant, copied from [session-template.md](session-template.md) and named `p1.md`, `p2.md`, … Use participant codes, never names.

Nothing in this folder is written by Claude Code except this README and the empty template. No findings, quotes, counts or results are filled in for Aidan.

The session plan and observation sheet live in Aidan's session guide (`handoffs/m5-session-guide.md` in the Claude project, not in this repo). The template follows the three evaluation tasks in [MOMENTUM_CONTEXT.md](../../MOMENTUM_CONTEXT.md). **If the guide's sheet differs, the guide wins: change the template to match it before the first session.**

## Before each session

1. **Deployed build:** use the production URL. Check that "Use a sample brief" is **not** shown. `NEXT_PUBLIC_SHOW_SAMPLE_BRIEF` must be unset (or anything but `true`) in Vercel; see [deploy.md](../../deploy.md).
2. **Reset this browser** (below), or use a fresh Chrome Guest window, which starts with empty storage.
3. **Rate limit:** the plan route allows 5 builds per IP address per 10 minutes. If you built plans yourself on the same network in the last 10 minutes, the participant may get Error 03 ("Try again in a moment"). Don't test-build right before a session.
4. **Logs:** open Vercel → project → Logs, filter Environment: production, turn on **Live**. Hobby keeps logs for only **1 hour**, so copy the participant's `[api/event]` and `[api/plan]` lines into their file during or straight after the session.
5. Have the brief text ready for the participant to paste.

## Reset this browser

Momentum keeps everything in this browser's local storage, under two keys. To start the next participant clean:

1. Open the Momentum site in the browser you'll use.
2. Open DevTools (Cmd+Option+I in Chrome).
3. **Application** tab → **Storage** → **Local storage** → the site's address.
4. Delete **`momentum:v1`** (the plan, notes and progress) and **`momentum:v1:unreadable`** (a backup copy, present only if stored data was ever unreadable).
5. Reload. You should see brief entry with no "Saved in this browser".

There is deliberately no reset button in the product.

Also close any other Momentum tabs before a session. A second tab can overwrite the first one's progress (known issue, [risk review](../../reviews/2026-11-18-risk-pause-saving.md) item 1).

## After each session

- Fill in the participant's file the same day, from your notes.
- Copy the participant's lines into "Observed in sessions" in [measurement.md](../measurement.md).
- Link any problem you saw to a heuristic finding ID (H-01…) in [heuristic-evaluation.md](../heuristic-evaluation.md), or add a new one marked "(Aidan, from P1)".
