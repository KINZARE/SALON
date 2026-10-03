import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const widths = [320, 375, 390, 430, 768, 1440];
const representativePaths = ["/app/today", "/app/calendar", "/app/customers"];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
page.setDefaultNavigationTimeout(25_000);
const runtimeErrors = [];
const evidence = [];

page.on("console", message => {
  if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
});
page.on("pageerror", error => runtimeErrors.push(`pageerror: ${error.message}`));

async function noBodyOverflow(label) {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert.ok(size.scrollWidth <= size.clientWidth + 1, `${label}: body overflow ${size.scrollWidth} > ${size.clientWidth}`);
  return size;
}

async function open(path, width) {
  await page.setViewportSize({ width, height: 900 });
  const response = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.ok(response, `${path} at ${width}px must return a response`);
  assert.equal(response.status(), 200, `${path} at ${width}px must return 200`);
  await page.locator("main").waitFor({ state: "visible" });
  const brand = page.getByText("ORSIRA", { exact: true }).first();
  await brand.waitFor({ state: "visible" });
  const size = await noBodyOverflow(`${width}px ${path}`);
  evidence.push({ width, path, ...size });
}

try {
  for (const width of widths) {
    for (const path of representativePaths) await open(path, width);

    await page.goto(base + "/app/today", { waitUntil: "networkidle" });
    const mobileNav = page.locator('nav[aria-label="Mobiele navigatie"]');
    const desktopNav = page.locator('nav[aria-label="Hoofdnavigatie"]');
    if (width < 768) {
      assert.equal(await mobileNav.isVisible(), true, `${width}px must show mobile navigation`);
      assert.equal(await desktopNav.isVisible(), false, `${width}px must hide desktop navigation`);
      const focusTarget = mobileNav.getByRole("link").first();
      await focusTarget.focus();
      assert.equal(await focusTarget.evaluate(element => document.activeElement === element), true, `${width}px mobile navigation must be keyboard focusable`);
    } else {
      assert.equal(await desktopNav.isVisible(), true, `${width}px must show desktop navigation`);
      assert.equal(await mobileNav.isVisible(), false, `${width}px must hide mobile navigation`);
      const focusTarget = desktopNav.getByRole("link").first();
      await focusTarget.focus();
      assert.equal(await focusTarget.evaluate(element => document.activeElement === element), true, `${width}px desktop navigation must be keyboard focusable`);
    }
  }

  for (const width of [390, 1440]) {
    for (const path of ["/app/services", "/app/staff", "/app/reports", "/app/settings", "/app/more"]) await open(path, width);
  }

  assert.deepEqual(runtimeErrors, [], `runtime errors detected:\n${runtimeErrors.join("\n")}`);
  await fs.mkdir("qa-artifacts", { recursive: true });
  await fs.writeFile("qa-artifacts/orsira-responsive.json", JSON.stringify({ brand: "ORSIRA", evidence }, null, 2));
  console.log(`ORSIRA responsive QA passed: ${evidence.length} route/viewport checks`);
} finally {
  await browser.close();
}
