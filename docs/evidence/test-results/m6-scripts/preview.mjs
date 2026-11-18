// The five M6 preview checks (docs/status.md, M6), against a deployed URL.
// Usage: node preview.mjs <base url> <out.json> <screenshot dir>
// Checks 1, 2 and 4 answer /api/plan with the sample plan (no model calls, and no use of the rate limit).
// Check 5 makes one real model call; check 3 makes real calls until a 429 or 6 attempts in all from this IP.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const [, , BASE, outFile, shotDir] = process.argv;
const { plan, brief } = JSON.parse(readFileSync(new URL("../sample.json", import.meta.url)));
const browser = await chromium.launch({ channel: "chrome" });
const results = { base: BASE, startedAt: new Date().toISOString(), checks: {} };
const shot = (page, name) => page.screenshot({ path: `${shotDir}/m6-preview-${name}.png`, fullPage: true });
const record = (key, data) => {
  results.checks[key] = data;
  console.log(`\n## ${key}: ${data.result}`);
  for (const [k, v] of Object.entries(data)) if (k !== "result") console.log(`  ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
};
// Every real /api/plan request from this IP, in order, across checks 5 and 3.
const planRequests = [];

async function mockedContext(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...options });
  await context.route("**/api/plan", (route) => route.fulfill({ status: 200, json: { ok: true, plan } }));
  return context;
}

async function buildAndStart(page) {
  await page.goto(BASE + "/");
  await page.getByLabel("Assignment brief").fill(brief);
  await page.getByRole("button", { name: "Break it down" }).click();
  await page.waitForURL("**/plan");
  await page.getByRole("button", { name: "Start step 1" }).click();
  await page.waitForURL("**/step/1");
  await page.getByRole("heading", { level: 1 }).waitFor();
}

const storedStep = (page, n) => page.evaluate((i) => JSON.parse(localStorage.getItem("momentum:v1")).assignments[0].steps[i], n - 1);

// 1. Two tabs (H-01).
{
  const context = await mockedContext();
  const a = await context.newPage();
  await buildAndStart(a);
  const b = await context.newPage();
  await b.goto(BASE + "/step/1");
  await b.getByRole("heading", { level: 1 }).waitFor();
  const note = "Note written in tab A (preview)";
  await a.getByRole("button", { name: "Pause for later" }).click();
  await a.getByRole("dialog").getByRole("textbox").fill(note);
  await a.getByRole("dialog").getByRole("button", { name: "Finish for now" }).click();
  await a.getByText("Progress saved").waitFor();
  await b.waitForTimeout(500);
  const bShowsNoteBeforeComplete = await b.getByText(note).isVisible();
  await b.getByRole("button", { name: "Mark complete" }).click();
  await b.waitForURL("**/step/1/done");
  const bStatus = await b.locator("header [role=status]").textContent();
  const afterB = await storedStep(a, 1);
  await a.reload();
  await a.getByRole("heading", { level: 1 }).waitFor();
  const aHomeH1 = await a.getByRole("heading", { level: 1 }).textContent();
  await a.goto(BASE + "/step/1");
  await a.getByText("You marked this step done.").waitFor();
  const aNoteOnScreen = await a.getByText(note).isVisible();
  await shot(a, "two-tabs-tab-a-step-1");
  const ok = afterB.note === note && afterB.status === "done" && aNoteOnScreen;
  record("1-two-tabs", {
    result: ok ? "passed" : "failed",
    storedStep1AfterTabBMarkComplete: { status: afterB.status, note: afterB.note },
    tabBShowedTheNoteBeforeMarkComplete: bShowsNoteBeforeComplete,
    tabBTopBar: bStatus,
    tabAAfterReloadH1: aHomeH1,
    tabANoteOnScreenAtStep1AfterReload: aNoteOnScreen,
  });
  await context.close();
}

// 2. 13,000 characters pasted through the clipboard.
{
  const context = await mockedContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  await page.goto(BASE + "/");
  const text = "a".repeat(12_991) + "Due Dec 4";
  await page.evaluate((t) => navigator.clipboard.writeText(t), text);
  const clipboardLength = await page.evaluate(() => navigator.clipboard.readText().then((t) => t.length));
  await page.getByLabel("Assignment brief").focus();
  await page.keyboard.press("ControlOrMeta+V");
  await page.waitForTimeout(300);
  const value = await page.getByLabel("Assignment brief").inputValue();
  const message = await page.locator("#brief-error").textContent().catch(() => null);
  const counter = await page.getByText(/of 12,000 characters/).textContent().catch(() => null);
  let planRequestsAfterBreakItDown = 0;
  page.on("request", (r) => r.url().endsWith("/api/plan") && planRequestsAfterBreakItDown++);
  await page.getByRole("button", { name: "Break it down" }).click();
  await page.waitForTimeout(500);
  await page.getByLabel("Assignment brief").evaluate((el) => (el.scrollTop = el.scrollHeight));
  await shot(page, "paste-13000");
  const ok = value.length === 13000 && value.endsWith("Due Dec 4") && message?.includes("Your brief is longer than 12,000 characters. Shorten it to build a plan.");
  record("2-paste-13000", {
    result: ok ? "passed" : "failed",
    clipboardLength,
    keptLength: value.length,
    endsWithDueDate: value.endsWith("Due Dec 4"),
    overLimitMessage: message,
    counter,
    planRequestsAfterBreakItDown,
  });
  await context.close();
}

// 4. Done step (H-17).
{
  const context = await mockedContext();
  const page = await context.newPage();
  await buildAndStart(page);
  for (const n of [1, 2]) {
    await page.goto(`${BASE}/step/${n}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.getByRole("button", { name: "Mark complete" }).click();
    await page.waitForURL(`**/step/${n}/done`);
  }
  await page.getByRole("button", { name: "Continue to step 3" }).click();
  await page.waitForURL("**/step/3");
  await page.getByRole("heading", { level: 1 }).waitFor();
  const rail = page.getByRole("navigation", { name: "Your steps" });
  await rail.getByRole("link", { name: /^Done: 1\./ }).click();
  await page.waitForURL("**/step/1");
  await page.getByText("You marked this step done.").waitFor();
  const railLinks = await rail.getByRole("link").allTextContents();
  await shot(page, "done-step");
  await page.getByRole("button", { name: "Back to step 3" }).click();
  await page.waitForURL("**/step/3");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.waitForTimeout(200);
  const focus = await page.evaluate(() => ({ tag: document.activeElement.tagName, text: document.activeElement.textContent }));
  const step3Title = await page.getByRole("heading", { level: 1 }).textContent();
  await page.getByRole("link", { name: "Momentum, home" }).click();
  await page.waitForURL(BASE + "/");
  const homeH1 = await page.getByRole("heading", { level: 1 }).textContent();
  const ok = railLinks.some((t) => t.startsWith("In progress: 3.")) && focus.tag === "H1" && focus.text === step3Title && new URL(page.url()).pathname === "/";
  record("4-done-step", { result: ok ? "passed" : "failed", railLinksOnDoneStep1: railLinks, focusAfterBackToStep3: focus, wordmarkWentTo: page.url(), homeH1 });
  await context.close();
}

