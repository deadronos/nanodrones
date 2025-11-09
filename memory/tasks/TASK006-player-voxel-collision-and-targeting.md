# [TASK006] - Player Voxel Collision and Targeting

**Status:** Pending  
**Added:** 2025-11-09  
**Updated:** 2025-11-09

## Original Request

Introduce voxel-aware player collision and a deterministic camera-ray-to-voxel targeting helper.

## Implementation Plan

- Update player movement system to use `WorldState` and `BlockId` for collision checks.
- Prevent entering solid blocks while maintaining smooth movement.
- Implement a deterministic raycast helper that maps camera direction to targeted voxel.
- Expose targeting result for later block break/place and drone order UIs.
- Add tests for collision edge cases and targeting correctness.

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID  | Description                             | Status       | Updated     | Notes |
| --- | --------------------------------------- | ------------ | ----------- | ----- |
| 6.1 | Integrate voxel collision into movement | Not Started  | 2025-11-09  |       |
| 6.2 | Implement camera ray → voxel helper     | Not Started  | 2025-11-09  |       |
| 6.3 | Expose targeting to UI/systems          | Not Started  | 2025-11-09  |       |
| 6.4 | Add tests for collision/targeting       | Not Started  | 2025-11-09  |       |

## Progress Log

2025-11-09
- Task created from DES004 spec.
