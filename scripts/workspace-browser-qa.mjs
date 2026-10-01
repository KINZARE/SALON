import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const runtimeErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));

async function assertNoDemoOrLoginContent() {
  const body = (await page.locator("body").innerText()).toLowerCase();
  assert.ok(!body.includes("preview mode"), "Preview mode banner must not exist");
  assert.ok(!body.includes("baan thai wellness"), "Synthetic demo salon must not be exposed");
  assert.ok(!body.includes("sophie de vries"), "Synthetic demo customer must not be exposed");
  assert.ok(!body.includes("welkom terug"), "Login screen must not be exposed");
}

async function gotoWorkspace(path) {
  const response = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.ok(response, `No response for ${path}`);
  assert.equal(new URL(page.url()).pathname, path, `${path} must load directly without login`);
  await page.locator("main").waitFor({ state: "visible" });
  await assertNoDemoOrLoginContent();
}

async function noBodyOverflow(label) {
  const size = await page.evaluate(() => {
    const root = document.documentElement;
    return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
  });
  assert.ok(size.scrollWidth <= size.clientWidth + 1, `${label}: body overflow ${size.scrollWidth} > ${size.clientWidth}`);
}

try {
  const rootResponse = await page.goto(base + "/", { waitUntil: "networkidle" });
  assert.ok(rootResponse);
  assert.equal(new URL(page.url()).pathname, "/app/today", "Root must open the real workspace directly");
  await page.getByRole("heading", { name: "Today" }).waitFor();
  await assertNoDemoOrLoginContent();

  const workspacePaths = [
    "/app/today",
    "/app/calendar",
    "/app/customers",
    "/app/staff",
    "/app/services",
    "/app/blocks",
    "/app/settings",
    "/app/reports",
  ];
  for (const path of workspacePaths) await gotoWorkspace(path);

  await page.goto(base + "/app/calendar", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Calendar" }).waitFor();
  await page.getByText("Teamagenda", { exact: true }).waitFor();
  await page.getByRole("link", { name: /Nieuwe afspraak/ }).waitFor();
  const cards = page.locator("[data-appointment-id]");
  assert.ok(await cards.count() > 0, "Calendar must render appointment cards from the real database");
  await cards.first().click();
  await page.locator("[data-calendar-detail]").waitFor();
  assert.equal(await cards.first().getAttribute("aria-pressed"), "true", "Selected appointment must be reflected in the detail panel");
  assert.equal(await page.locator("[data-drop-staff]").count(), 4, "Calendar should expose one drop target per active staff member, not one per time slot");

  await page.getByRole("link", { name: "Volgende dag" }).click();
  await page.waitForLoadState("networkidle");
  const dragCard = page.locator("[data-appointment-id]").filter({ hasText: "Nina Hendriks" }).first();
  await dragCard.waitFor();
  await dragCard.scrollIntoViewIfNeeded();
  const beforeTop = await dragCard.evaluate((element) => Number.parseFloat(element.parentElement?.style.top ?? "0"));

  let releaseMove = () => {};
  let markMoveRequestSeen = () => {};
  const moveRequestSeen = new Promise((resolve) => { markMoveRequestSeen = resolve; });
  await page.route("**/api/internal/move", async (route) => {
    markMoveRequestSeen();
    await new Promise((resolve) => { releaseMove = resolve; });
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ error: "QA rollback" }),
    });
  });

  const dragBox = await dragCard.boundingBox();
  assert.ok(dragBox, "Draggable appointment must have a visible bounding box");
  await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + Math.min(18, dragBox.height / 2));
  await page.mouse.down();
  await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + Math.min(18, dragBox.height / 2) + 48, { steps: 8 });
  await page.mouse.up();
  await moveRequestSeen;
  await page.waitForTimeout(80);

  const optimisticTop = await dragCard.evaluate((element) => Number.parseFloat(element.parentElement?.style.top ?? "0"));
  assert.ok(optimisticTop >= beforeTop + 30, `Appointment should move optimistically before API response: ${beforeTop} -> ${optimisticTop}`);

  const moveResponse = page.waitForResponse((response) => response.url().includes("/api/internal/move"));
  releaseMove();
  await moveResponse;
  await page.unroute("**/api/internal/move");
  await page.waitForLoadState("networkidle");
  const revertedTop = await dragCard.evaluate((element) => Number.parseFloat(element.parentElement?.style.top ?? "0"));
  assert.equal(revertedTop, beforeTop, "Rejected move must roll back to the original position");

  for (const authPath of ["/login", "/signup", "/onboarding"]) {
    await page.goto(base + authPath, { waitUntil: "networkidle" });
    assert.equal(new URL(page.url()).pathname, "/app/today", `${authPath} must bypass login/setup`);
  }

  await page.goto(base + "/app/settings", { waitUntil: "networkidle" });
  const name = page.getByLabel("Naam");
  assert.equal(await name.inputValue(), "SALON Studio Amsterdam");
  await Promise.all([
    page.waitForURL(/\/app\/settings\?saved=1$/),
    page.getByRole("button", { name: "Instellingen opslaan" }).click(),
  ]);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.getByLabel("Naam").inputValue(), "SALON Studio Amsterdam", "Real settings write must persist");
  await assertNoDemoOrLoginContent();

  await page.goto(base + "/book/salon", { waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/book/salon");
  await page.getByText("Online afspraak maken").waitFor();
  await page.getByText("Knippen & stylen", { exact: true }).first().waitFor();
  await assertNoDemoOrLoginContent();

  await fs.mkdir("qa-artifacts", { recursive: true });
  const widths = [320, 390, 768, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of workspacePaths) {
      await gotoWorkspace(path);
      await noBodyOverflow(`${width}px ${path}`);
    }
    await page.goto(base + "/app/calendar", { waitUntil: "networkidle" });
    await noBodyOverflow(`${width}px calendar visual`);
    if (width === 320) await page.screenshot({ path: "qa-artifacts/calendar-320.png", fullPage: true });
    if (width === 1440) await page.screenshot({ path: "qa-artifacts/calendar-1440.png", fullPage: true });
  }

  assert.deepEqual(runtimeErrors, [], `Runtime errors detected:\n${runtimeErrors.join("\n")}`);
  const result = {
    ok: true,
    mode: "real-no-login",
    workspacePaths,
    widths,
    flows: ["root-direct-workspace", "calendar-redesign", "calendar-optimistic-drag", "calendar-conflict-rollback", "appointment-detail-panel", "auth-routes-bypassed", "real-settings-persistence", "public-booking-real-salon", "no-legacy-demo-content", "responsive-workspace"],
    runtimeErrors,
  };
  await fs.writeFile("qa-artifacts/result.json", JSON.stringify(result, null, 2));
  console.log("REAL_NO_LOGIN_QA_PASS", JSON.stringify({ widths, workspacePaths: workspacePaths.length, runtimeErrors: runtimeErrors.length }));
} finally {
  await context.close();
  await browser.close();
}
