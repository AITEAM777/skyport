# Changelog

## v3: open world + landing

Screenshots: `docs/screenshots/v3/`. The test log is saved next to them as `tests.txt`.

### Open world
- **The diorama block is gone.** Terrain is now a GPU clipmap: 7 nested level-of-detail rings that follow the camera.
  - Height, normals and biome masks come from one noise function, written twice: in JS and as an exact GLSL copy.
    Physics and the picture therefore always agree.
  - Flying range is about 30 km in every direction.
- **Biomes:**
  - mown fields and farmland around the airport;
  - forests and hills, rising to rock and snow-capped mountains in the north (peaks ~2.2 km);
  - beaches and the ocean in the south;
  - a river, a lake, and three villages linked by country roads.
- **Ocean:** a water shader with layered waves, sun glint, depth tint and shore foam. There are islands offshore.
- **Trees and rocks** stream in per 300 m cell as instanced meshes, and are cached as you fly.
- **Sky and clouds:** the horizon blends into the fog colour, and endless cloud layers at several heights can be
  flown through.
- **World edge:** past ~30 km the hint bar says to turn back. Further out the world wraps around behind a fade.

### Landing
- **Hand-flown landings work end to end:** touchdown detection, gear, descent and braking, plus ground spoilers on
  touchdown.
- **Result card:**
  - shows touchdown vertical speed, distance past the touchdown zone, centreline offset and rollout distance;
  - gives a score out of 100 and a rating: Butter / Good / Firm / Hard;
  - keeps a best score per plane.
- **Crashes:** a hard touchdown (≥ 3 m/s), a gear-up landing or a splashdown is a crash, with a reset card.
- **Approach aids:** PAPI and approach lights at both runway ends, plus a HUD glide-slope indicator that you can
  switch off.
- **Practice landing** (ASSIST panel): a 5 km final for runway 09.
- **Guide:**
  - a new Help → Landing tab (7 illustrated steps, PAPI diagram, practice button);
  - a "Learn to land" tour step;
  - context hints on approach: "Gear is up!", "Too fast", "Too high — reduce power", flap steps and the flare call.

### Extras
- **Second airfield:** a grass strip about 7.6 km north-west of the main field, with its own landing card.
- **Weather** (World panel): clear, crosswind (9 m/s with gusts), rain (streaks, low cloud, dim sun) and fog
  (~2 km visibility).
  - Wind is real in the physics: aerodynamics use the airspeed relative to the air mass.
  - Auto-land now tracks the ground track, so it crabs and stays on the centreline in a crosswind.
- **Minimap** (`M`): it draws itself progressively and shows the planes, the airfields and the rings.
- **Challenges:**
  - a timed 9-ring course;
  - "Fly to the grass strip".

  Best times and scores are kept in localStorage.
- **Photo mode** (`P`): hides the UI, freezes the sim, free orbit camera, save a PNG.
- **Not done:** seaplane water landing. Touching down on water is a crash.

### Verification
- All earlier checks still pass. New checks:
  - `__test.manualLanding()`: a hand-flown approach on the real controls. Result: Butter, 0.6 m/s, 66 m past the
    zone, on the centreline.
  - `__test.landingCrashes()`: gear-up and hard touchdowns crash.
  - `__test.world()`: no holes in the terrain, the sea floor, the strip is level, the wrap works, trees stream in.
- Draw calls stay under 200 in every view (max 183).
- Performance caveat: the headless test browser renders on the CPU (SwiftShader, no GPU). There, a frame takes about
  1.6 s, against about 0.9 s in v2. The added cost is the terrain vertex shader (~66k vertices), which a real GPU
  handles easily. The 60 fps target still needs a check on real hardware.

## v2: polish + guide

Before/after comparisons: `docs/screenshots/compare/`. Full sets: `docs/screenshots/before/` and
`docs/screenshots/after/`. The test logs are saved next to them as `tests.txt`.

