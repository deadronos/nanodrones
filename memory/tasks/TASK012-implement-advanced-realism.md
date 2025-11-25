# TASK012 - Implement Advanced Realism

**Status:** Completed
**Parent Design:** DES006

## Description
Implement Perlin noise for resources, charging mechanics, and sensor ranges.

## Subtasks

- [x] **Noise & Generation**:
    - [x] Create `src/utils/noise.ts`.
    - [x] Update `src/voxel/generator.ts` to use noise for resources.
    - [x] Add `base` block type and place it at origin.
- [x] **Types**:
    - [x] Update `BlockId` in `src/state/simTypes.ts`.
    - [x] Update `ItemId` (optional, if base is mineable/placeable).
- [x] **Charging Logic**:
    - [x] Implement `findNearestBlock` helper.
    - [x] Update `processDroneTick` to handle low battery -> seek base -> charge.
- [x] **Sensors**:
    - [x] Update `findNearestResource` to respect range.

## Progress Log
- **2025-11-25**: Created task.
- **2025-11-25**: Implemented Perlin noise, base block, charging logic, and sensor range. Verified with tests.
