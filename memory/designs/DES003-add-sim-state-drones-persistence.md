# DES003 - Sim State, Drones, and Persistence

## Goal

Provide an authoritative, deterministic simulation state and persistence layer so drone entities, orders, and world seeds can be saved, restored, and replayed reproducibly.

## Scope

- Define and stabilise the sim data model (entities, drones, orders, world seed, tick counter).
- Implement or extend the authoritative sim store API in `src/state` to: create runs, apply commands, advance ticks, and export/import serialised state.
- Implement or harden the persistence module (save/load) under `src/state/persistence.ts` using the `nano-drones-save` key with versioning and migration support.
- Add a minimal drone behavior set (move, mine, idle) together with a deterministic processing system for drone orders.
- Provide tests and verification hooks to prove deterministic replay across save/load and across runs with the same seed.

## Interfaces / Files

- `src/state/simStore.ts` — authoritative sim API: `create(seed)`, `applyCommand(cmd)`, `tick(dt)`, `getStateSnapshot()`, `loadSnapshot(snapshot)`.
- `src/state/simTypes.ts` — canonical types and interfaces for `SimState`, `Drone`, `Order`, `WorldState`, `SaveFormatV1`.
- `src/state/persistence.ts` — `save(state)`, `load()`, `exportSave()`, `importSave(serialised)`, migration helpers.
- `src/state/rng.ts` — seeded RNG; ensure consistent use across sim and drone behaviours.
- `src/sim/drones.ts` or `src/ai/drone.ts` — drone behavior implementations and small AI tick functions.
- `tests/sim/*` — deterministic replay tests, save/load roundtrip tests, and unit tests for drone behavior.

## Data Flow

UI / Commands -> Command Queue -> `simStore.applyCommand()` -> `simStore.tick()` applies systems (movement, drone AI, order execution) -> `simStore` state updated -> `persistence.save()` serialises state to `localStorage` (or chosen backend) -> Renderer subscribes to state snapshots.

## Acceptance Criteria (testable)

- Starting a run with the same seed and applying the same sequence of commands produces identical final snapshots.
- Saving state, reloading it (via `load()` or import), and continuing results in identical outcomes compared to an uninterrupted run.
- Drone entities exist in `SimState` and expose a deterministic sequence of actions for a given seed and input sequence.
- Persistence format is versioned (e.g., `v1`) and loadable with a clear migration path.

## Implementation Notes & Constraints

- Avoid using `Date.now()`, `Math.random()`, or other non-deterministic browser features in simulation logic; centralise randomness through `src/state/rng.ts`.
- Keep sim primitives serialisable (avoid DOM nodes, functions in state snapshots).
- Use stable iteration order for arrays/maps when saving and when running systems (sort or use ordered lists) so serialisation is stable.
- Provide small, focused unit tests for RNG, `tick()` determinism, and `save/load` round-trips.

## Tasks (high level)

1. Design & codify sim types in `src/state/simTypes.ts` (Drone, Order, SimState, Save formats).
2. Implement/extend `simStore` API with create/load/save/tick and command processing.
3. Implement basic drone behaviors and an order-execution system (move, mine, idle).
4. Implement `persistence.ts` with versioned save/load and export/import helpers.
5. Add deterministic tests: RNG repeatability, tick determinism, save/load roundtrip.
6. Document the persistence format and migration strategy in `memory/` if changes are non-trivial.

## Test Strategy

- Unit tests for `rng`, `applyMovement`, and drone behavior functions using Vitest.
- Integration tests that run two simulated runs (continuous vs. save/load resume) and assert equality of snapshots.
