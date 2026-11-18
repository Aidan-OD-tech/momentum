// Tab through the deadline field's parts, reading its border 60 ms and 600 ms after each Tab.
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto("http://localhost:3100/");
await page.getByLabel("Assignment brief").focus();
const read = () => page.evaluate(() => ({ id: document.activeElement.id || document.activeElement.textContent.trim(), border: getComputedStyle(document.activeElement).borderTopColor, ring: getComputedStyle(document.activeElement).boxShadow !== "none" }));
for (let i = 0; i < 9; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(60); const a = await read();
  await page.waitForTimeout(540); const b = await read();
  console.log(i + 1, a.id, "60ms:", a.border, a.ring ? "ring" : "", "| 600ms:", b.border, b.ring ? "ring" : "");
}
await browser.close();
