[![SOLMAR BAY](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/Iruwae/gta6-01-entry-r22/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/Iruwae/gta6-01-entry-r22/reward.svg)](https://make.fun/bounty/gta6-01)

# SOLMAR BAY

An original open-world crime game for the [gta6-01 bounty on make.fun](https://make.fun/bounty/gta6-01). A seeded coastal city at dusk — drive, steal, outrun the SBPD, run jobs for Lena Cruz, and take the bay.

## Play

Serve it locally with `node serve.ts`, then open http://localhost:8080. No build step, no network — Three.js is vendored under `game/vendor/`.

## The game

- **Seeded coastal city** — 8×7 blocks, 5 districts (Harbor, Coral Keys, Vane Heights, Marina, Old Town), Solmar Bridge, pier, beach, hills, night market, shop signs, traffic and pedestrians.
- **Jobs** — 4 story missions from Lena Cruz, Vic Torres and Pilar: deliveries, a gold-car heist, a market sweep, and a sunset bridge race. Stages, timers, and a NEXT line in the HUD.
- **Police** — 5 wanted stars, named SBPD units with live distances and tactics (RAMMING / FLANKING / FIRING / PURSUIT / CLOSING IN), roadblocks at 3 stars, the Air One helicopter at 4.
- **Crew** — Z Pilar Getaway (drop a star), X Vic Quick Fix (repair the car), C Juno Eyes Out (mark police).
- **Respect** — NOBODY → DOCK HAND → HARBOR FIXER → FIXER → SHOT CALLER → KINGPIN, with district standing bars.
- **Side work** — taxi fares, street races, 20 Sol Coins, a shooting range in Coral Keys.
- **Garage shop** — 6 weapon slots (Fists, Pistol, SMG, Shotgun, Rifle, Gator) and 5 cars to buy.
- **Radio** — SUNSET 88.5, WAVE 101.2, NEON 104.7 (keys 1–3).
- **Save slots** — 3 localStorage slots, title screen over the live skyline, pause screen with career stats and the full map.

## Controls

WASD drive / walk · mouse look · E enter or exit car · click shoot (on foot) · Q cycle weapon · Z / X / C crew abilities · 1–3 radio · G garage shop (at Lena's Garage) · T taxi fare · R street race · M next job · P / Esc pause · wheel zoom.

## Screenshots

Deterministic staged scenes, captured headlessly with `node tools/shots.mjs` (see `shots.json`): dusk boulevard chase, on-foot shootout, stats/map pause screen, title screen over the skyline.

## Entry

Built for make.fun's gta6-01 competition. `main.ts` copies `game/` and `screenshots/` to the output dir and writes `dossier.json` via the vendored make.fun library.
