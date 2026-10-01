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

async function goto(path) {
  const response = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.ok(response, `No response for ${path}`);
  assert.ok(response.ok(), `${path} returned ${response.status()}`);
  await page.getByText("Preview mode", { exact: false }).first().waitFor();
}

async function noBodyOverflow(label) {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert.ok(size.scrollWidth <= size.clientWidth + 1, `${label}: body overflow ${size.scrollWidth} > ${size.clientWidth}`);
}

async function pointerDrag(source, target) {
  await source.waitFor();
  await target.waitFor();
  await target.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  assert.ok(from && to, "Drag source/target must have bounding boxes");
  const sx = from.x + Math.min(from.width / 2, 48);
  const sy = from.y + Math.min(from.height / 2, 24);
  const tx = to.x + to.width / 2;
  const ty = to.y + to.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 12, sy + 8, { steps: 3 });
  await page.mouse.move(tx, ty, { steps: 18 });
  await page.waitForTimeout(200);
  await page.mouse.up();
}

try {
  await goto("/app/today");
  await page.getByRole("heading", { name: "Today" }).waitFor();
  await page.getByText("Sophie de Vries").waitFor();

  await page.getByRole("link", { name: "+ Afspraak" }).click();
  await page.waitForURL(/\/app\/calendar\/new/);

  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Datum").fill(tomorrow);
  const timeButtons = page.getByRole("button", { name: /^\d{2}:\d{2}$/ });
  await timeButtons.first().waitFor();

  await page.getByLabel("Zoek bestaande klant").fill("Sophie");
  const sophie = page.getByRole("button", { name: /Sophie de Vries/ }).first();
  await sophie.waitFor();
  await sophie.click();
  assert.equal(await page.getByLabel("Klantnaam").inputValue(), "Sophie de Vries");
  assert.ok((await page.getByLabel("Telefoon (optioneel)").inputValue()).length > 0);
  await page.getByRole("button", { name: "Andere / nieuwe klant" }).click();
  assert.equal(await page.getByLabel("Klantnaam").inputValue(), "");
  assert.equal(await page.getByLabel("Telefoon (optioneel)").inputValue(), "");
  assert.equal(await page.getByLabel("E-mail (optioneel)").inputValue(), "");

  await page.getByLabel("Klantnaam").fill("QA Browser Klant");
  await page.getByLabel("Telefoon (optioneel)").fill("0612345678");
  await page.getByLabel("E-mail (optioneel)").fill("qa-browser@example.invalid");
  await timeButtons.first().click();
  await page.getByRole("button", { name: "Afspraak opslaan" }).click();
  await page.waitForURL(/\/app\/appointments\/[0-9a-f-]+/);
  const appointmentId = new URL(page.url()).pathname.split("/").pop();
  assert.ok(appointmentId);

  const note = page.locator('textarea[name="note"]');
  await note.fill("Browser QA notitie");
  await page.getByRole("button", { name: "Notitie opslaan" }).click();
  await page.waitForURL(/saved=1/);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator('textarea[name="note"]').inputValue(), "Browser QA notitie");

  await page.getByRole("link", { name: "Verplaatsen" }).click();
  await page.waitForURL(/\/reschedule/);
  const rescheduleTimes = page.getByRole("button", { name: /^\d{2}:\d{2}$/ });
  await rescheduleTimes.nth(1).waitFor();
  await rescheduleTimes.nth(1).click();
  await page.getByRole("button", { name: "Afspraak verplaatsen" }).click();
  await page.waitForURL(new RegExp(`/app/appointments/${appointmentId}`));

  await goto("/app/blocks");
  await page.getByLabel("Voor wie?").selectOption({ label: "Nok" });
  await page.getByLabel("Van").fill(`${tomorrow}T16:00`);
  await page.getByLabel("Tot").fill(`${tomorrow}T16:30`);
  await page.getByLabel("Reden (optioneel)").fill("Browser QA conflict");
  await page.getByRole("button", { name: "Block toevoegen" }).click();
  await page.waitForURL(/\/app\/blocks/);
  await page.getByText("Browser QA conflict").waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Browser QA conflict").waitFor();

  await goto(`/app/calendar?date=${tomorrow}`);
  const dragHandle = page.locator(`[data-drag-appointment-id="${appointmentId}"]`);
  await dragHandle.waitFor();
  const maliTarget = page.locator('[data-drop-staff="33333333-3333-4333-8333-333333333334"][data-drop-minute="900"]');
  await pointerDrag(dragHandle, maliTarget);
  await page.getByText("Afspraak verplaatst.").waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Undo" }).click();
  await page.getByText("Verplaatsing teruggedraaid.").waitFor({ timeout: 10_000 });

  const nokBlockedTarget = page.locator('[data-drop-staff="33333333-3333-4333-8333-333333333333"][data-drop-minute="960"]');
  await pointerDrag(page.locator(`[data-drag-appointment-id="${appointmentId}"]`), nokBlockedTarget);
  await page.getByText(/niet beschikbaar|planning is intussen gewijzigd/i).waitFor({ timeout: 10_000 });

  await goto("/app/customers?q=QA%20Browser");
  await page.getByRole("link", { name: /QA Browser Klant/ }).click();
  await page.waitForURL(/\/app\/customers\//);
  await page.getByLabel("Naam").fill("QA Browser Klant Updated");
  await page.getByRole("button", { name: "Klant opslaan" }).click();
  await page.waitForURL(/saved=1/);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.getByLabel("Naam").inputValue(), "QA Browser Klant Updated");

  await goto("/app/staff");
  let staffDetails = page.locator("details").filter({ hasText: "Nok" }).first();
  await staffDetails.locator("summary").click();
  await staffDetails.locator('input[name="name"]').fill("Nok — Zeer lange medewerkernaam voor mobiele responsive QA");
  await staffDetails.getByRole("button", { name: "Wijzigingen opslaan" }).click();
  await page.waitForURL(/\/app\/staff/);
  staffDetails = page.locator("details").filter({ hasText: "Nok — Zeer lange medewerkernaam" }).first();
  await staffDetails.locator("summary").click();
  assert.match(await staffDetails.locator('input[name="name"]').inputValue(), /mobiele responsive QA/);

  await goto("/app/services");
  let serviceDetails = page.locator("details").filter({ hasText: "Thai Massage 60 min" }).first();
  await serviceDetails.locator("summary").click();
  await serviceDetails.locator('input[name="name"]').fill("Thai Massage 60 min — extra lange servicenaam voor responsive QA");
  await serviceDetails.locator('input[name="price"]').fill("66,50");
  await serviceDetails.getByRole("button", { name: "Wijzigingen opslaan" }).click();
  await page.waitForURL(/\/app\/services/);
  serviceDetails = page.locator("details").filter({ hasText: "extra lange servicenaam" }).first();
  await serviceDetails.locator("summary").click();
  assert.equal(await serviceDetails.locator('input[name="price"]').inputValue(), "66,50");

  await goto("/app/settings");
  await page.getByLabel("Telefoon").fill("070 204 88 99");
  await page.getByRole("button", { name: "Instellingen opslaan" }).click();
  await page.waitForURL(/saved=1/);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.getByLabel("Telefoon").inputValue(), "070 204 88 99");

  await goto("/app/reports");
  await page.getByRole("heading", { name: "Reports" }).waitFor();

  await goto(`/app/appointments/${appointmentId}`);
  await page.getByRole("button", { name: "Annuleren" }).click();
  await page.getByText("cancelled", { exact: true }).waitFor({ timeout: 10_000 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("cancelled", { exact: true }).waitFor();

  await fs.mkdir("qa-artifacts", { recursive: true });
  const widths = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440];
  const paths = [
    "/app/today",
    `/app/calendar?date=${tomorrow}`,
    "/app/calendar/new",
    "/app/customers?q=QA%20Browser",
    "/app/staff",
    "/app/services",
    "/app/blocks",
    "/app/settings",
    "/app/reports",
  ];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of paths) {
      await goto(path);
      await noBodyOverflow(`${width}px ${path}`);
      const unnamedButtons = await page.locator("button").evaluateAll((nodes) =>
        nodes.filter((node) => !(node.textContent?.trim() || node.getAttribute("aria-label") || node.getAttribute("title"))).length
      );
      assert.equal(unnamedButtons, 0, `${width}px ${path}: unnamed buttons`);
    }
    await goto("/app/today");
    await page.keyboard.press("Tab");
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? "");
    assert.notEqual(activeTag, "BODY", `${width}px: keyboard focus did not move`);
    if (width === 320) {
      await goto(`/app/calendar?date=${tomorrow}`);
      await page.screenshot({ path: "qa-artifacts/calendar-320.png", fullPage: true });
    }
    if (width === 1440) {
      await goto("/app/today");
      await page.screenshot({ path: "qa-artifacts/today-1440.png", fullPage: true });
    }
  }

  assert.deepEqual(runtimeErrors, [], `Runtime errors detected:\n${runtimeErrors.join("\n")}`);
  await fs.writeFile("qa-artifacts/result.json", JSON.stringify({
    ok: true,
    appointmentId,
    widths,
    flows: ["today","calendar","create","customer-search-reset","note-edit","reschedule","block","drag-drop","validated-undo","invalid-drag","customer-edit","staff-edit","service-edit","settings","reports","cancel","refresh-persistence"],
    runtimeErrors,
  }, null, 2));
  console.log("BROWSER_QA_PASS", JSON.stringify({ appointmentId, widths, runtimeErrors: runtimeErrors.length }));
} finally {
  await context.close();
  await browser.close();
}
