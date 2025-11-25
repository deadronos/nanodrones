# TASK011 - Implement Realism Improvements

**Status:** Completed
**Parent Design:** DES005

## Description
Implement physics, better RNG, and drone battery mechanics to increase simulation realism.

## Subtasks

- [x] **RNG Upgrade**: Replace LCG with Mulberry32 or similar in `src/state/rng.ts`.
- [x] **Physics System**:
    - [x] Define `PhysicsState` types.
    - [x] Create `src/ecs/systems/physics.ts`.
    - [x] Integrate into `runSimTick`.
    - [x] Update Player movement to use forces/velocity instead of direct position manipulation.
- [x] **Drone Realism**:
    - [x] Add `velocity` to `DroneState`.
    - [x] Update drone movement to use physics system (apply force/velocity).
    - [x] Implement battery drain in `processDroneTick`.
    - [x] Add "Low Battery" behavior (stop or return).

## Progress Log
- **2025-11-25**: Created task.
- **2025-11-25**: Implemented RNG upgrade (Mulberry32), Physics system, and Drone battery/physics logic. Verified with tests.
