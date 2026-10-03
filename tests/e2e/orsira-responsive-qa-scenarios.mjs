import assert from "node:assert/strict";
import fs from "node:fs/promises";

export async function runResponsiveQa({page,base,runtimeErrors}) {
const widths = [320, 375, 390, 430, 768, 1440];
const representativePaths = ["/app/today", "/app/calendar", "/app/customers"];
const evidence=[];

async function noBodyOverflow(label) {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert.ok(size.scrollWidth <= size.clientWidth + 1, `${label}: body overflow ${size.scrollWidth} > ${size.clientWidth}`);
  return size;
}

async function assertVisibleBrand() {
  const brands = page.getByText("ORSIRA", { exact: true });
  const count = await brands.count();
  assert.ok(count > 0, "ORSIRA brand must be present in the app shell");
  let visible = false;
  for (let index = 0; index < count; index += 1) {
    if (await brands.nth(index).isVisible()) {
      visible = true;
      break;
    }
  }
  assert.equal(visible, true, "ORSIRA brand must be visible in the active responsive shell");
}

async function open(path, width) {
  await page.setViewportSize({ width, height: 900 });
  const response = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.ok(response, `${path} at ${width}px must return a response`);
  assert.equal(response.status(), 200, `${path} at ${width}px must return 200`);
  await page.locator("main").waitFor({ state: "visible" });
  await assertVisibleBrand();
  const size = await noBodyOverflow(`${width}px ${path}`);
  evidence.push({ width, path, ...size });
}

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
}
