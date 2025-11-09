## Plan: Sim State & Persistence

TL;DR: Add a versioned, JSON-serializable snapshot format (v1), centralize save/load/migrate logic, expose deterministic sim APIs (getSnapshot/loadSnapshot/stepOnce), extract pure drone-tick logic for unit testing, and add a dev-only topbar toggle (wrench icon) for seed/save/load/step controls. Persist only minimal world data (seed + regeneratable parameters) and provide localStorage + export/import UX with a size warning for large exports.

**Phases 5**

1. **Phase 1: Types & Snapshot**
   - **Objective:** Define canonical TS interfaces and a minimal runtime validator for the v1 snapshot shape so persistence is explicit and testable.
   - **Files/Functions to Modify/Create:**
     - `src/state/simTypes.ts` — extend/add `SimState`, `DroneState`, `Order`, and `Snapshot` interfaces. Add a lightweight `validateSnapshotShape(snapshot: unknown): boolean` helper for tests.
   - **Tests to Write:**
     - `tests/simTypes.test.ts` — "snapshot_shape_has_required_keys": ensure `getSnapshot()` output contains required top-level keys (version, state.seed, state.rngState, state.tick, state.drones, state.orders).
   - **Steps:**
     1. Write the failing test asserting required keys and types.
     2. Add/extend interfaces and runtime validator.
     3. Run tests until green.

2. **Phase 2: Persistence Module & Migrations**
   - **Objective:** Centralize serialization, deserialization, and migrations. Provide robust save/load and export/import utilities.
   - **Files/Functions to Modify/Create:**
     - `src/state/persistence.ts` — export the core persistence API:
       - `export const CURRENT_VERSION = 1` (per decision)
       - `saveSnapshot(snapshot: Snapshot, key?: string): void`
       - `loadSnapshot(key?: string): Snapshot | null`
       - `migrateSnapshot(raw: any): Snapshot | null`
       - `exportSnapshotFile(snapshot: Snapshot, filename?: string): void` (download JSON)
       - `importSnapshotFile(file: File): Promise<Snapshot>` (file input handler)
     - `src/state/migrations.ts` (new) — exports `MIGRATIONS: Record<number, (raw:any)=>any>` and `applyMigrations(raw, from, to)`.
   - **Tests to Write:**
     - `tests/persistence.test.ts`:
       - save_and_load_roundtrip
       - migrate_legacy_payload_to_v1
       - export_import_roundtrip (mock file APIs)
       - guard_when_localStorage_missing
   - **Steps:**
     1. Write tests mocking `localStorage` and file I/O.
     2. Implement `saveSnapshot` and `loadSnapshot` with a JSON-only payload and guarded access to `window.localStorage`.
     3. Implement `migrateSnapshot` using the `MIGRATIONS` map and unit-test a simple legacy→v1 migration.
   - **Notes:** Persist the RNG numeric state (e.g., `rngState: number`) and `seed` so a regenerated world is deterministic.

3. **Phase 3: Sim Store API & Tick Helpers**
   - **Objective:** Add small, testable store APIs for snapshotting and stepping to support manual stepping and deterministic restore.
   - **Files/Functions to Modify/Create:**
     - `src/state/simStore.ts` — add/ensure these exports:
       - `getSnapshot(): Snapshot`
       - `loadSnapshot(snapshot: Snapshot): void`
       - `stepOnce(): void` (runs a single fixed tick)
       - `applyCommand(simState: SimState, cmd: Order | Command): SimState` (pure helper)
       - `createSim(seed?: number, options?: {}): { state: SimState; rngState: number }` (factory for tests)
   - **Tests to Write:**
     - `tests/simStorePersistence.test.ts`:
       - store_save_load_restores_state
       - step_once_runs_single_tick
       - applyCommand_enqueues_order
   - **Steps:**
     1. Write failing tests for snapshot roundtrip and stepOnce.
     2. Implement `getSnapshot` and `loadSnapshot` to serialize-only stable fields.
     3. Wire `stepOnce` to the existing tick path (ensuring it advances the stored `rngState`).