### Fixed (from the line-up screenshot)
- **Runway paint is geometry now.** The threshold, piano keys, designators (`09` / `27`, drawn as glyph strokes),
  centreline, TDZ and aiming-point markings are all crisp meshes, so they stay sharp next to the camera. The asphalt
  texture carries only low-frequency wear: rubber in the touchdown zones, wet patches (roughness), crack sealing and
  a darker wheel track. A tiling aggregate detail map with max anisotropy fades out with distance.
- **Taxi lines stop at the runway edge.** The diagonal yellow lead-ins across the runway are gone. Only the two
  runway-end entries keep a short standard lead-on curve.
- **Line-up spot.** The aircraft stops on the centreline past the threshold markings and the numbers, nose on the
  runway heading. Auto line-up follows the painted lead-on curve and tracks the centreline to the stop, so every type
  ends within 0.7° of the runway heading. It used to stop on the numbers.
- **Grass moiré.** Mown stripes are now soft 8 m cosine bands that fade with distance. The grass has a mipmapped
  detail map and darker bands along the runway shoulders.
- **Trees.** Three variants (clustered broadleaf, tiered conifer, columnar poplar) with baked crown shading and
  per-tree tint. They are placed in natural groups; the landside trees are loose groves instead of ruled rows.
- **Flat image.** Stronger sun with less fill, a warm rim light at golden hour, contact shadows under every aircraft
  and AO strips around building footprints.
- **Hangar roofs.** Fixed a pre-existing bug: the vaulted roofs were built upside-down below the walls, so you could
  see straight through them.
- **Night view.** Fixed a pre-existing bug: the landing light (intensity 9e5) blew the whole frame out. It now uses
  physical, inverse-square units.
- **UI over the scene.** With a plane out, or in any non-orbit camera, the title folds into a compact glass card.
  The key list is a collapsible "Keys" chip, collapsed by default, and remembers its state.

### Aircraft
- Airfoils: NACA 230xx camber on the jets, NACA 2412 on the Kestrel. Quarter-chord sweep is 25° on the Meridian
  and 30° on the Swift. Dihedral is 5° on the Kestrel and 5.5–6° on the jets.
- Rounded tips on the wings without winglets, the tailplanes and the fins. The winglets also get rounded caps.
- Root fillets blend the wing and tailplane roots into the fuselage.
- The fuselage has a normal + roughness map: frames, seams, rivet rows, door outlines, window rings and belly hatches.
- Wing skin atlas with spar and rib seams, rivets and hatches, a root walkway and NO STEP markings. The text reads
  correctly on both wings.
- Clear-coat paint (clearcoat 0.8, roughness 0.15) with subtle tone variation, polished-metal leading edges, and
  soot on the tail cone and behind the rear-mounted engines.
- Cockpit glazing has frame bars and a sky glint.
- Engines: a spinner with the classic spiral marking. The prop blades have rounded tips, and above ~60 % rpm the
  prop shows a translucent streaked disc with yellow tip rings.
- Landing gear: torque links, tyre sidewall rings, hubs with caps and bolts.
- Lights: nav, strobe and beacon lenses are one mesh, and every aircraft has bloomed halo points (one draw).
- Liveries: a cheatline through the window row that tapers at the nose and follows the tail sweep; the fin design
  continues the fuselage scheme; a stencil-style registration.
- Five redesigned presets: Classic cheatline, Modern split, Tail swoosh, Retro stripes, Titles + big tail mark.

### Environment & atmosphere
- Grass tufts around the camera focus (one instanced draw). They shrink to nothing with distance and sway.
- Life: a flock of birds, drifting billboard cloud clusters lit by the sun colour, and a horizon haze band.
- Buildings: corrugated cladding and roofs (normal maps) and a reflective control-tower cab.
- Hangar 2 stands open with a parked business jet, work lights, tool carts and crates (one baked draw).
- Night: a sequenced approach "rabbit" at both runway ends and apron floodlight masts that cast warm light pools.
- Heat shimmer behind jet engines at high thrust.

