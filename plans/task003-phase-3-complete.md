## Phase 3 Complete: Sim Store API & Tick Helpers

Added store-level snapshot and stepping APIs and tests validating single-step and snapshot roundtrip.

**Files created/changed:**
- `src/state/simStore.ts` (added `getSnapshot`, `loadSnapshot`, `stepOnce`, `applyCommand`, exported `createSim`)
- `tests/simStorePersistence.test.ts` (added tests for snapshot roundtrip and stepOnce)

**Functions created/changed:**
- `getSnapshot(): Snapshot`
- `loadSnapshot(snapshot: Snapshot): void`
- `stepOnce(): void` (runs a single fixed timestep and persists)
- `applyCommand(cmd: Order): void` (enqueue minimal mine order)
- `createSim(seed?: number): SimState` (factory wrapper)

**Tests created/changed:**
- `tests/simStorePersistence.test.ts` — two tests (snapshot roundtrip, stepOnce)

**Review Status:** LOCAL TESTS PASS

**Git Commit Message:**
```
feat: Add sim store snapshot, stepping, and command helper

- Add store APIs: getSnapshot, loadSnapshot, stepOnce, applyCommand
- Export createSim factory for tests
- Add unit tests verifying snapshot roundtrip and single-step behavior
```
