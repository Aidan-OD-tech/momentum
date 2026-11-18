import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const { plan, brief } = JSON.parse(readFileSync(new URL("../sample.json", import.meta.url)));
const B = "http://localhost:3100";
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.route("**/api/plan", (r) => r.fulfill({ status: 200, json: { ok: true, plan } }));
const a = await ctx.newPage();
for (let i = 0; i < 40; i++) { try { await a.goto(B + "/"); break; } catch { await a.waitForTimeout(250); } }
await a.getByLabel("Assignment brief").fill(brief);
await a.getByRole("button", { name: "Break it down" }).click();
await a.waitForURL("**/plan");
await a.getByRole("button", { name: "Start step 1" }).click();
await a.waitForURL("**/step/1");
// Tab B opens the same step (e.g. a second window in a split screen).
const b = await ctx.newPage();
await b.goto(B + "/step/1");
await b.getByRole("heading", { level: 1 }).waitFor();
// Tab A: pause with a note.
await a.getByRole("button", { name: "Pause for later" }).click();
await a.getByRole("dialog").getByRole("textbox").fill("Note written in tab A");
await a.getByRole("dialog").getByRole("button", { name: "Finish for now" }).click();
await a.getByText("Progress saved").waitFor();
const stored = () => a.evaluate(() => JSON.parse(localStorage.getItem("momentum:v1")).assignments[0].steps[0]);
console.log("after A's Finish for now:", (await stored()).note);
// Tab B, still showing its old copy, marks step 1 complete.
await b.getByRole("button", { name: "Mark complete" }).click();
await b.waitForURL("**/step/1/done");
console.log("tab B top bar:", await b.getByText(/in this browser/).first().textContent());
console.log("after B's Mark complete:", JSON.stringify((await stored()).note), "status", (await stored()).status);
await browser.close();
