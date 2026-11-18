// M6: the M5 keyboard pass (m5-scripts/keyboard.mjs) plus Shift+Tab from each h1 (the wordmark is now a
// link) and the done-step view reached from step 3's rail. Keyboard-only pass over the whole flow on the production build. Every action is a Tab/Shift+Tab,
// Enter, Space or Escape press; the script records each focus stop, whether a focus indicator is
// visible (ring box-shadow, or the text field's dark border), whether the focused element is inside
// the viewport, and the size of every control (WCAG 2.5.8). /api/plan answers with the sample plan.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const [, , outFile, W = "1280"] = process.argv;
const BASE = "http://localhost:3100";
const { plan, brief } = JSON.parse(readFileSync(new URL("../sample.json", import.meta.url)));
const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ viewport: { width: Number(W), height: 800 } })).newPage();
await page.route("**/api/plan", (route) => route.fulfill({ status: 200, json: { ok: true, plan } }));

const log = {};
let current = "";
const stop = () =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { name: "(body)" };
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const name = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || el.id || "").trim().replace(/\s+/g, " ").slice(0, 50);
    const ring = s.boxShadow !== "none";
    const darkBorder = s.borderTopColor === "rgb(17, 17, 17)";
    return {
      name: `${el.tagName.toLowerCase()}${el.getAttribute("role") ? `[${el.getAttribute("role")}]` : ""} "${name}"`,
      visible: ring || darkBorder ? (ring ? "ring" : "dark border") : "NONE",
      inViewport: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
      size: `${Math.round(r.width)}×${Math.round(r.height)}`,
    };
  });

// What Shift+Tab from the h1 reaches (the wordmark link, since M6), then focus goes back to the h1.
async function shiftTabFromHeading() {
  await page.locator("h1").focus();
  const s = await press("Shift+Tab");
  note(`Shift+Tab from the h1: ${s.name} (focus visible: ${s.visible})`);
}

function section(name) {
  current = name;
  log[name] = { stops: [], notes: [] };
}
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
const note = (text) => log[current].notes.push(text);

async function press(key) {
  await page.keyboard.press(key);
  await page.waitForTimeout(60);
  const s = await stop();
  log[current].stops.push({ key, ...s });
  return s;
}

// Tabs until the focused control's name contains `label` (at most 60 presses).
async function tabTo(label, key = "Tab") {
  for (let i = 0; i < 60; i++) {
    const s = await press(key);
    if (s.name.includes(label)) return s;
  }
  throw new Error(`${current}: never reached "${label}"`);
}

// Full Tab cycle from the current focus: records stops until one repeats (or 40 presses).
async function cycle() {
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const s = await press("Tab");
    if (seen.has(s.name)) return;
    seen.add(s.name);
  }
  note("no repeat within 40 Tabs");
}

