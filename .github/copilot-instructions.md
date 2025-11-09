# GitHub Copilot instructions — NanoDrones

Purpose: concise guidance for AI coding agents working on this repository — highlight architecture, conventions, and developer workflows that matter when editing code.

Big picture
- Tech stack: React + TypeScript + Vite, PlayCanvas for 3D rendering, Zustand for app state, Vitest for unit tests.
- Two main runtime halves:
  - Simulation core (pure, deterministic logic) in `src/ecs/*` which takes a `SimState` + `SimContext` and returns a new state (see `runSimTick` in `src/ecs/engine.ts`).
  - Presentation & integration in `src/pc/*` and `src/ui/*` where PlayCanvas entities are created and updated from the store.

Key files & directories (start here)
- `src/ecs/engine.ts`: deterministic sim tick; keep changes pure and seed-deterministic.
- `src/state/simStore.ts`: Zustand store that bridges UI <-> sim core. `advance(dt)` implements fixed-timestep loop and persistence triggers.
- `src/pc/PlayCanvasShell.tsx`: PlayCanvas setup, RAF loop, and the place that calls `advance(dt)` and maps sim state to PlayCanvas entities.
- `src/state/persistence.ts`: localStorage save/load + migration strategy (bump `CURRENT_VERSION` and add migrations when shape changes).
- `tests/` + `src/**/*.{test,spec}.{ts,tsx}`: unit tests; use these as examples (see `tests/simEngine.test.ts`).
- `memory/`: project brief, active context, designs and tasks — update here when making design decisions per the spec-driven workflow.
 - `docs/context/`: curated context docs about libraries and frameworks used in the project. Consult files such as `docs/context/context-playcanvas-engine.md`, `docs/context/zustand-beginner-typescript.md`, `docs/context/context-react-19.2.0.md`, or list the folder contents and open relevant files when unsure.

Patterns and conventions
- Keep simulation logic pure: `runSimTick(state, ctx) => newState`. Avoid Date.now()/Math.random in sim core — use the repo RNG seeded from `state.rngSeed`.
- Fixed timestep: store uses an accumulator and `FIXED_DT = 1/60`. UI calls `advance(dt)` from RAF; do not run variable-step simulation inside engine functions.
- Separation of concerns: the engine mutates/returns simulation data; rendering code constructs PlayCanvas entities from that state each frame. When changing entity creation, mirror the cleanup patterns in `PlayCanvasShell` to prevent leaks.
- Persistence: use `saveSim`/`loadSim` in `src/state/persistence.ts`. Persisted payload has a `version`; add migration logic there when evolving the persisted schema.
- Tests inline dependencies: Vitest config inlines `@playcanvas/react` and `playcanvas` (`vitest.config.ts`) — when adding problematic ESM/CJS deps, update `deps.inline`.

Build / test / run (developer workflows)
- Dev server: `npm run dev` (starts Vite).
- Typecheck: `npm run typecheck` (tsc --noEmit).
- Lint: `npm run lint`.
- Full check: `npm run check` (lint + typecheck + tests).
- Tests: `npm run test` (Vitest); interactive: `npm run test:watch`; coverage: `npm run test:coverage`.
- Build: `npm run build` (runs `tsc -b` then `vite build`).
- e2e: `npm run e2e` (Playwright tests) — run in CI or locally with Playwright installed.

Testing notes
- Vitest environment: `jsdom`; setup file is `src/setupTests.ts` (registers jest-dom matchers etc.).
- Include patterns: tests live under `src` and `tests`. Keep unit tests small and deterministic (see `tests/simEngine.test.ts`).
- Coverage excludes `src/main.tsx` and assets; vitest config controls this.

PlayCanvas-specific guidance
- `PlayCanvasShell.tsx` uses `requestAnimationFrame` to render and to call `advance(dt)` once per RAF. Any changes to the render loop should preserve the fixed-timestep behavior of the sim (do not call `runSimTick` directly with variable dt).
- Mesh building: `voxel/mesher.ts` + `buildChunkMesh(...)` produce mesh buffers consumed in `PlayCanvasShell` (positions, normals, uvs, indices). When altering mesh layout, update PlayCanvas mesh construction accordingly.
- Entity lifecycle: entities are created on demand and destroyed when no longer active. Follow the cleanup in the component's `useEffect` teardown to avoid leaks.

Persistence & migration
- `saveSim` produces a versioned payload. When changing persisted state shape:
  1. Add a migration function in `src/state/persistence.ts`.
  2. Increment `CURRENT_VERSION`.
  3. Add tests that exercise `loadSim` with older payloads.

When adding dependencies or tests
- If new packages are ESM-only or mix CJS, add them to `test.deps.inline` in `vitest.config.ts` to avoid pre-bundling issues in the test environment.

Repo process & Memory Bank
- Follow the Spec-Driven Workflow in `.github/instructions/spec-driven-workflow-v1.instructions.md` and update `memory/` files for requirements, designs, and task tracking.
- Create `memory/designs/DESNNN-*.md` for new designs and update `memory/designs/_index.md`.
- Create `memory/tasks/TASKNNN-*.md` for new tasks and update `memory/tasks/_index.md`.

Quick examples
- Engine call signature: `runSimTick(state: SimState, ctx: SimContext): SimState` — see `src/ecs/engine.ts`.
- RAF loop (render + sim step): see `src/pc/PlayCanvasShell.tsx` where `advance(dt)` is invoked and later the component reads `useSimStore.getState()` to sync entities.


