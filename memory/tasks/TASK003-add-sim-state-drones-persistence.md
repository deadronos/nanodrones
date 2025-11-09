# TASK003 - Add sim state, drones, and persistence

**Status:** Pending  
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
   - Add basic migration framework: `migrate(oldSnapshot) -> v1Snapshot`.

5. Add tests in `tests/`:
   - Unit tests for RNG deterministic behavior and `processDroneTick` logic.
   - Integration test: run sequence A (create -> apply commands -> tick -> snapshot) and sequence B (create -> apply commands -> save -> load -> continue) — assert snapshots match at the same logical time.

6. Add small demo wiring (dev-only) to `App.tsx` for manual verification (seed input, save, load, step tick).

7. Document the persistence format and add a migration note to `memory/` if needed.

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID  | Description                                      | Status       | Updated     | Notes |
| --- | ----------------------------------------------- | ------------ | ----------- | ----- |
| 3.1 | Define sim types in `src/state/simTypes.ts`      | Not Started  | -           | Reconcile with existing `simTypes.ts` if present |
| 3.2 | Implement/extend `src/state/simStore.ts`         | Not Started  | -           | Keep API small and testable |
| 3.3 | Implement drone behaviors                        | Not Started  | -           | Pure functions where possible |
| 3.4 | Implement `persistence.ts`                       | Not Started  | -           | Versioning + export/import |
| 3.5 | Add tests (unit + integration)                    | Not Started  | -           | Use Vitest |
| 3.6 | Add demo UI for save/load/seed                    | Not Started  | -           | Dev-only controls in `App.tsx` |

## Progress Log

### 2025-11-09

- Created design `DES003` and this task file. Task status is Pending and ready to start.
