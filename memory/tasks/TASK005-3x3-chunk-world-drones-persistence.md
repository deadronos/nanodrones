# [TASK005] - 3x3 Chunk World, Voxel Drones, and Persistence

**Status:** Completed
**Added:** 2025-11-09
**Updated:** 2025-11-10

## Original Request

Extend the voxel world to a deterministic 3x3 chunk grid, update drones to operate on voxel coordinates, and migrate persistence to store the new `WorldState`.

## Implementation Plan

- Implement `ChunkId`-keyed storage for chunks within `WorldState`.
- Add deterministic per-chunk generation from `(seed, ChunkId)`.
- Introduce helpers for voxel lookup and world-to-voxel mapping.
- Update drone/order systems to target specific voxel positions instead of abstract columns.
- Update persistence schema and add migrations for `WorldState`.
- Add tests for world determinism, drone mining correctness, and persistence round-trips.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                      | Status       | Updated     | Notes |
| --- | ------------------------------------------------ | ------------ | ----------- | ----- |
| 5.1 | Implement `WorldState` with 3x3 chunk support    | Completed    | 2025-11-10  |       |
| 5.2 | Add deterministic per-chunk generation           | Completed    | 2025-11-10  |       |
| 5.3 | Add voxel lookup/world-to-voxel helpers          | Completed    | 2025-11-10  |       |
| 5.4 | Port drones to voxel-based mining                | Completed    | 2025-11-10  |       |
| 5.5 | Update persistence + migrations for `WorldState` | Completed    | 2025-11-10  |       |
| 5.6 | Add tests for determinism and persistence        | Completed    | 2025-11-10  |       |

## Progress Log

2025-11-09
- Task created from DES004 spec.

2025-11-10
- Expanded the world to a deterministic 3×3 grid, migrated drones and persistence, and added coverage for generator determinism.
