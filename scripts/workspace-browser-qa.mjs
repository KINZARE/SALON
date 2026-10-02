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
  await page.getByRole("heading", { name: "Je salon vandaag" }).waitFor();
  await assertNoDemoOrLoginContent();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base + "/app/today", { waitUntil: "networkidle" });
  assert.ok(await page.locator("[data-workspace-icon]").count() >= 4, "Desktop navigation must use semantic workspace icons instead of letter glyphs");

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(base + "/app/today", { waitUntil: "networkidle" });
  for (const label of ["Today", "Calendar", "Customers", "More"]) {
    await page.getByRole("link", { name: label, exact: true }).waitFor();
  }

  await page.getByTestId("today-command-centre").waitFor();
  await page.getByText("Vrije ruimte", { exact: true }).waitFor();
  await page.getByRole("link", { name: /Afspraak/ }).first().waitFor();
  await page.getByRole("link", { name: /Blokkeer tijd/ }).first().waitFor();

  const workspacePaths = [
    "/app/today",
    "/app/calendar",
    "/app/customers",
    "/app/staff",
    "/app/services",
    "/app/blocks",
    "/app/settings",
    "/app/reports",
    "/app/booking-links",
    "/app/waitlist",
    "/app/intake",
    "/app/settings/schedule",
    "/app/settings/widget",
    "/app/more",
  ];
  for (const path of workspacePaths) await gotoWorkspace(path);

  await page.setViewportSize({ width: 1440, height: 900 });
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
  assert.equal(await page.locator("[data-staff-identity]").count(), 4, "Calendar must show one clear staff identity per active staff column");
  await page.locator("[data-current-time-line]").waitFor();
  const quickBlock = page.getByRole("link", { name: "Blokkeer tijd", exact: true });
  await quickBlock.waitFor();
  assert.match(await quickBlock.getAttribute("href") ?? "", /^\/app\/blocks\?date=\d{4}-\d{2}-\d{2}$/);

  const appointmentHref = await page.locator("[data-calendar-detail]").getByRole("link", { name: "Open afspraak" }).getAttribute("href");
  assert.ok(appointmentHref, "Calendar detail must expose the appointment action centre");
  await page.goto(base + appointmentHref, { waitUntil: "networkidle" });
  await page.locator("[data-appointment-action-centre]").waitFor();
  await page.locator("[data-status-chip]").waitFor();
  await page.getByRole("link", { name: "Verplaatsen", exact: true }).waitFor();

  await page.goto(base + "/app/calendar?view=week", { waitUntil: "networkidle" });
  await page.locator("[data-calendar-week]").waitFor();
  const weekAppointment = page.locator("[data-calendar-week] a[href^='/app/appointments/']").first();
  assert.ok(await weekAppointment.count() > 0, "Week view appointments must link to the appointment action centre");

  await page.goto(base + "/app/calendar?view=month", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Dag/ }).waitFor();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("[data-calendar-month]").waitFor();

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(base + "/app/calendar", { waitUntil: "networkidle" });
  await page.locator("[data-mobile-calendar]").waitFor();
  assert.equal(await page.locator("[data-mobile-calendar]").isVisible(), true, "390px must use the dedicated mobile calendar");
  assert.equal(await page.locator("[data-desktop-calendar]").isVisible(), false, "Desktop staff columns must not be the primary mobile calendar");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base + "/app/calendar", { waitUntil: "networkidle" });
  assert.equal(await page.locator("[data-desktop-calendar]").isVisible(), true, "Desktop calendar must remain visible on wide screens");
  await page.locator("[data-calendar-block-action]").waitFor();

  const blockHref = await page.locator("[data-calendar-block-action]").getAttribute("href");
  assert.ok(blockHref?.includes("date="), "Calendar block action must prefill the selected date");
  await page.goto(base + blockHref, { waitUntil: "networkidle" });
  assert.ok((await page.getByLabel("Van").inputValue()).startsWith(new URL(base + blockHref).searchParams.get("date") ?? ""), "Block form must use the calendar date");

  await page.goto(base + "/app/calendar", { waitUntil: "networkidle" });
  const detailSeed = page.locator("[data-appointment-id]").first();
  await detailSeed.click();
  const detailHref = await page.locator("[data-calendar-detail] a").getAttribute("href");
  assert.ok(detailHref, "Calendar detail must link to appointment");
  await page.goto(base + detailHref, { waitUntil: "networkidle" });
  await page.locator("[data-appointment-action-centre]").waitFor();

  await page.goto(base + "/app/customers", { waitUntil: "networkidle" });
  const customerHref = await page.locator("a[href^='/app/customers/']").first().getAttribute("href");
  assert.ok(customerHref, "Customer list must expose a customer detail route");
  await page.goto(base + customerHref, { waitUntil: "networkidle" });
  await page.locator("[data-customer-profile]").waitFor();
  await page.getByText("Komende afspraak", { exact: true }).waitFor();

  await page.goto(base + "/app/staff", { waitUntil: "networkidle" });
  assert.ok(await page.locator("[data-staff-editor]").count() > 0, "Staff must use focused editor surfaces");
  await page.goto(base + "/app/services", { waitUntil: "networkidle" });
  assert.ok(await page.locator("[data-service-editor]").count() > 0, "Services must use focused editor surfaces");

  await page.goto(base + "/app/calendar", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Volgende periode" }).click();
  await page.waitForLoadState("networkidle");
  const dragCard = page.locator("[data-appointment-id]").filter({ hasText: "Nina Hendriks" }).first();
  await dragCard.waitFor();
  await dragCard.scrollIntoViewIfNeeded();
  const beforeTop = await dragCard.evaluate((element) => Number.parseFloat(element.parentElement?.parentElement?.style.top ?? "0"));

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

  const optimisticTop = await dragCard.evaluate((element) => Number.parseFloat(element.parentElement?.parentElement?.style.top ?? "0"));
  assert.ok(optimisticTop >= beforeTop + 30, `Appointment should move optimistically before API response: ${beforeTop} -> ${optimisticTop}`);

  const moveResponse = page.waitForResponse((response) => response.url().includes("/api/internal/move"));
  releaseMove();
  await moveResponse;
  await page.unroute("**/api/internal/move");
  await page.waitForLoadState("networkidle");
  const revertedTop = await dragCard.evaluate((element) => Number.parseFloat(element.parentElement?.parentElement?.style.top ?? "0"));
  assert.equal(revertedTop, beforeTop, "Rejected move must roll back to the original position");
  const expectedConflictLog = runtimeErrors.findIndex((entry) => entry.includes("Failed to load resource") && entry.includes("409"));
  if (expectedConflictLog >= 0) runtimeErrors.splice(expectedConflictLog, 1);

  await page.goto(base + "/app/customers", { waitUntil: "networkidle" });
  const firstCustomer = page.locator("a[href^='/app/customers/']").first();
  const customerActionHref = await firstCustomer.getAttribute("href");
  assert.ok(customerActionHref, "Customer list must link to customer detail");
  await page.goto(base + customerActionHref, { waitUntil: "networkidle" });
  await page.locator("[data-customer-action-centre]").waitFor();
  await page.getByText("Komende afspraak", { exact: true }).waitFor();
  const rebook = page.getByRole("link", { name: /Nieuwe afspraak/ }).first();
  await rebook.waitFor();
  assert.match(await rebook.getAttribute("href") ?? "", /^\/app\/calendar\/new\?customerId=/);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(base + "/app/staff", { waitUntil: "networkidle" });
  await page.locator("[data-staff-workspace]").waitFor();
  await page.locator("[data-staff-workspace] details").first().locator("summary").click();
  await page.locator("[data-mobile-staff-schedule]").first().waitFor();
  await noBodyOverflow("390px staff editor");

  await page.goto(base + "/app/services", { waitUntil: "networkidle" });
  await page.locator("[data-services-workspace]").waitFor();

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

  await page.goto(base + "/app/reports?preset=last30", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Rapportage" }).waitFor();
  await page.getByRole("link", { name: "CSV exporteren" }).waitFor();

  await page.goto(base + "/app/intake", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Formulieren & toestemming" }).waitFor();

  await page.goto(base + "/app/settings/schedule", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Afwijkende opening & shifts" }).waitFor();

  await page.goto(base + "/app/settings/widget", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Boeken op je eigen website" }).waitFor();

  await page.goto(base + "/book/salon", { waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/book/salon");
  await page.getByText("Online afspraak maken").waitFor();
  await page.getByText("Knippen & stylen", { exact: true }).first().waitFor();
  await assertNoDemoOrLoginContent();

  await page.goto(base + "/embed/salon", { waitUntil: "networkidle" });
  await page.getByText("Online afspraak maken").waitFor();
  await page.getByText("Knippen & stylen", { exact: true }).first().waitFor();
  await noBodyOverflow("booking embed");

  await fs.mkdir("qa-artifacts", { recursive: true });
  const widths = [320, 375, 390, 430, 768, 1024, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of workspacePaths) {
      await gotoWorkspace(path);
      await noBodyOverflow(`${width}px ${path}`);
    }
    await page.goto(base + "/app/calendar", { waitUntil: "networkidle" });
    await noBodyOverflow(`${width}px calendar visual`);
    if ([320,390,768,1440].includes(width)) {
      await page.screenshot({ path: `qa-artifacts/calendar-${width}.png`, fullPage: true });
      await page.goto(base + "/app/today", { waitUntil: "networkidle" });
      await noBodyOverflow(`${width}px today visual`);
      await page.screenshot({ path: `qa-artifacts/today-${width}.png`, fullPage: true });
    }
  }

  assert.deepEqual(runtimeErrors, [], `Runtime errors detected:\n${runtimeErrors.join("\n")}`);
  const result = {
    ok: true,
    mode: "real-no-login",
    workspacePaths,
    widths,
    flows: ["root-direct-workspace", "today-command-centre", "calendar-redesign", "calendar-optimistic-drag", "calendar-conflict-rollback", "mobile-calendar", "appointment-detail-panel", "customer-profile", "staff-service-management", "smart-booking-links-workspace", "waitlist-workspace", "auth-routes-bypassed", "real-settings-persistence", "public-booking-real-salon", "no-legacy-demo-content", "responsive-workspace"],
    runtimeErrors,
  };
  await fs.writeFile("qa-artifacts/result.json", JSON.stringify(result, null, 2));
  console.log("REAL_NO_LOGIN_QA_PASS", JSON.stringify({ widths, workspacePaths: workspacePaths.length, runtimeErrors: runtimeErrors.length }));
} finally {
  await context.close();
  await browser.close();
}
