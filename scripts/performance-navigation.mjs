import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const targets = [
  ['before', process.env.QA_BASELINE_URL],
  ['after', process.env.QA_BASE_URL],
].filter(([, url]) => url);
assert.ok(targets.length, 'A measurement URL is required');
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [label, base] of targets) for (const width of [390, 1440]) for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto(new URL('/app/today', base).href, { waitUntil: 'networkidle' });
    await page.getByTestId('today-command-centre').waitFor();
    const documentTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    const started = performance.now();
    await page.getByRole('link', { name: /^(Calendar|Agenda)$/, exact: true }).click();
    await page.waitForURL('**/app/calendar**');
    await page.locator(width < 768 ? '[data-mobile-calendar]' : '[data-drop-staff]').first().waitFor({ state: 'visible', timeout: 30000 });
    const elapsedMs = performance.now() - started;
    assert.equal(await page.evaluate(() => performance.timeOrigin), documentTimeOrigin, 'Navigation must use the actual Next Link without a full document reload');
    results.push({ label, base, width, run, elapsedMs });
    await context.close();
  }
  await mkdir('qa-artifacts/performance', { recursive: true });
  await writeFile('qa-artifacts/performance/navigation.json', JSON.stringify({ measuredAt: new Date().toISOString(), sha: process.env.SALON_QA_SHA, conditions: 'Same CI runner; fresh browser context; Today settled before clicking visible Calendar/Agenda Next Link; wait for usable mobile timeline or desktop drop column; lab navigation elapsed time, not field INP', results }, null, 2));
  console.log(JSON.stringify({ navigation: results }));
} finally { await browser.close(); }