4. **Phase 4: Drone Behavior & Unit Tests**
   - **Objective:** Extract or implement pure, deterministic drone-tick logic so behaviors are fully unit-testable and rely only on passed `rngState`.
   - **Files/Functions to Modify/Create:**
     - `src/sim/drones.ts` (new) or `src/ecs/drones.ts` — `processDroneTick(drone: DroneState, world: WorldState, rngState: number, dt: number): { drone: DroneState; rngState: number }`
     - Wire the pure function into `src/ecs/engine.ts` so the engine passes/returns numeric RNG state.
   - **Tests to Write:**
     - `tests/drone.test.ts`:
       - drone_moves_toward_target_deterministically
       - drone_progresses_mine_task_deterministically
   - **Steps:**
     1. Write unit tests for `processDroneTick` with fixed RNG inputs (fail).
     2. Implement minimal movement/progress rules and return updated `rngState`.
     3. Run tests and adjust engine integration.

5. **Phase 5: Integration Tests & Dev UI**
   - **Objective:** Validate deterministic save/load across ticks, and add a dev-only topbar toggle (wrench icon) exposing the dev panel with seed/save/load/step controls and export/import UX.
   - **Files/Functions to Modify/Create:**
     - `tests/integration/sim-persistence.integration.test.ts` — full workflow test: create -> apply commands -> tick -> save -> load -> continue -> assert state parity.
     - `src/App.tsx` — add topbar toggle (wrench icon) to show/hide `DevToolsPanel`.
     - `src/ui/DevToolsPanel.tsx` (new) — contains:
       - seed input + "New Seed" button (calls `createSim`/store reset)
       - "Save Snapshot" (calls `getSnapshot` + `saveSnapshot` + optional download)
       - "Load Snapshot" (file input -> `importSnapshotFile` -> `loadSnapshot`)
       - "Step Tick" (calls `stepOnce`)
     - Keep DevTools gated behind `NODE_ENV !== 'production'`.
   - **Tests to Write:**
     - `tests/integration/dev-ui.test.ts` (UI smoke): clicking save triggers `saveSnapshot`, importing a JSON file loads it into store.
   - **Steps:**
     1. Write integration test asserting save/load parity.
     2. Implement DevToolsPanel and topbar toggle, wire to store/persistence.
     3. Test manually and via UI tests.
   - **UX Notes:**
     - Persist key: `nano-drones-save-v1` (or configurable via DevTools).
     - Export: trigger browser download with `application/json` MIME type.
     - If exported JSON size > 1 MB, call `console.warn('Snapshot export size > 1MB')` before download (per decision).

**Open Questions Resolved (your choices applied)**
1. World persistence strategy: Option B — persist `seed` + regeneratable parameters; on load, regenerate world from `seed` rather than persisting full arrays. This keeps snapshots small and leverages deterministic world generator.
2. `CURRENT_VERSION`: set to `1` for this initial v1 snapshot schema.
3. Dev UI placement: add a topbar toggle with a wrench icon to show/hide the dev panel.
4. Persistence UX: use `localStorage` for auto-save plus an explicit export/import file UX for sharing/backups.
5. Export size warning: call `console.warn` if the exported snapshot string exceeds 1 MB.

**Acceptance Criteria (high level)**
- Snapshot roundtrip: saveSnapshot -> loadSnapshot -> load into store results in a reproducing continuation (deterministic RNG and identical subsequent state when replayed).
- Unit tests for `processDroneTick` deterministic under fixed RNG seed.
- `getSnapshot` returns only JSON-serializable fields; no functions or PlayCanvas entities.
- Dev panel accessible via the topbar wrench icon and provides seed/save/load/step controls (dev-only).
- Export emits `console.warn` when >1MB and produces a downloadable JSON file.

**Next steps**
- Please approve this plan so I can write `plans/task003-phase-1-complete.md` and start Phase 1 (Types & Snapshot). This is a mandatory pause before implementation.

Status:
- Current Phase: Planning
- Plan Phases: 1 of 5
- Last Action: Plan written (awaiting approval)
- Next Action: Await your approval to begin Phase 1

Please reply with "approve" to proceed, or request edits to the plan.
