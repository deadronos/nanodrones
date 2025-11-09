# Nano Drones Commander

Nano Drones Commander is a small prototype game built with React + TypeScript + Vite that embeds a PlayCanvas 3D scene. The player commands a team of tiny autonomous "nano drones" in a seeded, voxel-based chunk world. The simulation is authoritative, deterministic, and designed to be testable and replayable.

## Key ideas

- Third-person player + orbit camera
- Voxel chunk generator with a simple greedy mesher for terrain
- Deterministic simulation tick (fixed timestep) with a seeded RNG for reproducible runs
- Small fleet of drones that can accept orders (mine, return) and run deterministic behaviors
- Versioned local persistence (save/load) with migration support

## Project status (what's implemented)

- Simulation core: `src/ecs/engine.ts` — fixed-step tick, player movement, drone stepping, order assignment
- Deterministic RNG: `src/state/rng.ts` (LCG) and seeded initial state in `src/state/initialState.ts`
- Sim store: `src/state/simStore.ts` — Zustand store, fixed timestep accumulator, `advance(dt)` loop, camera + input bridges, and `issueMineOrder()` helper
- Persistence: `src/state/persistence.ts` — `loadSim` / `saveSim` with versioned payloads and migration from v1 → v2
- PlayCanvas integration: `src/pc/PlayCanvasShell.tsx` — mounts a PlayCanvas `pc.Application`, creates a simple scene (camera, light, ground, player), renders terrain via `src/voxel/mesher.ts`, and maps sim entities (player + drones) into the scene
- Voxel world: `src/voxel/generator.ts` (chunk generator, resource placement) and `src/voxel/mesher.ts` (mesh builder for PlayCanvas)
- UI / control scaffolding: `src/ui/DebugPanel.tsx`, `src/ui/DroneList.tsx`, and `src/ui/OrderRadial.tsx` for basic interactions (pause/reset, issue mine orders, see drone state)

## Files of interest

- `src/ecs/engine.ts` — deterministic rules for player and drone updates (movement, mining, order completion)
- `src/state/*` — sim types, RNG, initial state, persistence, and the `useSimStore` bridge
- `src/pc/PlayCanvasShell.tsx` — embed + render loop; it calls `advance(dt)` and projects sim positions to PlayCanvas entities
- `src/voxel/*` — generator + mesher for the small chunk-based world
- `src/ui/*` — minimal control/debug UI to exercise the sim

## Planned / scaffolded work (per `memory/designs/DES001-003`)

- DES001 — Initial architecture: React shell + PlayCanvas, deterministic sim core, voxel module, and AI subsystem (planned)
- DES002 — Basic 3D scene & controller: `PlayCanvasShell` + `ThirdPersonController` interface and test hooks (implemented in a minimal form; controller uses `useKeyboard` + sim input)
- DES003 — Sim state, drones, and persistence: canonical types, `simStore` API, persistence format, seeded RNG, and deterministic drone behaviors (core pieces are implemented; more behaviors, tests, and migrations can be added)

## Acceptance & current behaviour

- Run the app and you should see a simple PlayCanvas scene with a ground plane, a player box, and 1–3 drone boxes spawned from the seeded chunk
- WASD (or arrow keys) move the player; click-drag or pointer-lock to orbit the camera
- Use the Orders panel to issue a contextual Mine order: `issueMineOrder()` will pick the nearest resource and create a mine order that drones will accept and execute
- The sim is advanced via `useSimStore().advance(dt)` inside the PlayCanvas RAF loop; sim logic runs on a fixed dt (1/60) for determinism

## How to run locally

1. Install dependencies

```bash
npm install
```

1. Start dev server

```bash
npm run dev
```

1. Useful scripts

```bash
npm run test         # run unit tests (vitest)
npm run typecheck    # run TypeScript typecheck
npm run lint         # run eslint
npm run build        # build (tsc && vite build)
```

## Where to look next (for contributors)

- `memory/designs/DES001-initial-architecture.md` — overall architecture and goals
- `memory/designs/DES002-implement-basic-3d-scene-controller.md` — scene + controller acceptance tests and hooks
- `memory/designs/DES003-add-sim-state-drones-persistence.md` — sim types, persistence, and determinism tests
- `src/ecs/engine.ts` and `src/state/simStore.ts` — core deterministic logic to extend

## Contributing ideas & next steps

- Add more drone behaviors (carry, build, recharge) under `src/ai` or `src/sim` and add deterministic tests
- Expand `simTypes` and write save/load migration tests in `tests/` to preserve reproducibility across changes
- Improve visuals: replace primitive shapes with assets, add a minimap, or add day/night cycle

## License

This repository is a work-in-progress prototype; add a license file if you intend to publish.

---

**Project Codename:** _Nano Drones Commander_

**Keywords:** voxel, deterministic, ECS, drone AI, PlayCanvas, React 19.2, TypeScript, Vite
