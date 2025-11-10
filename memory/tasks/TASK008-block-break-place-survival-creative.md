# [TASK008] - Block Break/Place Mechanics (Survival + Creative)

**Status:** Completed
**Added:** 2025-11-09
**Updated:** 2025-11-10

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

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                   | Status       | Updated     | Notes |
| --- | --------------------------------------------- | ------------ | ----------- | ----- |
| 8.1 | Wire targeting into break/place actions       | Completed    | 2025-11-10  |       |
| 8.2 | Implement survival break → inventory          | Completed    | 2025-11-10  |       |
| 8.3 | Implement survival placement ← inventory      | Completed    | 2025-11-10  |       |
| 8.4 | Implement creative free break/place           | Completed    | 2025-11-10  |       |
| 8.5 | Ensure dirty chunks trigger mesh rebuilds     | Completed    | 2025-11-10  |       |
| 8.6 | Add unit/integration tests                    | Completed    | 2025-11-10  |       |

## Progress Log

2025-11-09
- Task created from DES004 spec.

2025-11-10
- Hooked break/place actions into targeting, inventory, and creative overrides with updated tests and mesh diff handling.
