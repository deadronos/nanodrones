# [TASK004] - Voxel Core Types and Single-Chunk Migration

**Status:** Completed
**Added:** 2025-11-09
**Updated:** 2025-11-10

## Original Request

Introduce voxel core types and migrate the existing terrain to a `BlockId`-based single-chunk world without changing observable behavior.

## Thought Process

Start by formalizing the voxel representation in the sim core to match DES004 while keeping scope minimal: one chunk, current visuals, no new gameplay. This de-risks later multi-chunk, inventory, and interaction features.

## Implementation Plan

- Define `BlockId`, `ChunkId`, `VoxelCoord`, `ChunkState`, and `WorldState` types.
- Implement a single `ChunkState` backing the current world (heightmap-based) using `BlockId`s.
- Update world generation to fill `ChunkState.blocks` deterministically from seed.
- Adapt `voxel/mesher.ts` to consume `ChunkState` and `BlockId`.
- Keep drones and player behavior functionally equivalent.
- Add unit tests to assert deterministic world generation for given seeds.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                  | Status       | Updated     | Notes |
| --- | -------------------------------------------- | ------------ | ----------- | ----- |
| 4.1 | Add core voxel types to sim types            | Completed    | 2025-11-09  |       |
| 4.2 | Implement single-chunk `WorldState`          | Completed    | 2025-11-10  |       |
| 4.3 | Update mesher to work on `ChunkState`        | Completed    | 2025-11-10  |       |
| 4.4 | Ensure behavior parity with existing world   | Completed    | 2025-11-10  |       |
| 4.5 | Add determinism tests for world generation   | Completed    | 2025-11-10  |       |

## Progress Log

2025-11-09
- Task created from DES004 spec.

2025-11-10
- Introduced block-based `ChunkState`, rewired the voxel generator/mesher, and started updating persistence/migration scaffolding for Task004.

2025-11-10
- Finalized generator and mesher updates, verified determinism, and closed out the task.