// A real plan request: records the request body, status and Vercel's request id.
function watchPlan(page, label) {
  page.on("request", (r) => {
    if (r.url().endsWith("/api/plan") && r.method() === "POST") planRequests.push({ label, at: new Date().toISOString(), body: JSON.parse(r.postData()) });
  });
  page.on("response", async (r) => {
    if (r.url().endsWith("/api/plan")) {
      const entry = planRequests.findLast((p) => p.label === label && p.status === undefined);
      if (entry) Object.assign(entry, { status: r.status(), vercelId: r.headers()["x-vercel-id"] ?? null });
    }
  });
}

// 5. Local date one day ahead of UTC (real model call).
{
  const timezoneId = "Pacific/Kiritimati";
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId });
  const page = await context.newPage();
  watchPlan(page, "check 5");
  await page.goto(BASE + "/");
  const browserDate = await page.evaluate(() => new Date().toLocaleDateString("en-CA"));
  const serverUtcDate = new Date().toISOString().slice(0, 10);
  await page.getByLabel("Assignment brief").fill("Write a 300-word reflection on your first week of classes. Submit it on Canvas by 5 PM tomorrow.");
  await page.getByRole("button", { name: "Break it down" }).click();
  const outcome = await Promise.race([
    page.waitForURL("**/plan", { timeout: 70_000 }).then(() => "plan review"),
    page.getByRole("heading", { name: /couldn’t/ }).waitFor({ timeout: 70_000 }).then(() => "error"),
  ]);
  const request = planRequests.find((p) => p.label === "check 5");
  let shownDue = null;
  if (outcome === "plan review") {
    await page.getByText("Start step 1").waitFor();
    shownDue = (await page.locator("main").textContent()).match(/Due [A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}(, \d{1,2}:\d{2} [AP]M)?/)?.[0] ?? null;
  }
  await shot(page, "local-date-plan-review");
  const add = (iso, days) => new Date(Date.parse(iso + "T00:00:00Z") + days * 86400000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const browserTomorrow = add(browserDate, 1);
  const serverTomorrow = add(serverUtcDate, 1);
  const ok = request?.body.today === browserDate && browserDate !== serverUtcDate && shownDue?.startsWith(`Due ${browserTomorrow}`);
  record("5-local-date", {
    result: ok ? "passed" : "failed",
    timezoneId,
    browserDate,
    serverUtcDate,
    requestToday: request?.body.today ?? null,
    requestStatus: request?.status ?? null,
    outcome,
    planReviewShows: shownDue,
    expectedBrowserTomorrow: browserTomorrow,
    serverTomorrowWouldBe: serverTomorrow,
  });
  await context.close();
}

