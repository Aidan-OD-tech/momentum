// Screenshot the deadline field at its 6th and 7th Tab stops from the brief (last date part, then the picker icon).
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })).newPage();
await page.goto("http://localhost:3100/");
await page.getByLabel("Assignment brief").focus();
const field = page.locator("#deadline");
for (let i = 1; i <= 7; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(600);
  if (i >= 6) {
    const b = await field.boundingBox();
    await page.screenshot({ path: `${process.argv[2]}/deadline-stop-${i}.png`, clip: { x: b.x - 12, y: b.y - 12, width: b.width + 24, height: b.height + 24 } });
  }
}
await browser.close();
