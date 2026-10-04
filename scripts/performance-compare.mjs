import { readFile, writeFile } from 'node:fs/promises';

const before = JSON.parse(await readFile('qa-artifacts/performance/results-before.json', 'utf8'));
const after = JSON.parse(await readFile('qa-artifacts/performance/results-after.json', 'utf8'));
const median = values => values.filter(value => value !== null).sort((a, b) => a - b)[Math.floor(values.filter(value => value !== null).length / 2)] ?? null;
const comparisons = [];
for (const width of [390, 1440]) for (const route of new Set(before.results.map(row => row.route))) for (const cache of ['cold', 'warm']) {
  const baseline = before.results.filter(row => row.width === width && row.route === route && row.cache === cache);
  const candidate = after.results.filter(row => row.width === width && row.route === route && row.cache === cache);
  if (baseline.length !== 3 || candidate.length !== 3) throw new Error(`Missing equivalent measurements: ${route} ${width} ${cache}`);
  const metrics = {};
  for (const metric of ['ttfbMs', 'lcpMs', 'jsEncodedBytes', 'cls']) {
    const from = median(baseline.map(row => row[metric]));
    const to = median(candidate.map(row => row[metric]));
    metrics[metric] = { before: from, after: to, delta: from !== null && to !== null ? to - from : null };
  }
  comparisons.push({ width, route, cache, metrics });
}
const report = { conditions: before.conditions, baseline: before.base, candidate: after.base, sha: after.sha, comparisons };
await writeFile('qa-artifacts/performance/comparison.json', JSON.stringify(report, null, 2));
console.log('MIGRATION_PERFORMANCE_COMPARISON', JSON.stringify(report));