### Feel
- The chase camera is a damped spring in the aircraft frame, so it lags without drifting. FOV goes from 55° to 65°
  with speed.
- Camera shake: a speed-proportional rumble on the runway, a bump on touchdown and G-shake in maneuvers (smooth
  noise, no jitter).
- Procedural WebAudio, off by default; the toggle is remembered.
  - Engine: prop buzz or jet whine plus roar, both following N1.
  - Wind noise that rises with airspeed.
  - Tyre chirp on touchdown, gear motor while the gear travels, stall warning horn.
- Particles: tyre smoke on touchdown and prop-wash dust over grass. Wingtip vortices and the vapour cone are kept.
- Toasts:
  - Touchdown rating: `Butter! 0.8 m/s` / `Firm landing` / `Hard landing`.
  - Maneuver stats, for example `Loop complete · 4.3 G · 230 m tall`.
- HUD, toasts and the inspect bar ease in and out instead of popping.

### In-game guide (new)
- **Hint bar** (bottom centre, above the HUD). It always shows the single next action for the current phase, with
  key caps and a 250 ms fade + slide between hints.
  - It covers every phase: pick, roll-out, engine, spool, ready, pushback, taxi, hold short (clear or traffic),
    line-up, takeoff roll, rotate, positive climb, climb to 300 m, cruise, heading back, approach, flare, rollout,
    taxi to stand, plus stall/low-speed warnings in red.
  - Live progress bars: speed toward Vr, climb to 300 m, engine spool, maneuver progress. Completed line-up and
    approach items are struck through.
  - `?` opens help. `×` hides the bar and leaves a "Hints off" chip to bring it back. The choice is stored in
    localStorage (wrapped in try/catch).
- **Onboarding tour.** Five spotlight steps (airport, Hangar, Performance, hint bar, cameras) with Next / Skip,
  shown once. "Replay tour" is in the World panel.
- **Help overlay** (`H` or `?`). Three tabs:
  - Controls: a keyboard diagram plus mouse and touch notes.
  - How to fly: six illustrated steps.
  - Maneuvers: path diagrams, requirements and speeds for your plane.

  It closes with Esc, a click outside, or "Got it". On phones it is a scrollable bottom sheet.
- **UX:**
  - Disabled maneuver buttons explain why on hover and flash when they unlock.
  - The HUD speed readout shows a Vr marker on the takeoff roll and a Vref marker on approach.
  - "What changed?" under the Performance sliders, e.g. `Takeoff run 1 267 m → 1 912 m`.
  - Hold `E` (parked, engine off) to start the engine.

### Verification
- All existing `__test` checks pass with the original tolerances: takeoff, max speed, ceiling, paramEffect,
  14 maneuvers, loopScaling, 4 landings and aiRunway.
- New `__test.hintFlow()` drives a full Kestrel flight through the real controls: roll-out, hold-E engine start,
  auto-taxi, takeoff, climb, loop, auto-land, taxi to stand. It checks that every phase shows an allowed,
  non-empty, non-stale hint (19 hint changes, 0 violations).
- New `__test.tourRuns()` checks that the tour opens on clean storage, advances, skips and does not reopen.
  The runner also does a real first launch → Skip → reload check.
- New `__test.perf()` measures draw calls in orbit, chase, night chase and night orbit. All are under 200 (max 170).
- Performance: at the same resolution in the headless CPU rasteriser (SwiftShader, no GPU), orbit renders at
  1.25 fps vs 1.35 fps for v1. That is the same order of cost; absolute fps cannot be measured without a GPU.
- The test runner serves three.js from `node_modules` when the CDN is unreachable and fails fast on boot errors.
  `node tests/shots.mjs <dir> [--extra]` takes the comparison screenshot set.
