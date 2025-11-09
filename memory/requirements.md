# Requirements (EARS-style)

1. WHEN the app starts, THE SYSTEM SHALL load a deterministic voxel world and initial drones from a seed and save-game (if present).
2. WHEN the user presses movement controls, THE SYSTEM SHALL move the player character in a smooth third-person controller within the PlayCanvas scene.
3. WHEN the user issues a "Mine" order to a drone, THE SYSTEM SHALL enqueue and execute a mine behavior deterministically.
4. WHEN the simulation is paused, THE SYSTEM SHALL halt simulation ticks while keeping rendering and camera orbit responsive.
5. WHEN the app reloads, THE SYSTEM SHALL restore state from `nano-drones-save` and reconcile with the deterministic world seed.


> TASK003-specific requirements follow.

## TASK003 — Sim state & persistence (EARS requirements)

1. WHEN a user requests to save the running simulation (manual save or auto-save), THE SYSTEM SHALL persist a versioned snapshot of the full simulation state to a pluggable backend (default: `localStorage`), using the wrapper shape `{ version, createdAt, state }`.

**Acceptance:** Saving produces a JSON object under key `nano-drones-save` that contains `version`, `createdAt` (ISO-8601), and `state`. A test can call the save API then call the load API and assert the loaded object has the same `version`, a parsable `createdAt` timestamp, and a deep-equal `state`. [Date: 2025-11-09]

2. WHEN the system loads a saved snapshot, THE SYSTEM SHALL run migration steps to upgrade older snapshot versions to the current schema deterministically before applying state to the simulation.

**Acceptance:** An integration test must provide an older-version fixture, call the public load API, and assert the result has `version === CURRENT_VERSION` and passes the snapshot schema validator. Migration steps must be exercised by unit tests. [Date: 2025-11-09]

3. WHEN the user exports or imports snapshots, THE SYSTEM SHALL support export/import of a stable JSON snapshot format and warn when exported snapshot size exceeds a practical threshold.

**Acceptance:** Export produces a JSON file/string that round-trips through the import API and restores the same logical simulation state (ticks, RNG seed, drone states). UI should surface a size warning for exported snapshot sizes > 1 MB in dev builds. [Date: 2025-11-09]

4. WHEN snapshot shape or semantics change, THE SYSTEM SHALL require an explicit migration function added to `src/state/persistence.ts` and a matching fixture test demonstrating the migration outcome.

**Acceptance:** Adding a migration requires (a) bumping `CURRENT_VERSION` in `src/state/persistence.ts`, (b) adding a migration function to the migrations map, and (c) adding a test fixture under `tests/fixtures/migrations/` that asserts the migrated snapshot meets the current schema. [Date: 2025-11-09]

## TASK004 — Voxel core types and single-chunk migration (EARS requirements)

1. WHEN the simulation starts, THE SYSTEM SHALL initialize the deterministic world as a block-based chunk (with `BlockId` layers) generated from the configured seed so that replaying the same seed reconstructs the same terrain geometry.

   **Acceptance:** A unit test must regenerate the chunk twice using the same RNG seed and assert the derived chunk metadata, block array, and resource list are equal.

2. WHEN drones or UI helpers request active resource columns, THE SYSTEM SHALL derive the coordinates from the chunk's block array (identifying `resource` cells) instead of the legacy heightmap and resource flags, preserving the behavior of `listActiveResources` / `findNearestResource`.

   **Acceptance:** Resource lookup helpers must return the same `VoxelCoord`s as before the migration when the resource blocks are placed at the top of each column.

3. WHEN loading a version 2 snapshot, THE SYSTEM SHALL migrate the legacy heightmap representation into the new block-based chunk schema without altering player, drone, or order data.

   **Acceptance:** The migration test should start from a synthetically crafted V2 payload, call `migrateSnapshot`, and verify the resulting chunk has the same number of resource targets and valid `BlockId` layers while other state fields remain untouched.