async function targetSizes() {
  return page.evaluate(() =>
    [...document.querySelectorAll("button, a[href], input, textarea, [role=checkbox], [role=tab]")]
      .filter((el) => el.offsetParent !== null || el.getClientRects().length)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { name: (el.getAttribute("aria-label") || el.textContent || el.id || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((t) => t.w < 24 || t.h < 24),
  );
}
const small = {};

// Brief entry.
section("brief entry");
await page.goto(BASE + "/");
await page.getByRole("heading", { level: 1 }).waitFor();
note(`focus on arrival: ${(await stop()).name}; horizontal overflow: ${await overflow()}`);
small["brief entry"] = await targetSizes();
await shiftTabFromHeading();
await cycle();
await page.goto(BASE + "/");
await page.getByRole("heading", { level: 1 }).waitFor();
await tabTo("Paste the full instructions");
await page.keyboard.insertText(brief);
await tabTo("Break it down");
await page.keyboard.press("Enter");
await page.waitForURL("**/plan");

// Plan review.
section("plan review");
await page.getByText("Start step 1").waitFor();
note(`focus on arrival: ${(await stop()).name}; horizontal overflow: ${await overflow()}`);
small["plan review"] = await targetSizes();
await shiftTabFromHeading();
await cycle();
// Edit step 1 by keyboard, Escape inside the card, then Cancel.
await page.locator("h1").focus();
await tabTo("Edit step 1");
await page.keyboard.press("Enter");
await page.waitForTimeout(200);
note(`Edit step 1 opens with focus on: ${(await stop()).name}`);
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
note(`Escape inside the step edit card: card still open = ${await page.getByText("Editing step 1").isVisible()}`);
await tabTo("Cancel");
await page.keyboard.press("Enter");
await page.waitForTimeout(200);
note(`after Cancel focus is on: ${(await stop()).name}`);
await tabTo("Start step 1");
await page.keyboard.press("Enter");
await page.waitForURL("**/step/1");

// Working step and the side panel.
section("working step");
await page.getByRole("heading", { level: 1 }).waitFor();
note(`focus on arrival: ${(await stop()).name}; horizontal overflow: ${await overflow()}`);
small["working step"] = await targetSizes();
await shiftTabFromHeading();
await cycle();
await page.locator("h1").focus();
await tabTo("View full plan");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
note(`side panel opens with focus on: ${(await stop()).name}`);
await press("ArrowRight");
note(`ArrowRight in tabs: ${(await stop()).name}`);
await cycle();
note(`Tab inside the panel stays inside: ${(await page.getByRole("dialog").count()) === 1}`);
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
note(`Escape closes the panel; focus returns to: ${(await stop()).name}`);

// Pause dialog.
section("pause dialog");
await page.locator("h1").focus();
await tabTo("Pause for later");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
note(`dialog opens with focus on: ${(await stop()).name}`);
small["pause dialog"] = await targetSizes();
await page.keyboard.insertText("Reading source 2");
await cycle();
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
note(`Escape closes the dialog; focus returns to: ${(await stop()).name}`);
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const kept = await page.getByRole("dialog").getByRole("textbox").inputValue();
note(`reopened with Enter; draft kept: ${kept === "Reading source 2"}`);
await tabTo("Finish for now");
await page.keyboard.press("Enter");
await page.waitForURL(BASE + "/");

// Home after a pause.
section("home after pause");
await page.getByText("Progress saved").waitFor();
note(`focus on arrival: ${(await stop()).name}; horizontal overflow: ${await overflow()}`);
small["home after pause"] = await targetSizes();
await shiftTabFromHeading();
await cycle();
await page.locator("h1").focus();
await tabTo("Resume step 1");
await page.keyboard.press("Enter");
await page.waitForURL("**/step/1");

// Step complete with Undo.
section("step complete");
await page.getByRole("heading", { level: 1 }).waitFor();
await tabTo("Mark complete");
await page.keyboard.press("Enter");
await page.waitForURL("**/step/1/done");
await page.waitForTimeout(200);
note(`focus on arrival: ${(await stop()).name}; horizontal overflow: ${await overflow()}`);
small["step complete"] = await targetSizes();
await shiftTabFromHeading();
await cycle();
await page.locator("h1").focus();
await tabTo("Undo");
await page.keyboard.press("Enter");
await page.waitForURL("**/step/1");
note("Undo by Enter returned to /step/1");
await page.getByRole("heading", { level: 1 }).waitFor();
await tabTo("Mark complete");
await page.keyboard.press("Enter");
await page.waitForURL("**/step/1/done");
// From each step-complete screen: Continue to the next step, then Mark complete.
for (let n = 1; n < plan.steps.length; n++) {
  await page.locator("h1").focus();
  await tabTo(`Continue to step ${n + 1}`);
  await page.keyboard.press("Enter");
  await page.waitForURL(`**/step/${n + 1}`);
  await page.getByRole("heading", { level: 1 }).waitFor();
  if (n + 1 === 3) {
    // On step 3, open done step 1 from the rail by keyboard: the done-step view (H-17).
    const back = current;
    await page.locator("h1").focus();
    await tabTo("Done: 1.");
    await page.keyboard.press("Enter");
    await page.waitForURL("**/step/1");
    await page.getByText("You marked this step done.").waitFor();
    section("done step");
    await page.waitForTimeout(200);
    note(`focus on arrival: ${(await stop()).name}; horizontal overflow: ${await overflow()}`);
    small["done step"] = await targetSizes();
    await shiftTabFromHeading();
    await cycle();
    await page.locator("h1").focus();
    const before = log[current].stops.length;
    await tabTo("Back to step 3");
    note(`Tab presses from the h1 to "Back to step 3": ${log[current].stops.length - before}`);
    await page.keyboard.press("Enter");
    await page.waitForURL("**/step/3");
    await page.getByRole("heading", { level: 1 }).waitFor();
    note(`Enter on Back to step 3 opened /step/3; focus: ${(await stop()).name}`);
    current = back;
  }
  await tabTo("Mark complete");
  await page.keyboard.press("Enter");
  await page.waitForURL(n + 1 === plan.steps.length ? "**/final" : `**/step/${n + 1}/done`);
}

// Final check.
section("final check");
await page.getByRole("button", { name: "Finish review" }).waitFor();
note(`focus on arrival: ${(await stop()).name}; horizontal overflow: ${await overflow()}`);
small["final check"] = await targetSizes();
await shiftTabFromHeading();
await cycle();
await page.locator("h1").focus();
await tabTo("checkbox");
await page.keyboard.press("Space");
note(`Space ticks the first checkbox: ${await page.getByRole("checkbox").first().getAttribute("aria-checked")}`);
await tabTo("Finish review");
await page.keyboard.press("Enter");
await page.waitForURL(BASE + "/");

// Completed home.
section("completed home");
await page.getByRole("button", { name: "Start a new assignment" }).waitFor();
note(`focus on arrival: ${(await stop()).name}; horizontal overflow: ${await overflow()}`);
small["completed home"] = await targetSizes();
await shiftTabFromHeading();
await cycle();

writeFileSync(outFile, JSON.stringify({ width: Number(W), log, smallTargets: small }, null, 2));
for (const [name, { stops, notes }] of Object.entries(log)) {
  console.log(`\n## ${name}`);
  for (const n of notes) console.log(`  note: ${n}`);
  const bad = stops.filter((s) => s.visible === "NONE" && s.name !== "(body)");
  const out = stops.filter((s) => s.inViewport === false);
  console.log(`  stops: ${stops.length}; no visible focus: ${bad.map((s) => s.name).join(", ") || "none"}; outside viewport: ${out.map((s) => s.name).join(", ") || "none"}`);
}
console.log("\nsmall targets:", JSON.stringify(small));
await browser.close();
