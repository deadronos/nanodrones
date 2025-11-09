# [TASK008] - Block Break/Place Mechanics (Survival + Creative)

**Status:** Pending  
**Added:** 2025-11-09  
**Updated:** 2025-11-09

## Original Request

Implement block breaking and placement using voxel targeting, wired to inventory for survival mode and ignoring costs in creative mode.

## Implementation Plan

- Use targeting helper to identify selected voxel and placement position.
- Implement survival block breaking: update voxel, add item(s) to inventory.
- Implement survival placement: consume item and set voxel to corresponding `BlockId`.
- Implement creative behavior: allow free break/place without inventory changes.
- Ensure voxel changes mark chunks dirty for mesh rebuild.
- Add tests for survival and creative behaviors.

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID  | Description                                   | Status       | Updated     | Notes |
| --- | --------------------------------------------- | ------------ | ----------- | ----- |
| 8.1 | Wire targeting into break/place actions       | Not Started  | 2025-11-09  |       |
| 8.2 | Implement survival break → inventory          | Not Started  | 2025-11-09  |       |
| 8.3 | Implement survival placement ← inventory      | Not Started  | 2025-11-09  |       |
| 8.4 | Implement creative free break/place           | Not Started  | 2025-11-09  |       |
| 8.5 | Ensure dirty chunks trigger mesh rebuilds     | Not Started  | 2025-11-09  |       |
| 8.6 | Add unit/integration tests                    | Not Started  | 2025-11-09  |       |

## Progress Log

2025-11-09
- Task created from DES004 spec.
