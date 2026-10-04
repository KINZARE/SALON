import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.QA_BASE_URL;
if (!base) throw new Error('QA_BASE_URL is required');
const routes = ['/app/today', '/app/calendar?view=day', '/app/calendar?view=week', '/app/calendar?view=month', '/app/customers', '/app/services', '/app/staff', '/app/reports', '/app/intake', '/app/settings', '/book/salon'];
const browser = await chromium.launch({ headless: true });
const results = [];
await mkdir('qa-artifacts/performance', { recursive: true });
try {
  for (const width of [390, 1440]) {
    for (const route of routes) {
      for (let run = 0; run < 3; run++) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        await page.addInitScript(() => {
          window.__perf = { lcp: null, cls: 0, maxEvent: null };
          new PerformanceObserver(list => { for (const e of list.getEntries()) window.__perf.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver(list => { for (const e of list.getEntries()) window.__perf.maxEvent = Math.max(window.__perf.maxEvent ?? 0, e.duration); }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
        });
        for (const cache of ['cold', 'warm']) {
          const response = await page.goto(new URL(route, base).href, { waitUntil: 'networkidle', timeout: 45000 });
          if (!response?.ok() || !new URL(page.url()).pathname.startsWith(new URL(route, base).pathname)) throw new Error(`Route unavailable: ${route} ${response?.status()} ${page.url()}`);
          await page.locator('h1').first().waitFor({ timeout: 30000 });
          const metrics = await page.evaluate(() => {
            const nav = performance.getEntriesByType('navigation')[0];
            const resources = performance.getEntriesByType('resource');
            const scripts = resources.filter(r => new URL(r.name).pathname.endsWith('.js'));
            return { ttfbMs: nav.responseStart - nav.startTime, documentMs: nav.responseEnd - nav.startTime, fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null, lcpMs: window.__perf.lcp, cls: window.__perf.cls, observedEventMs: window.__perf.maxEvent, jsTransferredBytes: scripts.reduce((sum, r) => sum + r.transferSize, 0), jsEncodedBytes: scripts.reduce((sum, r) => sum + r.encodedBodySize, 0), documentEncodedBytes: nav.encodedBodySize, scripts: scripts.length };
          });
          results.push({ route, width, run, cache, status: response.status(), ...metrics });
        }
        await context.close();
      }
      console.log(`Measured ${width}px ${route}`);
    }
  }
  const report = { base, measuredAt: new Date().toISOString(), sha: process.env.SALON_QA_SHA, browser: browser.version(), conditions: 'GitHub hosted Linux Chromium; no CPU or network throttle; 390/1440px, 900px high; three fresh-context navigations each followed by warm reload; lab observations, not field Core Web Vitals; observedEventMs is not field INP', results };
  await writeFile(`qa-artifacts/performance/results-${process.env.QA_PROFILE_LABEL ?? 'after'}.json`, JSON.stringify(report, null, 2));
  const median = values => values.filter(v => v !== null).sort((a, b) => a - b)[Math.floor(values.filter(v => v !== null).length / 2)] ?? null;
  const summary = [];
  for (const width of [390, 1440]) for (const route of routes) for (const cache of ['cold', 'warm']) {
    const rows = results.filter(r => r.width === width && r.route === route && r.cache === cache);
    summary.push({ route, width, cache, ttfbMs: median(rows.map(r => r.ttfbMs)), lcpMs: median(rows.map(r => r.lcpMs)), documentMs: median(rows.map(r => r.documentMs)), jsBytes: median(rows.map(r => r.jsTransferredBytes)), jsEncodedBytes: median(rows.map(r => r.jsEncodedBytes)), cls: Math.max(...rows.map(r => r.cls)) });
  }
  console.log(JSON.stringify({ base, summary }));
} finally { await browser.close(); }
