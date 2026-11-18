// Top bar below 600 px: the failed save status on a session screen, at several widths.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const { plan, brief } = JSON.parse(readFileSync(new URL("../sample.json", import.meta.url)));
const B = "http://localhost:3100";
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.route("**/api/plan", (r) => r.fulfill({ status: 200, json: { ok: true, plan } }));
const p = await ctx.newPage();
for (let i = 0; i < 40; i++) { try { await p.goto(B + "/"); break; } catch { await p.waitForTimeout(250); } }
await p.getByLabel("Assignment brief").fill(brief);
await p.getByRole("button", { name: "Break it down" }).click();
await p.waitForURL("**/plan");
await p.getByRole("button", { name: "Start step 1" }).click();
await p.waitForURL("**/step/1");
await p.evaluate(() => { Storage.prototype.setItem = () => { throw new Error("full"); }; });
await p.getByRole("button", { name: "Pause for later" }).click();
await p.getByRole("dialog").getByRole("button", { name: "Keep working" }).click();
await p.getByRole("dialog").waitFor({ state: "detached" }).catch(() => {});
// setPauseDraft writes; type a draft to force a write
await p.getByRole("button", { name: "Pause for later" }).click();
await p.getByRole("dialog").getByRole("textbox").fill("x");
await p.keyboard.press("Escape");
await p.locator("header [role=status]").getByText("Couldn’t save").waitFor();
for (const w of [600, 540, 480, 420, 375]) {
  await p.setViewportSize({ width: w, height: 800 });
  await p.waitForTimeout(150);
  const r = await p.evaluate(() => {
    const s = document.querySelector("header [role=status]").getBoundingClientRect();
    const ctx = document.querySelector("header > p");
    return { statusH: s.height, statusRight: s.right, ctxW: ctx ? ctx.getBoundingClientRect().width : null, scroll: document.documentElement.scrollWidth, inner: innerWidth };
  });
  console.log(w, JSON.stringify(r));
  await p.screenshot({ path: `../shots-m6/narrow-${w}.png`, clip: { x: 0, y: 0, width: w, height: 64 } });
}
await browser.close();
