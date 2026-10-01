import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseURL = process.env.PREVIEW_URL;
if (!baseURL) throw new Error("PREVIEW_URL is required.");

const outDir = "qa-screenshots";
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];
const results = [];

const viewports = [
  { name: "320", width: 320, height: 700 },
  { name: "360", width: 360, height: 800 },
  { name: "375", width: 375, height: 812 },
  { name: "390", width: 390, height: 844 },
  { name: "430", width: 430, height: 932 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 900 },
  { name: "1440", width: 1440, height: 1000 },
];

function recordFailure(label, message) {
  failures.push(`${label}: ${message}`);
  console.error(`FAIL ${label}: ${message}`);
}

async function inspectRoute(route, viewport, { screenshot = false } = {}) {
  const label = `${route} @ ${viewport.name}px`;
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const runtimeErrors = [];

  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });

  try {
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle", timeout: 45_000 });
    if (!response || response.status() !== 200) {
      recordFailure(label, `document status ${response?.status() ?? "none"}`);
    }

    const state = await page.evaluate(() => ({
      textLength: document.body.innerText.trim().length,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      overlay: Boolean(document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")),
      title: document.title,
      overflowOffenders: Array.from(document.querySelectorAll("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            className: typeof element.className === "string" ? element.className : "",
            text: (element.textContent || "").trim().slice(0, 80),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter((item) => item.left < -1 || item.right > window.innerWidth + 1)
        .slice(0, 12),
    }));

    if (state.textLength < 50) recordFailure(label, `body too small (${state.textLength} chars)`);
    if (state.overflow > 1) recordFailure(label, `horizontal overflow +${state.overflow}px offenders=${JSON.stringify(state.overflowOffenders)}`);
    if (state.overlay) recordFailure(label, "framework error overlay detected");

    await page.waitForTimeout(200);
    if (runtimeErrors.length) recordFailure(label, runtimeErrors.join(" | "));

    if (screenshot) {
      const safe = route === "/" ? "home" : route.replaceAll("/", "-").replace(/^-/, "");
      await page.screenshot({ path: `${outDir}/${safe}-${viewport.name}.png`, fullPage: true });
    }

    results.push({ route, viewport: viewport.name, ...state, runtimeErrors });
    console.log(`PASS-CHECK ${label} overflow=${state.overflow}px text=${state.textLength}`);
  } catch (error) {
    recordFailure(label, error instanceof Error ? error.message : String(error));
  } finally {
    await context.close();
  }
}

for (const viewport of viewports) {
  await inspectRoute("/", viewport, { screenshot: ["390", "1440"].includes(viewport.name) });
  await inspectRoute("/app/today", viewport, { screenshot: ["320", "1440"].includes(viewport.name) });
  await inspectRoute("/book/baan-thai-demo", viewport, { screenshot: ["390"].includes(viewport.name) });
}

for (const viewport of viewports.filter((item) => ["320", "390", "768", "1440"].includes(item.name))) {
  await inspectRoute("/app/calendar", viewport, { screenshot: ["390", "1440"].includes(viewport.name) });
}

for (const route of ["/app/customers", "/app/services", "/app/staff", "/app/settings", "/app/more", "/app/blocks", "/app/reports"]) {
  for (const viewport of viewports.filter((item) => ["320", "390", "1024"].includes(item.name))) {
    await inspectRoute(route, viewport, { screenshot: route === "/app/settings" && viewport.name === "320" });
  }
}

async function interactiveChecks() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  try {
    await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Menu" }).click();
    if (!(await page.locator("dialog[open]").isVisible())) recordFailure("mobile menu", "dialog did not open");
    if (!(await page.locator("dialog").getByText("Hoe het werkt", { exact: true }).isVisible())) recordFailure("mobile menu", "navigation content missing");
    await page.getByRole("button", { name: "Menu sluiten" }).click();
    if (await page.locator("dialog[open]").count()) recordFailure("mobile menu", "dialog remained open");
    console.log("PASS-CHECK mobile menu open/close");

    await page.goto(`${baseURL}/book/baan-thai-demo`, { waitUntil: "networkidle" });
    const firstService = page.locator("section button").first();
    await firstService.click();

    if (await page.getByRole("heading", { name: "Heb je een voorkeur?" }).count()) {
      await page.getByRole("button", { name: /Geen voorkeur/ }).click();
    }

    let timeButtons = page.getByRole("button", { name: /^\d{2}:\d{2}$/ });
    for (let attempts = 0; attempts < 14 && (await timeButtons.count()) === 0; attempts += 1) {
      const dateButtons = page.locator("section button").filter({ has: page.locator("span") });
      const candidate = dateButtons.nth(Math.min(attempts + 1, Math.max(0, (await dateButtons.count()) - 1)));
      if (await candidate.count()) {
        await candidate.click();
        await page.waitForTimeout(450);
        timeButtons = page.getByRole("button", { name: /^\d{2}:\d{2}$/ });
      }
    }

    if ((await timeButtons.count()) === 0) {
      recordFailure("public booking", "no selectable time slot found across date choices");
    } else {
      await timeButtons.first().click();
      await page.getByRole("button", { name: "Verder" }).click();
      await page.getByLabel("Naam").fill("QA Klant");
      await page.getByLabel("Telefoon").fill("0612345678");
      await page.getByLabel("E-mail").fill("qa@example.com");
      await page.getByRole("button", { name: "Afspraak bevestigen" }).click();
      await page.getByRole("heading", { name: "Je afspraak staat gepland" }).waitFor({ timeout: 15_000 });
      await page.screenshot({ path: `${outDir}/booking-success-390.png`, fullPage: true });
      console.log("PASS-CHECK public booking full demo flow");
    }

    await page.goto(`${baseURL}/app/today`, { waitUntil: "networkidle" });
    const appointment = page.locator('a[href^="/app/appointments/"]').first();
    if (!(await appointment.count())) {
      recordFailure("appointment detail", "no demo appointment link found from Today");
    } else {
      await appointment.click();
      await page.getByText("Afspraak", { exact: true }).first().waitFor();
      const cancelLink = page.getByRole("link", { name: "Annuleren" });
      if (await cancelLink.count()) {
        await cancelLink.click();
        await page.getByRole("heading", { name: "Afspraak annuleren?" }).waitFor();
        await page.getByRole("link", { name: "Niet annuleren" }).click();
        await page.getByText("Afspraak", { exact: true }).first().waitFor();
        console.log("PASS-CHECK cancellation confirmation roundtrip");
      }
    }

    await page.goto(`${baseURL}/app/calendar/new`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Plan een afspraak" }).waitFor();
    await page.waitForTimeout(600);
    const internalTimes = page.getByRole("button", { name: /^\d{2}:\d{2}$/ });
    if ((await internalTimes.count()) === 0) {
      recordFailure("internal appointment", "no available demo time loaded");
    } else {
      await internalTimes.first().click();
      await page.getByLabel("Klantnaam").fill("QA Interne Klant");
      const save = page.getByRole("button", { name: "Afspraak opslaan" });
      if (await save.isDisabled()) recordFailure("internal appointment", "save button stayed disabled after slot selection");
      console.log("PASS-CHECK internal appointment form load/select");
    }

    if (errors.length) recordFailure("interactive runtime", errors.join(" | "));
  } catch (error) {
    recordFailure("interactive checks", error instanceof Error ? error.message : String(error));
  } finally {
    await context.close();
  }
}

await interactiveChecks();

await fs.writeFile("qa-results.json", JSON.stringify({ baseURL, results, failures }, null, 2));
await browser.close();

console.log(`Browser QA completed: ${results.length} route/viewport checks, ${failures.length} failures.`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
