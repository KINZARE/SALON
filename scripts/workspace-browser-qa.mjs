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

async function assertNoDemoContent() {
  const body = (await page.locator("body").innerText()).toLowerCase();
  assert.ok(!body.includes("preview mode"), "Preview mode banner must not exist");
  assert.ok(!body.includes("baan thai wellness"), "Synthetic demo salon must not be exposed");
  assert.ok(!body.includes("sophie de vries"), "Synthetic demo customer must not be exposed");
}

async function assertLoginGate(path) {
  const response = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.ok(response, `No response for ${path}`);
  assert.equal(new URL(page.url()).pathname, "/login", `${path} must redirect to /login`);
  await page.getByRole("heading", { name: "Welkom terug" }).waitFor();
  await assertNoDemoContent();
}

async function noBodyOverflow(label) {
  const size = await page.evaluate(() => {
    const root = document.documentElement;
    return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
  });
  assert.ok(size.scrollWidth <= size.clientWidth + 1, `${label}: body overflow ${size.scrollWidth} > ${size.clientWidth}`);
}

try {
  const protectedPaths = [
    "/",
    "/app/today",
    "/app/calendar",
    "/app/customers",
    "/app/staff",
    "/app/services",
    "/app/blocks",
    "/app/settings",
    "/app/reports",
  ];

  for (const path of protectedPaths) {
    await assertLoginGate(path);
  }

  await page.goto(base + "/signup", { waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/signup");
  await page.getByRole("heading", { name: "Maak je salon boekbaar" }).waitFor();
  await page.getByLabel("Naam").waitFor();
  await page.getByLabel("E-mail").waitFor();
  await page.getByLabel("Wachtwoord").waitFor();
  await page.getByRole("button", { name: "Account maken" }).waitFor();
  await assertNoDemoContent();

  await fs.mkdir("qa-artifacts", { recursive: true });
  const widths = [320, 390, 768, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });

    await assertLoginGate("/app/today");
    await noBodyOverflow(`${width}px /login`);

    await page.goto(base + "/signup", { waitUntil: "networkidle" });
    await noBodyOverflow(`${width}px /signup`);
    await assertNoDemoContent();

    if (width === 320) {
      await page.goto(base + "/login", { waitUntil: "networkidle" });
      await page.screenshot({ path: "qa-artifacts/login-320.png", fullPage: true });
    }
    if (width === 1440) {
      await page.goto(base + "/signup", { waitUntil: "networkidle" });
      await page.screenshot({ path: "qa-artifacts/signup-1440.png", fullPage: true });
    }
  }

  assert.deepEqual(runtimeErrors, [], `Runtime errors detected:\n${runtimeErrors.join("\n")}`);
  const result = {
    ok: true,
    mode: "real-authenticated",
    protectedPaths,
    widths,
    flows: ["root-to-login", "workspace-auth-gate", "signup", "no-demo-content", "responsive-auth"],
    runtimeErrors,
  };
  await fs.writeFile("qa-artifacts/result.json", JSON.stringify(result, null, 2));
  console.log("REAL_MODE_QA_PASS", JSON.stringify({ widths, protectedPaths: protectedPaths.length, runtimeErrors: runtimeErrors.length }));
} finally {
  await context.close();
  await browser.close();
}
