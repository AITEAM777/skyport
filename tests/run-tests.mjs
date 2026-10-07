// Skyport verification runner.
//   npm i -D playwright   (or use a global install)
//   node tests/run-tests.mjs [--shots]
// Serves the repo root over a tiny static server, opens it in Chromium, runs window.__test.all()
// and (with --shots) saves Inspect screenshots of every aircraft into tests/shots/.
import fs from 'node:fs';
import path from 'node:path';
import { openSkyport, here } from './lib.mjs';

const { page, errors, close } = await openSkyport({ query: '?notour' });

const results = await page.evaluate(() => window.__test.all());
let failed = 0;
for (const [k, v] of Object.entries(results)) {
  const ok = v.ok !== false; if (!ok && !v.blocked) failed++;
  console.log(`${ok ? 'PASS' : v.blocked ? 'SKIP' : 'FAIL'}  ${k.padEnd(22)} ${JSON.stringify(v)}`);
}
const ai = await page.evaluate(() => window.__test.aiRunway(900));
console.log(`${ai.ok ? 'PASS' : 'FAIL'}  aiRunway               ${JSON.stringify(ai)}`); if (!ai.ok) failed++;

// v2 guide + performance checks
const report = (name, v) => { const ok = v.ok !== false; if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(22)} ${JSON.stringify(v)}`); };
page.on('console', m => { const t = m.text(); if (t.startsWith('[hint]') || t.startsWith('[perf]')) console.log('      ' + t); });
report('hintFlow', await page.evaluate(() => window.__test.hintFlow('kestrel')));
report('tourRuns', await page.evaluate(() => window.__test.tourRuns()));
report('manualLanding', await page.evaluate(() => window.__test.manualLanding('swift')));
report('landingCrashes', await page.evaluate(() => window.__test.landingCrashes()));
report('world', await page.evaluate(() => window.__test.world()));
report('perf', await page.evaluate(() => window.__test.perf()));
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
{ // the real first launch: fresh storage → tour opens; Skip; reload → it stays closed
  const { page: p2, errors: e2, close: c2 } = await openSkyport();
  await p2.waitForFunction(() => window.__guide.state.tour === 0, null, { timeout: 30000 }).catch(() => {});
  const first = await p2.evaluate(() => window.__guide.state.tour);
  await p2.click('#tour-skip');
  await p2.reload(); await p2.waitForFunction(() => window.__ready, null, { timeout: 180000 }); await p2.waitForTimeout(2500);
  const again = await p2.evaluate(() => window.__guide.state.tour);
  report('tourFirstLaunch', { openedOnFirstLaunch: first === 0, reopenedAfterReload: again !== null, ok: first === 0 && again === null && !e2.length });
  await c2();
}


process.exit(failed || errors.length ? 1 : 0);
