// Screenshot set for before/after comparisons.
//   node tests/shots.mjs <outDir> [--extra]
// Scenes: orbit, Inspect of every plane (3/4 + side), chase on runway 09 (Kestrel, LINE-UP), mid-loop, night.
// --extra adds the guide UI: hint bar during the takeoff roll, help overlay tabs, onboarding step 1.
import fs from 'node:fs';
import path from 'node:path';
import { openSkyport } from './lib.mjs';

const out = path.resolve(process.argv[2] || 'tests/shots/after');
const extra = process.argv.includes('--extra');
fs.mkdirSync(out, { recursive: true });
const { page, errors, close } = await openSkyport({ query: '?notour' });
const shot = async (name) => { await page.waitForTimeout(700); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('  ' + name); };
const ev = (fn, arg) => page.evaluate(fn, arg);

await page.waitForTimeout(1800); // loading overlay fade
await ev(() => { window.__advance(2, 4); });
await shot('01_orbit');

for (const m of ['meridian', 'atlas', 'swift', 'kestrel']) {
  await ev(m => { window.__api.rollOut(m); window.__advance(12, 6); }, m);
  for (const v of ['34', 'side']) {
    await ev(v => { window.__api.setCamMode('inspect', { view: v }); window.__advance(1.2, 3); }, v);
    await shot(`02_inspect_${m}_${v}`);
  }
  await ev(() => window.__api.setCamMode('orbit'));
}

// chase camera, Kestrel lined up on runway 09
await ev(() => { window.__api.resetPlaneToThreshold(); window.__api.setCamMode('chase'); window.__advance(2, 4); });
await shot('03_chase_runway');

if (extra) { // hint bar during the takeoff roll
  await ev(() => { const p = window.__game.player; window.__game.parkBrake = false; p.brakes = 0; p.throttle = 1; window.__advance(3, 6); });
  await shot('07_hint_takeoff_roll');
}

// mid-loop (Kestrel at 1200 m)
await ev(() => {
  const g = window.__game, p = g.player;
  p.placeAt(-200, -250, 0, 1200); p.onGround = false; p.groundT = 0; p.airT = 5; p.lastAir = 5; p.gearDown = false; p.gearT = 0;
  p.flaps = 0; p.anim.flap = 0; p.engineOn = true; p.n1 = 1; p.throttle = 1; p.vel.set(80, 0, 0); p.v = 80; p.agl = 1200; g.parkBrake = false; p.brakes = 0;
  window.__api.setCamMode('chase'); window.__advance(1, 2);
  window.__api.startManeuver(1); window.__advance(4.5, 9);
});
await shot('04_mid_loop');

// night: orbit + chase on the runway
await ev(() => { window.__api.applyTimeOfDay(1, false); window.__api.setCamMode('orbit', { reset: true }); window.__advance(1.5, 3); });
await new Promise(r => setTimeout(r, 400));
await ev(() => window.__advance(0.5, 2));
await shot('05_night_orbit');
await ev(() => { window.__api.resetPlaneToThreshold(); const p = window.__game.player; p.lightsOn = true; window.__api.setCamMode('chase'); window.__advance(2, 4); });
await shot('06_night_chase');

if (extra) {
  await ev(() => { window.__api.applyTimeOfDay(0.33, false); window.__advance(0.5, 2); });
  for (const tab of ['controls', 'fly', 'maneuvers']) {
    await ev(t => { window.__guide.openHelp(t); }, tab);
    await page.waitForTimeout(400);
    await shot(`08_help_${tab}`);
  }
  await ev(() => window.__guide.closeHelp());
  await ev(() => { window.__api.setCamMode('orbit', { reset: true }); window.__advance(1, 2); window.__guide.startTour(); });
  await page.waitForTimeout(500);
  await shot('09_tour_step1');
}
if (process.argv.includes('--world')) { // v3: open world, landing, extras
  await ev(() => { window.__api.applyTimeOfDay(0.33, false); window.__guide.closeHelp(); window.__guide.endTour(); });
  await ev(() => { window.__setOrbit([2500, 1400, 4500], [0, 0, -2000]); window.__advance(1, 2); }); await shot('10_world_overview');
  await ev(() => { window.__setOrbit([1500, 600, 7500], [1000, 0, 4800]); window.__advance(1, 2); }); await shot('11_world_coast');
  await ev(() => { window.__setOrbit([-3000, 900, -5000], [-1500, 600, -9500]); window.__advance(1, 2); }); await shot('12_world_mountains');
  await ev(() => { window.__setOrbit([-4800, 300, -5350], [-5200, 60, -5600]); window.__advance(1, 2); }); await shot('13_grass_strip');
  await ev(() => { document.getElementById('b-practice').click(); window.__advance(2, 4); }); await shot('14_practice_approach');
  await ev(() => { window.__test.manualLanding('swift'); window.__api.setCamMode('chase'); window.__advance(0.6, 2); }); await shot('15_landing_card');
  await ev(() => { window.__guide.openHelp('landing'); }); await page.waitForTimeout(600); await shot('16_help_landing'); await ev(() => window.__guide.closeHelp());
  await ev(() => { document.getElementById('c-rings').click(); for (let i = 0; i < 8; i++) window.__advance(1.5, 2); }); await shot('17_rings_minimap');
  await ev(() => { document.getElementById('c-stop').click(); document.querySelector('#weather [data-w=rain]').click(); window.__api.resetPlaneToThreshold(); window.__api.setCamMode('chase'); window.__advance(2, 6); }); await shot('18_rain');
  await ev(() => { document.querySelector('#weather [data-w=clear]').click(); document.getElementById('b-photo').click(); window.__advance(1.2, 3); }); await shot('19_photo_mode');
}
console.log(errors.length ? 'console errors:\n  ' + errors.join('\n  ') : 'no console errors');
await close();
