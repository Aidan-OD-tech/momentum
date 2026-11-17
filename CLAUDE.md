# Rules for Claude Code sessions on Momentum

Aidan owns the product and must be able to explain and change every line. Keep code small, plain and well named.

Read first: [docs/MOMENTUM_CONTEXT.md](docs/MOMENTUM_CONTEXT.md), the handoff PDF in `docs/reference/`, [docs/design-rules.md](docs/design-rules.md) and [docs/status.md](docs/status.md). Also see [AGENTS.md](AGENTS.md): this Next.js version differs from older ones, so check `node_modules/next/dist/docs/` before relying on memory.

## Rules

- Follow Aidan's latest decisions and the handoff. If sources conflict, flag it; do not silently change scope.
- Do not expand the MVP. Keep code understandable.
- Reuse tokens and components. No hard-coded colors, no arbitrary Tailwind values (`p-[13px]`, `text-[#111]`), no default shadcn styling. `src/design-rules.test.ts` enforces this.
- Status copy must be truthful: never "saved" without a confirmed write, never imply anything was submitted.
- Never put API keys in browser code, chat or git.
- Preserve user input and progress.
- Small commits on feature branches, PRs for review. Never merge without Aidan's instruction. Do not push unless asked.
- Test what you changed and report what was actually verified, including what failed or was skipped.
- Never fabricate research, quotes or metrics.
- Never edit existing Figma frames. Design changes go on a new, clearly labeled page.
- Nothing may assume six steps. Derive counts from the data.
- Record decisions in [docs/decisions.md](docs/decisions.md) and keep [docs/status.md](docs/status.md) accurate (planned, implemented or verified).
