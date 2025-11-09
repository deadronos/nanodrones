# TASK003 - Add sim state, drones, and persistence

**Status:** In Progress - 95%

**Added:** 2025-11-09

**Updated:** 2025-11-09

## Original Request

Add authoritative sim state, drone entities with basic behaviors, and a versioned persistence layer so runs are reproducible and save/restore works. This maps to requirements #1, #3 and #5.

## Thought Process

The sim core is the project's heart: its state must be serialisable and deterministic. Persistence should be simple (localStorage) initially but versioned to allow later migrations. Drone behavior should be minimal at first (move/mine/idle) and exercised by deterministic unit tests.

## Implementation Plan

1. Define sim domain types in `src/state/simTypes.ts`:
   - `SimState` (seed, tick, world, drones, commandQueue, metadata)
   - `Drone` (id, position, inventory, state, queuedOrders)
   - `Order` (id, type, params, issuedAt)

2. Implement `src/state/simStore.ts` (or extend existing file):
   - `createSim(seed, options?)` — returns initial `SimState` and seeded RNG instance.
   - `applyCommand(simState, command)` — enqueue or apply commands deterministically.
   - `tick(simState, dt)` — apply systems (move system, drone AI system, order processing) and advance tick counter.
   - `getSnapshot()` / `loadSnapshot()` — serialisation helpers returning a plain JSON-friendly object.

3. Implement drone behaviors in `src/sim/drones.ts` or `src/ai/drone.ts`:
   - `processDroneTick(drone, world, rng, dt)` — returns updated drone state and actions.
   - Keep behavior pure where possible to ease unit testing.

4. Implement `src/state/persistence.ts`:
   - `save(simSnapshot, key = 'nano-drones-save')` — stores versioned JSON to `localStorage` (or pluggable backend).
   - `load(key)` — returns parsed snapshot or `null` if missing.
   - `exportSave()` / `importSave(json)` — for user-level export/import.
   - Add basic migration framework: `migrateSnapshot(oldSnapshot)`.
     - Migration contract: Each migration function MUST return a snapshot object with the top-level `version` equal to the migration's target version (for example, the migration that upgrades v1 -> v2 must return an object with `version: 2`).

5. Add tests in `tests/`:
   - Unit tests for RNG deterministic behavior and `processDroneTick` logic.
   - Integration test: run sequence A (create -> apply commands -> tick -> snapshot) and sequence B (create -> apply commands -> save -> load -> continue) — assert snapshots match at the same logical time.

6. Add small demo wiring (dev-only) to `App.tsx` for manual verification (seed input, save, load, step tick).

7. Document the persistence format and add a migration note to `memory/` (see `memory/designs/DES003-snapshot-schema-v2.md`). The canonical persisted wrapper is `{ version, createdAt, state }`.

## Progress Tracking

**Overall Status:** In Progress - 95%

**Summary of work completed:**

- Defined canonical sim domain types and added a `Snapshot` interface (`src/state/simTypes.ts`).

- Added a runtime snapshot validator and unit tests (`tests/simTypes.test.ts`).

- Centralized persistence APIs (`src/state/persistence.ts`): `saveSnapshot`, `loadSnapshot`, `migrateSnapshot`, `exportSnapshotFile`, `importSnapshotFile` and preserved existing `saveSim`/`loadSim` behavior.

- Implemented store-level snapshot + control APIs in `src/state/simStore.ts`: `getSnapshot`, `loadSnapshot`, `stepOnce`, `applyCommand`, and exported `createSim` for tests.

- Extracted pure drone tick logic to `src/sim/drones.ts` and wired it into `src/ecs/engine.ts`.

- Added unit tests and integration tests: `tests/persistence.test.ts`, `tests/simTypes.test.ts`, `tests/simStorePersistence.test.ts`, `tests/drone.test.ts`, and `tests/integration/sim-persistence.integration.test.ts`.

- Added a dev-only UI panel with seed/save/load/export/step controls (`src/ui/DevToolsPanel.tsx`) and a wrench toggle in `src/App.tsx`.

### Updated Subtasks

| ID  | Description                                      | Status       | Updated     | Notes |
| --- | ----------------------------------------------- | ------------ | ----------- | ----- |
| 3.1 | Define sim types in `src/state/simTypes.ts`      | Completed    | 2025-11-09  | Added `Snapshot` + validator |
| 3.2 | Implement/extend `src/state/simStore.ts`         | Completed    | 2025-11-09  | `getSnapshot`/`loadSnapshot`/`stepOnce`/`applyCommand` |
| 3.3 | Implement drone behaviors                        | Completed    | 2025-11-09  | `src/sim/drones.ts` (`processDroneTick`) |
| 3.4 | Implement `persistence.ts`                       | Completed    | 2025-11-09  | Snapshot helpers + import/export |
| 3.5 | Add tests (unit + integration)                   | Completed    | 2025-11-09  | Unit + integration tests added and passing |
| 3.6 | Add demo UI for save/load/seed                   | Completed    | 2025-11-09  | `DevToolsPanel` + app toggle (dev-only) |

## Progress Log

### 2025-11-09

- Implemented Phase 1: added `Snapshot` type and runtime validator. Added tests `tests/simTypes.test.ts`.

- Implemented Phase 2: centralized persistence helpers in `src/state/persistence.ts` (`saveSnapshot`, `loadSnapshot`, `migrateSnapshot`, `exportSnapshotFile`, `importSnapshotFile`) and added tests `tests/persistence.test.ts`.

- Implemented Phase 3: extended `src/state/simStore.ts` with `getSnapshot`, `loadSnapshot`, `stepOnce`, `applyCommand`, and `createSim`; added `tests/simStorePersistence.test.ts`.

- Implemented Phase 4: extracted drone logic to `src/sim/drones.ts` and updated `src/ecs/engine.ts`; added `tests/drone.test.ts`.

- Implemented Phase 5: added integration test `tests/integration/sim-persistence.integration.test.ts` and Dev UI `src/ui/DevToolsPanel.tsx` with a topbar wrench toggle in `src/App.tsx`.

- Ran test suite locally: all new and existing tests covering the changes pass.

**Files of interest (high level):**

- `src/state/simTypes.ts` — `Snapshot` + `validateSnapshotShape`

- `src/state/persistence.ts` — snapshot helpers + import/export + migration wrapper

- `src/state/simStore.ts` — store APIs for snapshotting and stepping

- `src/sim/drones.ts` — pure `processDroneTick`

- `src/ecs/engine.ts` — now uses `processDroneTick`

- `src/ui/DevToolsPanel.tsx`, `src/App.tsx`, `src/App.css` — dev UI and styles

- `tests/*` — unit and integration tests added (see test files in repo)

### Notes / Next Steps

- Documentation: added a migration note and snapshot schema document to `memory/designs/DES003-snapshot-schema-v2.md`.

- Consider adding a migration fixture test to validate older snapshots (optional).

- Prepare a PR with an executive summary linking these task files and the plan artifacts.

- Policy note: missing `version` fields should be treated as v1 by loaders; `src/state/persistence.ts` must export a `CURRENT_VERSION` integer and migrations must be added when bumping this value.

## Status: Near complete

Most functionality requested in TASK003 has been implemented and tested. The remaining work is documentation (memory bank update) and optional migration fixture tests.
