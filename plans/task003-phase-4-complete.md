## Phase 4 Complete: Drone Behavior & Unit Tests

Extracted pure drone tick logic into `src/sim/drones.ts` and added unit tests validating deterministic movement and mining progress.

**Files created/changed:**
- `src/sim/drones.ts` (new: `processDroneTick` pure function)
- `src/ecs/engine.ts` (now calls `processDroneTick`)
- `tests/drone.test.ts` (unit tests for movement + mining)

**Functions created/changed:**
- `processDroneTick(drone, order, state, dt): DroneStepResult` — pure deterministic drone tick

**Tests created/changed:**
- `tests/drone.test.ts` — two tests (movement determinism, mining progress & completion)

**Review Status:** LOCAL TESTS PASS

**Git Commit Message:**
```
feat: Extract drone tick logic to pure module and add tests

- Add `src/sim/drones.ts` with `processDroneTick`
- Wire engine to use `processDroneTick`
- Add `tests/drone.test.ts` for deterministic behavior
```
