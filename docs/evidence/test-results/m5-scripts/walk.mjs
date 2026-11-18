// M5 walkthrough on the production build: every screen in heuristic section 3, axe on each,
// screenshots, and a count of /api/event requests. /api/plan is answered by this script with the
// sample plan (or a 422 / 502 / no answer), so no OpenAI request is made.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, writeFileSync } from "node:fs";

const [, , width, outFile, shotDir] = process.argv;
const BASE = "http://localhost:3100";
const { plan, brief } = JSON.parse(readFileSync(new URL("../sample.json", import.meta.url)));
const W = Number(width);

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: W, height: 800 } });
const page = await context.newPage();

let planMode = "ok";
await page.route("**/api/plan", async (route) => {
  if (planMode === "hang") return; // never answered: the building state stays
  if (planMode === "422") return route.fulfill({ status: 422, json: { reason: "unreadable" } });
  if (planMode === "502") return route.fulfill({ status: 502, json: { reason: "failed" } });
  return route.fulfill({ status: 200, json: { ok: true, plan } });
});

const events = [];
page.on("request", (r) => {
  if (r.url().endsWith("/api/event")) events.push({ body: r.postData(), at: Date.now() });
});
const eventResponses = [];
page.on("response", (r) => {
  if (r.url().endsWith("/api/event")) eventResponses.push(r.status());
});
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

const results = {};
const checks = [];
const check = (name, ok, detail = "") => checks.push({ name, ok: Boolean(ok), detail });

async function scan(key) {
  await page.waitForTimeout(400); // let transitions settle
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  results[key] = {
    url: r.url,
    violations: r.violations,
    incomplete: r.incomplete,
    passes: r.passes.map((p) => p.id),
    inapplicable: r.inapplicable.map((p) => p.id),
  };
  if (shotDir) await page.screenshot({ path: `${shotDir}/m5-${key}-${W}.png`, fullPage: true });
}

const button = (name) => page.getByRole("button", { name, exact: true });

// 1. Brief entry, fresh storage.
await page.goto(BASE + "/");
await page.getByRole("heading", { level: 1 }).waitFor();
check("sample button hidden without flag", (await page.getByRole("button", { name: "Use a sample brief" }).count()) === 0);
check("disclosure line shown", await page.getByText("Momentum counts anonymous usage, such as when a plan’s first step is started.", { exact: false }).isVisible());
await scan("brief-entry");

// 2. Error 01.
await button("Break it down").click();
await page.getByText("Paste your brief first").waitFor();
await scan("error-01");

// 3. Building, then Cancel.
await page.getByLabel("Assignment brief").fill(brief);
planMode = "hang";
await button("Break it down").click();
await page.getByText("Cancel").waitFor();
await scan("building");
await button("Cancel").click();

// 4. Error 02.
planMode = "422";
await button("Break it down").click();
await page.getByRole("heading", { name: /couldn’t find clear requirements/ }).waitFor();
await scan("error-02");
await button("Edit the brief").click();

// 5. Error 03.
planMode = "502";
await button("Break it down").click();
await page.getByRole("heading", { name: /couldn’t build your plan/ }).waitFor();
await scan("error-03");
await button("Edit the brief").click();
check("brief kept after errors", (await page.getByLabel("Assignment brief").inputValue()) === brief);

// 6. Plan review, and with a step edit card open.
planMode = "ok";
await button("Break it down").click();
await page.waitForURL("**/plan");
await page.getByText("Start step 1").waitFor();
await scan("plan-review");
await page.getByRole("button", { name: "Edit step 1" }).click();
await scan("plan-review-edit");
await button("Cancel").click();
check("no event before Start step 1", events.length === 0);

// 7. Start step 1: one event.
await button("Start step 1").click();
await page.waitForURL("**/step/1");
await page.waitForTimeout(500);
check("one event after Start step 1", events.length === 1, events.map((e) => e.body).join(" | "));
await scan("working-step");

// 8. Pause dialog, then Finish for now: home after a pause.
await button("Pause for later").click();
await page.getByRole("dialog").waitFor();
await scan("pause-dialog");
await page.getByRole("dialog").getByRole("textbox").fill("Halfway through the second source. Next: note its sample size.");
await page.getByRole("dialog").getByRole("button", { name: "Finish for now" }).click();
await page.waitForURL(BASE + "/");
await page.getByText("Progress saved").waitFor();
await scan("home-after-pause");

// 9. Reload, resume step 1, complete it, undo, complete again.
await page.reload();
await page.getByRole("button", { name: /Resume step 1/ }).click();
await page.waitForURL("**/step/1");
await button("Mark complete").click();
await page.waitForURL("**/step/1/done");
await scan("step-complete");
await button("Undo").click();
await page.waitForURL("**/step/1");
await page.goto(BASE + "/step/1"); // reopen step 1 by URL as well
await page.getByRole("heading", { level: 1 }).waitFor();
await button("Mark complete").click();
await page.waitForURL("**/step/1/done");
await page.waitForTimeout(300);
check("still one event after reload, undo and reopening step 1", events.length === 1, String(events.length));

// 10. The rest of the steps, from the plan's length.
const stepCount = plan.steps.length;
for (let n = 2; n <= stepCount; n++) {
  await page.goto(`${BASE}/step/${n}`);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await button("Mark complete").click();
  await page.waitForURL(n === stepCount ? "**/final" : `**/step/${n}/done`);
}
await page.getByRole("button", { name: "Finish review" }).waitFor();
await scan("final-check");
const boxes = page.getByRole("checkbox");
await boxes.first().click();
await button("Finish review").click();
await page.waitForURL(BASE + "/");
await page.getByRole("button", { name: "Start a new assignment" }).waitFor();
await scan("completed-home");

check("exactly one event for the whole plan", events.length === 1, String(events.length));
check("event answered 204", eventResponses.length === 1 && eventResponses[0] === 204, eventResponses.join(","));
const payload = events[0] && JSON.parse(events[0].body);
check("payload has only the three keys", payload && Object.keys(payload).sort().join(",") === "event,minutesSincePlanCreated,stepCount", events[0]?.body);
check("no console errors", consoleErrors.length === 0, consoleErrors.join(" | "));

writeFileSync(outFile, JSON.stringify({ width: W, checks, events: events.map((e) => e.body), axe: results }, null, 2));
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
for (const [key, r] of Object.entries(results)) console.log(`axe ${key}: ${r.violations.map((v) => `${v.id}[${v.impact}]x${v.nodes.length}`).join(", ") || "no violations"}; incomplete: ${r.incomplete.map((v) => v.id).join(", ") || "none"}`);
await browser.close();
