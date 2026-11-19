# Momentum

Momentum helps students turn an assignment brief into small steps, start the first one, and pick up where they left off after a break.

Live site: https://momentum-five-xi.vercel.app

## Intended audience

Students who have a written assignment they're committed to but find hard to start or come back to. Many feel overwhelmed or have been putting the work off.

## Problem or opportunity

An assignment brief is often long and dense. Before writing anything, the student has to work out what is actually being asked, what the first step is, and how much work is left. After a break of a few days they have to do that again. Most planning tools add pressure (streaks, dashboards) or a chat box that leaves the student to do the planning themselves.

Momentum does that first piece of work for them: it reads the brief once, turns it into a short plan with concrete steps, and then shows one next action at a time. When the student comes back, the first thing they see is where they stopped and the note they left.

## Primary user flow

1. **Paste a brief.** Paste the assignment brief and add the deadline if there is one. To plan a whole week, paste up to 8 briefs at once.
2. **Review the plan.** Momentum shows a summary, the requirements it found and a list of steps, each with an approximate time and a "Done when" line. The student can edit, add or remove steps before starting.
3. **Work one step at a time.** The working screen shows only the current step, with the full plan and the original brief one click away. A timer is available but off by default.
4. **Pause and come back.** Pausing asks for an optional note ("where I stopped"). On return, the home list puts that assignment's step and note first.
5. **Finish.** After the last step, a final check lists the brief's requirements to confirm by hand. Momentum doesn't submit or verify anything; the student submits through their course's own system.

With several assignments, the home page is a list ordered by soonest deadline, showing an approximate time left for each. The top one is shown as "Up next".

## Technical stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, with shadcn/ui and Radix primitives restyled to Momentum's own design tokens
- Zod for validating the plan the model returns
- Vitest and Testing Library (367 tests); Playwright and axe-core for browser and accessibility checks
- Hosted on Vercel
- Progress is stored only in the browser's local storage. There are no accounts and no database.

## API and how it's used

**OpenAI API (Structured Outputs).** When the student presses "Break it down", the brief goes to Momentum's own server route, `POST /api/plan`, which sends it to OpenAI and asks for a plan in a fixed JSON shape (summary, requirements, steps with estimates and "Done when"). The server checks the result with Zod before the app uses it. The model runs once per brief; after that, the plan is stored in the browser and every screen works without calling the model again.

- The API key stays on the server and never reaches the browser (`npm run check:bundle` checks this after a build).
- The route is rate limited: 12 plans per network address per 10 minutes and 100 per hour overall. A spending limit on the OpenAI account is the real cap on cost.
- A weekly upload sends one request per brief, one at a time, so one bad brief doesn't fail the whole week.

Momentum also has one small internal route, `POST /api/event`, which logs an anonymous count when a student starts a plan's first step (no brief text). It is used to measure whether people get started.

## Run it locally

You need Node.js 20.9 or later and npm.

```bash
git clone https://github.com/Aidan-OD-tech/momentum.git
cd momentum
npm install
```

Create `.env.local` in the project folder with your OpenAI key (git ignores this file):

```
OPENAI_API_KEY=your-key-here
NEXT_PUBLIC_SHOW_SAMPLE_BRIEF=true
```

Then:

```bash
npm run dev     # open http://localhost:3000
npm test        # run the tests
npm run lint
npm run build
```

Without a key, everything except building a plan works, and building shows an error screen. To start over, clear the site's local storage in your browser.

## Known limitations

- **One browser only.** Plans and notes live in this browser's storage. Another browser or device won't see them, and clearing site data deletes them.
- **Estimates are approximate and tend to run long.** The model's step times and step counts vary between runs, so "time left" is a rough guide, not a schedule.
- **Plans depend on the brief.** A vague brief gives a vague plan; a brief with no clear task gets a "couldn't find clear requirements" message.
- **The weekly upload stops if the tab is closed or reloaded.** Briefs not built yet are kept as drafts, but building doesn't resume on its own.
- **Two open tabs** stay in sync, but after a reload whichever tab saved last decides which assignment opens.
- **Rate limiting is best effort** on Vercel; the OpenAI budget is the hard limit.
- **Not yet tested with screen readers** (VoiceOver, NVDA), or in Safari and Firefox. Keyboard use and automated accessibility checks (axe, 0 violations) were done.
- **No participant sessions yet.** The product hasn't been tested with students; the session guide is ready in [docs/evidence/session-guide.md](docs/evidence/session-guide.md).

## What I'd improve next

- Run task-based sessions with students and fix what they struggle with first.
- Do a full screen-reader pass and fix what it finds.
- Bring the time estimates closer to reality, so the plan feels less daunting.
- Let an interrupted weekly upload pick up where it stopped.
- Optional sync across devices, so a plan started on one laptop can be continued on another.

## More detail

- [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md): users, principles, design tokens and components
- [FEATURES.md](FEATURES.md): feature list
- [docs/status.md](docs/status.md): what's built and verified
- [docs/decisions.md](docs/decisions.md): decisions and their reasons
- [docs/evidence/](docs/evidence/): heuristic evaluation, accessibility, measurement, AI log, session guide
