# DES003 - Sim State, Drones, and Persistence

## Goal

Provide an authoritative, deterministic simulation state and persistence layer so drone entities, orders, and world seeds can be saved, restored, and replayed reproducibly.

## Scope

- Define and stabilise the sim data model (entities, drones, orders, world seed, tick counter).
- Implement or extend the authoritative sim store API in `src/state` to: create runs, apply commands, advance ticks, and export/import serialised state.
- Implement or harden the persistence module (save/load) under `src/state/persistence.ts` using the `nano-drones-save` key with versioning and migration support.
- Add a minimal drone behavior set (move, mine, idle) together with a deterministic processing system for drone orders.
- Provide tests and verification hooks to prove deterministic replay across save/load and across runs with the same seed.

## Interfaces / Files

- `src/state/simStore.ts` — authoritative sim API: `create(seed)`, `applyCommand(cmd)`, `tick(dt)`, `getStateSnapshot()`, `loadSnapshot(snapshot)`.
- `src/state/simTypes.ts` — canonical types and interfaces for `SimState`, `Drone`, `Order`, `WorldState`, `SaveFormatV1`.
- `src/state/persistence.ts` — `save(state)`, `load()`, `exportSave()`, `importSave(serialised)`, migration helpers.
- `src/state/rng.ts` — seeded RNG; ensure consistent use across sim and drone behaviours.
- `src/sim/drones.ts` or `src/ai/drone.ts` — drone behavior implementations and small AI tick functions.
- `tests/sim/*` — deterministic replay tests, save/load roundtrip tests, and unit tests for drone behavior.

## Data Flow

UI / Commands -> Command Queue -> `simStore.applyCommand()` -> `simStore.tick()` applies systems (movement, drone AI, order execution) -> `simStore` state updated -> `persistence.save()` serialises state to `localStorage` (or chosen backend) -> Renderer subscribes to state snapshots.

## Acceptance Criteria (testable)

- Starting a run with the same seed and applying the same sequence of commands produces identical final snapshots.
- Saving state, reloading it (via `load()` or import), and continuing results in identical outcomes compared to an uninterrupted run.
- Drone entities exist in `SimState` and expose a deterministic sequence of actions for a given seed and input sequence.
- Persistence format is versioned (e.g., `v1`) and loadable with a clear migration path.

## Implementation Notes & Constraints

- Avoid using `Date.now()`, `Math.random()`, or other non-deterministic browser features in simulation logic; centralise randomness through `src/state/rng.ts`.
- Keep sim primitives serialisable (avoid DOM nodes, functions in state snapshots).
- Use stable iteration order for arrays/maps when saving and when running systems (sort or use ordered lists) so serialisation is stable.
- Provide small, focused unit tests for RNG, `tick()` determinism, and `save/load` round-trips.

## Tasks (high level)

1. Design & codify sim types in `src/state/simTypes.ts` (Drone, Order, SimState, Save formats).
2. Implement/extend `simStore` API with create/load/save/tick and command processing.
3. Implement basic drone behaviors and an order-execution system (move, mine, idle).
4. Implement `persistence.ts` with versioned save/load and export/import helpers.
5. Add deterministic tests: RNG repeatability, tick determinism, save/load roundtrip.
6. Document the persistence format and migration strategy in `memory/` if changes are non-trivial.

## Test Strategy

- Unit tests for `rng`, `applyMovement`, and drone behavior functions using Vitest.
- Integration tests that run two simulated runs (continuous vs. save/load resume) and assert equality of snapshots.




# DES003 — Snapshot schema & migration guidance

TL;DR

This document defines the versioned snapshot shape used by TASK003 (Sim state & persistence), provides a canonical persisted shape, migration guidance for evolving the schema, an example snapshot, and a short test plan for migrations. Date: 2025-11-09.

## Snapshot schema (wrapper shape)

Persisted snapshots are stored as a small wrapper object with a top-level `version` and a `state` property containing the simulation state. The top-level wrapper fields are:

- `version` (integer): Top-level schema version. Required. Increment when schema changes.
- `createdAt` (string, ISO-8601): Timestamp when snapshot was created.
- `state` (object): The simulation state object containing `seed`, `tick`, `rngState`, `world`, `drones`, `commandQueue`, and `metadata`.

### State fields (fields inside `state`)

