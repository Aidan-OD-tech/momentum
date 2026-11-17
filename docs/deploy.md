# Preview deploy (Vercel)

M3 needs no environment variables or secrets. `npm run build` passes with none set and there are no `.env` files in the repo.

## Steps for Aidan

1. Push the branch: `git push -u origin feat/m3-plan-entry-and-review`.
2. In Vercel, choose **Add New → Project**, import `Aidan-OD-tech/momentum`, keep framework **Next.js** and the default settings, and add **no** environment variables. Deploy.
3. Vercel gives the branch a **preview URL**. Each later push to the branch redeploys it.
4. Open the preview URL in a **private window**. If Vercel asks you to log in, Deployment Protection is on: Ryan and Aishi won't be able to open it either. Turning it off (Project → Settings → Deployment Protection) is your decision.
5. Send the preview URL to Claude Code for the smoke test.

## Smoke test (Claude Code, once the URL exists)

- `curl -s -o /dev/null -w "%{http_code}"` on `/` (200), `/plan` (200) and `/step/abc` (404).
- In a browser: empty storage shows brief entry with no save indicator; the sample brief with a deadline override reaches plan review with matching due text and "Saved in this browser"; Start step 1 opens working step 1 and `/plan` then redirects.
- Record the URL and the results in [status.md](status.md), and add the screenshot `m3-preview-brief-entry.png`.
