import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { gzipSync } from 'node:zlib';

const root = resolve(process.env.SALON_SOURCE_ROOT ?? '.');
const build = resolve(root, '.next');
const files = (await readdir(resolve(build, 'server/app'), { recursive: true })).filter(path => path.endsWith('_client-reference-manifest.js'));
const routes = [];
for (const file of files) {
  const sandbox = {};
  runInNewContext(await readFile(resolve(build, 'server/app', file), 'utf8'), sandbox);
  for (const [route, manifest] of Object.entries(sandbox.__RSC_MANIFEST)) {
    if (!route.startsWith('/app/') && !route.startsWith('/book/')) continue;
    const paths = [...new Set(Object.values(manifest.entryJSFiles).flat())];
    const buffers = await Promise.all(paths.map(path => readFile(resolve(build, path))));
    routes.push({ route, chunks: paths.length, bytes: buffers.reduce((sum, buffer) => sum + buffer.length, 0), gzipBytes: buffers.reduce((sum, buffer) => sum + gzipSync(buffer).length, 0) });
  }
}
const report = { label: process.env.QA_PROFILE_LABEL ?? 'after', conditions: 'Next production client entry manifests, unique route chunk union; includes error/shared entries; gzip per chunk, not measured browser transfer', routes: routes.sort((a, b) => a.route.localeCompare(b.route)) };
await mkdir('qa-artifacts/performance', { recursive: true });
await writeFile(`qa-artifacts/performance/bundle-${report.label}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
