// Skyport verification runner.
//   npm i -D playwright   (or use a global install)
//   node tests/run-tests.mjs [--shots]
// Serves the repo root over a tiny static server, opens it in Chromium, runs window.__test.all()
// and (with --shots) saves Inspect screenshots of every aircraft into tests/shots/.
import fs from 'node:fs';
import path from 'node:path';
import { openSkyport, here } from './lib.mjs';

const { page, errors, close } = await openSkyport();

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
await close();
process.exit(failed || errors.length ? 1 : 0);
