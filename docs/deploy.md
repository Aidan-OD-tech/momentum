# Deploy (Vercel)

Production: https://momentum-five-xi.vercel.app (serves `main`). Each pushed branch gets its own preview URL.

From M4 the app needs one secret, `OPENAI_API_KEY`, used only by the server route `POST /api/plan`. `npm run build` still passes without it; without the key, every build attempt shows Error 03 and the server logs `missing OPENAI_API_KEY`.

## Steps for Aidan (M4)

1. **Local key.** Put the key in `.env.local` at the repo root:
   ```
   OPENAI_API_KEY=...
   OPENAI_MODEL=...   # optional; the code's default is in src/lib/server/openai.ts
   ```
   `.env*` is in `.gitignore`. Never paste the key into a chat, a prompt, an issue or a commit.
2. **Vercel.** Project → Settings → Environment Variables: add `OPENAI_API_KEY` (and `OPENAI_MODEL` if you want a model other than the default) for **Production** and **Preview**. Environment variables only reach new deployments, so redeploy afterwards (push a commit, or Deployments → ⋯ → Redeploy).
3. **Budget limit on OpenAI.** In the OpenAI dashboard, open the project the key belongs to and set a **monthly budget limit** (Settings → Limits). This is the only hard cap on spending: the route's rate limit lives in memory and is best effort on Vercel (see [decisions.md](decisions.md), M4). Since M7c the route allows 12 plans per IP in 10 minutes (was 5) and still 100 an hour overall. A full weekly upload of 8 briefs is about 8 requests, sent one at a time (Aidan measured 15–18 s each on the model in use), so budget for that. Also check that the project has **credit** and **access to the model** you use; without them the route answers 502 and the app shows Error 03.
4. **Never commit `.env.local`.** Before each commit, `git status` should not list it. If a key is ever exposed, revoke it in the OpenAI dashboard and create a new one.

## Steps for Aidan (M5)

1. **Sample-brief flag.** Leave `NEXT_PUBLIC_SHOW_SAMPLE_BRIEF` **unset** in Vercel for Production and Preview during the sessions: "Use a sample brief" is then hidden. For the case-study demo, add it with the value `true` and redeploy. The value is built into the page, so a change needs a new deployment. It isn't a secret.
2. **Analytics.** Nothing to enable. The project is on Hobby, where Web Analytics custom events aren't included, so the event goes to Momentum's own `POST /api/event` and shows in **Logs** (filter Environment: production, search `event=first_step_started`). Hobby keeps logs for **1 hour**: see [evidence/measurement.md](evidence/measurement.md).
3. **After pushing `feat/m5-evaluation`:** on the preview, confirm the button is hidden, build one plan, press Start step 1, and check that one `[api/event] event=first_step_started … env=preview` line appears in Logs (Environment: preview). Then reload and reopen step 1: no second line.

## Checks after a deploy (Claude Code, once the URL exists)

- `curl -s -o /dev/null -w "%{http_code}" -X POST <url>/api/plan` with no body: **400**.
- The same with a 13,000-character brief: **413** with `{"reason":"tooLong"}`.
- In a browser: the sample brief builds a plan; a recipe shows Error 02; six quick submits show Error 03 on the sixth.
- Record the URL and results in [status.md](status.md).

## Earlier: M3 preview

M3 needed no environment variables. Its preview steps and smoke test are recorded in [status.md](status.md), section M3.
