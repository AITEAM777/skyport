// Skyport verification runner.
//   npm i -D playwright   (or use a global install)
//   node tests/run-tests.mjs [--shots]
// Serves the repo root over a tiny static server, opens it in Chromium, runs window.__test.all()
// and (with --shots) saves Inspect screenshots of every aircraft into tests/shots/.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url);
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 180000 });

const results = await page.evaluate(() => window.__test.all());
let failed = 0;
for (const [k, v] of Object.entries(results)) {
  const ok = v.ok !== false; if (!ok && !v.blocked) failed++;
  console.log(`${ok ? 'PASS' : v.blocked ? 'SKIP' : 'FAIL'}  ${k.padEnd(22)} ${JSON.stringify(v)}`);
}
const ai = await page.evaluate(() => window.__test.aiRunway(900));
console.log(`${ai.ok ? 'PASS' : 'FAIL'}  aiRunway               ${JSON.stringify(ai)}`); if (!ai.ok) failed++;

if (process.argv.includes('--shots')) {
  const out = path.join(here, 'shots'); fs.mkdirSync(out, { recursive: true });
  for (const m of ['meridian', 'atlas', 'swift', 'kestrel']) {
    await page.evaluate(m => { window.__api.rollOut(m); window.__advance(12, 6); }, m);
    for (const v of ['34', 'side', 'front', 'bottom']) {
      await page.evaluate(v => { window.__api.setCamMode('inspect', { view: v }); window.__advance(1.2, 3); }, v);
      await page.screenshot({ path: path.join(out, `inspect_${m}_${v}.png`) });
    }
    await page.evaluate(() => window.__api.setCamMode('orbit'));
  }
  console.log('screenshots →', out);
}
console.log(errors.length ? `console errors:\n  ${errors.join('\n  ')}` : 'no console errors');
await browser.close(); server.close();
process.exit(failed || errors.length ? 1 : 0);
