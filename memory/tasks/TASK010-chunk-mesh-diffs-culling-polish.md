# [TASK010] - Chunk Mesh Diffs, Culling, and Visual Polish

**Status:** Pending  
**Added:** 2025-11-09  
**Updated:** 2025-11-09

## Original Request

Optimize chunk rendering with mesh diffs and visibility culling, and tune visuals for a voxel look.

## Implementation Plan

- Track dirty chunks and compute `ChunkMeshDiff` outputs from world changes.
- In `PlayCanvasShell`, rebuild meshes only for dirty chunks and destroy unloaded ones.
- Implement simple distance-based culling for chunk entities.
- Tune lighting, fog, and materials for clear voxel aesthetics.
- Add tests for mesh diff logic where practical (e.g., unit tests for diff generation).

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID   | Description                                   | Status       | Updated     | Notes |
| ---- | --------------------------------------------- | ------------ | ----------- | ----- |
| 10.1 | Implement dirty chunk tracking & diff output  | Not Started  | 2025-11-09  |       |
| 10.2 | Update PlayCanvasShell for diff-based meshes  | Not Started  | 2025-11-09  |       |
| 10.3 | Implement basic chunk visibility culling      | Not Started  | 2025-11-09  |       |
| 10.4 | Tune lighting/fog/materials                   | Not Started  | 2025-11-09  |       |
| 10.5 | Add tests for diff logic where feasible       | Not Started  | 2025-11-09  |       |

## Progress Log

2025-11-09
- Task created from DES004 spec.
