# Skyport

An interactive 3D airport with four flyable, customizable aircraft, set in an open world you can fly ~30 km in
every direction. It is one self-contained
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
flight manual (controls, how to fly, maneuvers, landing). See `CHANGELOG.md` for what changed in v2 and v3.

## The world (v3)

- **Terrain:** seamless terrain with GPU level-of-detail rings, so there is no edge to fall off. You can fly
  20–30 km in any direction. Past ~30 km a hint asks you to turn back, and further out the world wraps around softly.
- **North:** fields, forests and hills rising to snowy mountains (peaks ~2.2 km).
- **South:** beaches, then ocean with waves, sun glint, shore foam and islands.
- **Also on the map:**
  - a river and a lake;
  - villages linked by country roads;
  - a second airfield, a grass strip about 7.6 km north-west of the main field;
  - cloud layers at several heights that you can fly through.

## Landing (v3)

- **Practice landing** (ASSIST panel) puts you on a 5 km final for runway 09.
- **Help → Landing** walks through the approach in 7 steps. While you fly, the hint bar coaches you: "Gear is up!",
  "Too fast", "Too high — reduce power".
- **Approach aids:** PAPI lights, approach lights, and an optional glide-slope indicator on the HUD.
- **Result card:** after every touchdown it shows vertical speed, distance from the touchdown zone, centreline
  offset and rollout, plus a rating: Butter / Good / Firm / Hard. Best scores are kept per plane.
- **Crashes:** a hard landing, a gear-up landing or touching down on water is a crash, with a one-click reset.

## Extras (v3)

- **Weather** (World panel): clear, crosswind (9 m/s, gusting), rain, or fog. Wind acts on the flight physics, and
  Auto-land crabs into it.
- **Minimap:** toggle with `M`.
- **Photo mode:** `P` hides the UI and freezes the sim so you can orbit the camera and save a PNG. `Esc` exits.
- **Challenges** (World panel):
  - a timed 9-ring course;
  - "Fly to the grass strip" (land on the second airfield).

  Best times and scores are kept in localStorage.

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
`landing(model)`, `aiRunway(seconds)`, `drawCalls()`, the v3 checks `manualLanding(model)` (a hand-flown approach
scored on the card), `landingCrashes()` (gear-up and hard touchdowns crash) and `world()` (terrain, sea, strip, wrap,
streaming), and the v2 checks `hintFlow(model)` (a full flight, logging the
hint at every phase), `tourRuns()` and `perf()` (draw calls in orbit / chase / night views, must stay < 200).

Headless runner, which also saves Inspect screenshots of every aircraft:

```bash
npm i                                  # playwright + a local three.js (used when the CDN is unreachable)
node tests/run-tests.mjs --shots
node tests/shots.mjs docs/screenshots/after --extra   # before/after comparison set
node tests/shots.mjs docs/screenshots/v3 --world      # open world, landing, extras
```
