# System Patterns

## High-level Architecture

- React UI (controls, debug panels) — `src/ui` and `src/pc` contain shell + PlayCanvas integration.
- Simulation core (deterministic tick loop, ECS-lite patterns) — `src/state`, `src/ecs`, `src/sim*`.
- Voxel world generator + mesher — `src/voxel`.
- Renderer (PlayCanvas) subscribes to sim state for visualisation; render loop is decoupled from sim ticks.

## Design Patterns in Use

- Separation of concerns: simulation (authoritative state) vs renderer (visualisation only).
- ECS-lite: Entities + component data stored in typed structures; systems operate in the sim tick.
- Command queue / message-passing for user orders (preserves determinism and makes testing easier).
- Seeded RNG and functional updates: mutation minimised in sim boundaries to aid reproducibility.

## Component Relationships

- UI triggers -> Command queue -> Simulation core applies commands during tick -> Store updated -> Renderer subscribes and draws.

## Testing & Observability

- Unit tests target the sim core and RNG for determinism (use Vitest).
- Instrumentation via `DebugPanel` and tick counters makes verifying runs repeatable.
