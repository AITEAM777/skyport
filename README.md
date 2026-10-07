# Skyport

An interactive 3D airport diorama with four flyable, customizable aircraft. It is one self-contained
`index.html`: three.js r165 loaded via an importmap from jsDelivr, with no build step and no external models or
textures. Everything is procedural: lathe and NACA-lofted geometry plus canvas textures.

Run it from any static server (or deploy the repo as-is to Vercel / GitHub Pages):

```bash
npx http-server .   # then open http://localhost:8080/
```

The flow: pick a plane in **Hangar**, then **Roll out**. The plane is towed onto the selected stand.
Then: **Engine start** (or hold `E`) → **Taxi to runway** (pushback, taxi, hold short, line up) → full throttle (`W`) →
rotate with `↓` at Vr → fly and run maneuvers `1`–`7` → **Auto-land** → **Taxi to stand**.

You don't need to remember any of that: the **hint bar** at the bottom always shows the next step for the current
flight phase. A short onboarding tour runs on first launch (replay it from the World panel), and `H` opens the
flight manual (controls, how to fly, maneuvers). See `CHANGELOG.md` for what changed in v2.

## Aircraft (fictional)

| Name | Type | Shape reference |
|---|---|---|
| Meridian 220 | narrowbody twinjet | 737-style photos: low wing with inboard trailing-edge kink, forward-slung round nacelles, split winglets, dorsal fin fillet |
| Atlas F4 | freighter | high wing with anhedral, 4 fans, T-tail, upswept rear fuselage, sponson main gear, nose visor seam |
| Swift 7 | business jet | rear-mounted engines, T-tail with bullet fairing, blended winglets, oval windows |
| Kestrel S | aerobatic prop | bubble canopy, 3-blade prop that blurs to a disc, low tapered wing |

## Verification

Open the browser console and run `__test.all()`. Each check can also run on its own:
`takeoff(model)`, `maxSpeed(model)`, `ceiling(model)`, `paramEffect()`, `maneuver(model, n)`, `loopScaling()`,
`landing(model)`, `aiRunway(seconds)`, `drawCalls()`, and the v2 checks `hintFlow(model)` (a full flight, logging the
hint at every phase), `tourRuns()` and `perf()` (draw calls in orbit / chase / night views, must stay < 200).

Headless runner, which also saves Inspect screenshots of every aircraft:

```bash
npm i                                  # playwright + a local three.js (used when the CDN is unreachable)
node tests/run-tests.mjs --shots
node tests/shots.mjs docs/screenshots/after --extra   # before/after comparison set
```
