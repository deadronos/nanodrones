## DES003 — Snapshot schema & migration guidance

TL;DR

This document describes the versioned simulation snapshot schema used by TASK003 (Sim state & persistence), migration guidance for evolving the schema, an example payload, and a short test plan for migrations. Date: 2025-11-09.

---
title: DES003 — Snapshot schema & migration guidance
---

#!/usr/bin/env text
# DES003 — Snapshot schema & migration guidance

TL;DR

This document describes the versioned simulation snapshot schema used by TASK003 (Sim state & persistence), migration guidance for evolving the schema, an example payload, and a short test plan for migrations. Date: 2025-11-09.

## Snapshot schema (wrapper shape)

Persisted snapshots are stored as a small wrapper object with a top-level `version` and a `state` property containing the simulation payload. The top-level fields are:

- `version` (integer): Top-level schema version. Required. Increment when schema changes.
- `createdAt` (string, ISO-8601): Timestamp when snapshot was created.
- `state` (object): The simulation state payload containing `seed`, `tick`, `rngState`, `world`, `drones`, `commandQueue`, and `metadata`.

State payload (fields inside `state`):

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

- Keep large world payloads optional or reference-based to avoid very large exports. Prefer chunked or compressed formats when needed.

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

If `version` is missing, the loader should treat the payload as v1. Implementations should normalize the parsed object by setting `snapshot.version = Number(snapshot.version ?? 1)` before running migrations so that `migrateSnapshot` always operates on a known numeric version.

When bumping the schema:

1. Add a migration function that converts payload version N -> N+1 and register it in the migrations map.
2. Increment `CURRENT_VERSION` to the new version.
3. Add a fixture JSON file in `tests/fixtures/migrations/` representing the older version and a test that asserts the migrated snapshot meets the current schema.

Short sample outline (in `src/state/persistence.ts`):

```ts
export const CURRENT_VERSION = 2;

const migrations: Record<number, (oldPayload: any) => any> = {
  1: (old) => {
    // example: ensure `metadata` exists
    return { ...old, metadata: old.metadata || {}, version: 2 };
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

- Export size: warn users when the export payload is large (suggest threshold ~1 MB for dev builds). Consider providing "Export metadata only" or "Export minimal snapshot" toggles in the dev UI.

- Developer toggles: the DevTools export UI should allow selecting: Full snapshot | Minimal snapshot (no `world` heavy data) | Commands-only. This assists debugging and keeps shared fixtures small.

## Acceptance (TASK003)

- The system saves and loads a versioned snapshot using the `{ version, createdAt, state }` wrapper. Migrations are sequential and tested via fixtures. Date: 2025-11-09.