- `seed` (number|string): Deterministic RNG seed used to create the simulation.
- `tick` (integer): Logical tick counter at snapshot time.
- `rngState` (object|string): Optional RNG internal state if the RNG needs exact restoration.
- `world` (object): Minimal world descriptor needed to resume sim (e.g., dimensions, compressed chunk references). Large binary/voxel data should be optional or reference-based.
- `drones` (array of objects): Drone entities with deterministic fields. Each drone includes:
  - `id` (string)
  - `position` ({ x:number, y:number, z:number })
  - `state` (string) — AI state (idle, moving, mining, etc.)
  - `inventory` (object)
  - `queuedOrders` (array)
- `commandQueue` (array): Pending commands to be processed next tick.
- `metadata` (object): Optional free-form metadata (author, description, exporterVersion).
- `checksum` (string, optional): Optional content checksum to detect corruption.

Notes:

- Keep large world data optional or reference-based to avoid very large exports. Prefer chunked or compressed formats when needed.

## Example (wrapper) JSON

```json
{
  "version": 2,
  "createdAt": "2025-11-09T10:00:00Z",
  "state": {
    "seed": 123456789,
    "tick": 60,
    "rngState": null,
    "world": { "chunks": [] },
    "drones": [
      {
        "id": "drone-0001",
        "position": { "x": 10, "y": 2, "z": -3 },
        "state": "idle",
        "inventory": {},
        "queuedOrders": []
      }
    ],
    "commandQueue": [],
    "metadata": { "exporterVersion": "dev-2025-11-09" }
  }
}
```

## Migration notes

- The persistence implementation in `src/state/persistence.ts` MUST expose a `CURRENT_VERSION` integer.

Policy for missing `version`:

If `version` is missing, the loader should treat the snapshot as v1. Implementations should normalize the parsed object by setting `snapshot.version = Number(snapshot.version ?? 1)` before running migrations so that `migrateSnapshot` always operates on a known numeric version.

When bumping the schema:

1. Add a migration function that converts snapshot version N -> N+1 and register it in the migrations map.
2. Increment `CURRENT_VERSION` to the new version.
3. Add a fixture JSON file in `tests/fixtures/migrations/` representing the older version and a test that asserts the migrated snapshot meets the current schema.

Migration contract:

- Each migration function MUST return a snapshot object where the top-level `version` equals the migration's target version (for example, the migration that upgrades v1 -> v2 must return an object with `version: 2`). This ensures deterministic forward progress of the migration pipeline and avoids infinite loops.

Short sample outline (in `src/state/persistence.ts`):

```ts
export const CURRENT_VERSION = 2;

const migrations: Record<number, (oldSnapshot: any) => any> = {
  1: (oldSnapshot) => {
    // example: ensure `metadata` exists
    return { ...oldSnapshot, metadata: oldSnapshot.metadata || {}, version: 2 };
  }
};

export function migrateSnapshot(snapshot: any) {
  let v = Number(snapshot.version ?? 1);
  let s = { ...snapshot };
  while (v < CURRENT_VERSION) {
    const migrate = migrations[v];
    if (!migrate) {
      throw new Error(`Missing migration for snapshot version v${v} — cannot migrate to v${CURRENT_VERSION}`);
    }
    s = migrate(s);
    v = Number(s.version ?? v + 1);
  }
  return s;
}
```

## Test plan / acceptance

- Add migration fixture files under `tests/fixtures/migrations/` (e.g. `v1-to-v2.json`).
- Write a Vitest that loads the fixture, calls the public `migrateSnapshot` / `loadSnapshot` pathway, and asserts the returned object has `version === CURRENT_VERSION` and validates against the snapshot schema (use existing runtime validator in `src/state/simTypes.ts`).
- Add an integration test that performs: createSim -> saveSnapshot -> loadSnapshot -> continue running -> assert determinism compared to an uninterrupted run.

## UX notes

- Export size: warn users when the exported snapshot is large (suggest threshold ~1 MB for dev builds). Consider providing "Export metadata only" or "Export minimal snapshot" toggles in the dev UI.

- Developer toggles: the DevTools export UI should allow selecting: Full snapshot | Minimal snapshot (no `world` heavy data) | Commands-only. This assists debugging and keeps shared fixtures small.

## Acceptance (TASK003)

- The system saves and loads a versioned snapshot using the `{ version, createdAt, state }` wrapper. Migrations are sequential and tested via fixtures. Date: 2025-11-09.