// 3. Rate limit (real model calls): until a 429, or 6 requests in all from this IP including check 5's.
{
  const attempts = [];
  while (planRequests.length < 6) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const label = `check 3, build ${attempts.length + 1}`;
    watchPlan(page, label);
    await page.goto(BASE + "/");
    await page.getByLabel("Assignment brief").fill(brief);
    await page.getByRole("button", { name: "Break it down" }).click();
    const outcome = await Promise.race([
      page.waitForURL("**/plan", { timeout: 70_000 }).then(() => "plan review"),
      page.getByRole("heading", { name: /couldn’t/ }).waitFor({ timeout: 70_000 }).then(() => "error"),
    ]);
    await page.waitForTimeout(300);
    const request = planRequests.findLast((p) => p.label === label);
    const errorBody = outcome === "error" ? await page.locator("main p").first().textContent() : null;
    attempts.push({ label, requestNumberFromThisIp: planRequests.length, at: request?.at, status: request?.status, vercelId: request?.vercelId, outcome, errorBody });
    console.log(`  ${label}: request ${planRequests.length} from this IP → ${request?.status} (${outcome})`);
    if (request?.status === 429) {
      await shot(page, "rate-limit-error-03");
      await context.close();
      break;
    }
    await context.close();
  }
  const limited = attempts.find((a) => a.status === 429);
  const expected = "Too many plans were built from this network. Try again in about 10 minutes.";
  record("3-rate-limit", {
    result: limited ? (limited.errorBody === expected && limited.requestNumberFromThisIp === 6 ? "passed" : "failed") : "failed (no 429)",
    note: "Request numbers count check 5's real request first.",
    attempts,
  });
}

results.planRequests = planRequests.map(({ label, at, status, vercelId, body }) => ({ label, at, status, vercelId, today: body.today }));
results.finishedAt = new Date().toISOString();
writeFileSync(outFile, JSON.stringify(results, null, 2));
await browser.close();
