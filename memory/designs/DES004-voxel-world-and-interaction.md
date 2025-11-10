# DES004 - Voxel World and Interaction

Status: Completed

## Overview

Evolve Nano Drones Commander from a single-heightmap chunk into a deterministic, Minecraft-like voxel sandbox while preserving:
- Pure, seeded sim core (`runSimTick` and ECS systems).
- Fixed-timestep loop via `simStore`.
- Clear separation of sim vs PlayCanvas rendering.
- Drone-focused gameplay.

This design defines:
- Deterministic 3x3 chunk voxel world.
- Survival-style inventory and block interactions.
- Dev-only creative/fly/noclip controls.
- Stubbed equipment model (including backpack slot) for future systems.

## Architecture

### World Model

New/updated types (in `src/sim` or `src/ecs` as appropriate):

- `BlockId`
  - Union or enum of core block types: `air`, `ground`, `resource`, plus placeholders for future blocks.
- `ChunkId`
  - `{ x: number; z: number; }` identifying chunk in XZ grid.
- `VoxelCoord`
  - `{ x: number; y: number; z: number; }` within chunk.
- `ChunkState`
  - `{ id: ChunkId; size: number; height: number; blocks: BlockId[] | Uint8Array; }`.
- `WorldState`
  - Holds 3x3 chunks around origin initially (extensible later), e.g. `Record<string, ChunkState>` keyed by `ChunkId`.

Constraints:
- All world generation is deterministic from `(seed, ChunkId)` using repo RNG.
- Sim core owns authoritative `WorldState` (no PlayCanvas state inside sim).

### Meshing & Rendering Boundary

In `src/voxel/mesher.ts` and `src/pc`:

- Mesher consumes `ChunkState` and produces `MeshData`:
  - `positions`, `normals`, `uvs`, `indices`.
- Renderer (`PlayCanvasShell`) maintains a registry of chunk entities by `ChunkId`.
- Sim signals changes as `ChunkMeshDiff` structures (e.g. chunk marked dirty); PlayCanvas code rebuilds meshes for dirty chunks only.

### Player, Inventory, and Equipment

In `src/state/simTypes.ts` (or equivalent):

- `ItemId` and `ItemStack` (minimal for now: blocks and mined resources).
- `InventoryState`
  - Fixed-size array of `ItemStack`.
- `HotbarState`
  - Indexes into inventory or inline stacks for quick selection.
- `PlayerEquipment`
  - Slots: `head`, `chest`, `legs`, `boots`, `leftHand`, `rightHand`, `backpack` (all nullable/empty on spawn).
  - `backpack`: reserved for future extra inventory capacity; no current effect.
- `PlayerState`
  - Position, velocity, orientation.
  - `inventory`, `hotbar`, `equipment`.
  - Dev/runtime flags: `devCreative`, `devFly`, `devNoclip` (non-persistent).

Rules:
- On spawn/reset: all equipment slots exist and are empty; inventory baseline size configured.
- Dev flags are toggled via dev UI and MUST reset to `false` on load/new sim.

### Dev Flags and Modes

- `devCreative`
  - If true: ignore inventory consumption, instant break/place allowed.
- `devFly`
  - If true: ignore gravity; allow free 3D movement.
- `devNoclip`
  - If true: ignore block collisions.

Implementation constraints:
- Dev flags are part of in-memory sim state only.
- Persistence layer excludes dev flags; they default to `false` when loading.

## Key Behaviors

### World & Rendering

- Generate deterministic 3x3 chunks around origin at startup.
- Represent all terrain and resources via `BlockId`s in chunks.
- On voxel change (mine/place), mark chunk dirty; renderer rebuilds only that mesh.
- Maintain PlayCanvas entities for visible chunks; unload when outside view.

### Simulation & Interaction

- Player movement uses voxel-aware collision (solid blocks block, air does not), unless dev flags allow override.
- Block breaking:
  - Survival: breaking a block converts voxel to air and yields an `ItemStack` into inventory.
  - Dev creative: no inventory changes required.
- Block placement:
  - Survival: requires corresponding item; consumes one on success.
  - Dev creative: free placement.
- Drones:
  - Mining orders target specific voxel coordinates with `resource` blocks.
  - Completion updates voxel to depleted/air and updates counts deterministically.

### UX & Performance

- Add crosshair and hotbar UI overlay (no impact on sim purity).
- Highlight targeted voxel using camera ray → voxel mapping based on current `WorldState`.
- Batch mesh rebuilds per frame; cap work to avoid jank.
- Ensure save/load round-trips preserve voxel world, drones, player state, and inventory (excluding dev flags).

## Phased Implementation

1. Phase 1 — Voxel Core
   - Introduce world types and `BlockId`-based single-chunk world.
   - Adapt mesher to new representation.
2. Phase 2 — Multi-Chunk + Collision + Drones
   - Implement 3x3 chunk grid; update player movement for voxel collision.
   - Update drones and mining to operate on voxel coordinates.
   - Migrate persistence.
3. Phase 3 — Survival Interaction & Dev Modes
   - Implement inventory, hotbar, block break/place, crosshair, voxel targeting.
   - Add dev-only toggles for creative/fly/noclip; ensure non-persistence.
4. Phase 4 — Mesh Diffs & Visual Polish
   - Add dirty-flag-based mesh updating and visibility culling.
   - Improve lighting, fog, and materials for voxel aesthetic.

## Out of Scope (For This Design)

- Tech tree and research system.
- Drone upgrade modules and factories.
- Walls, doors, and advanced structures.
- Backpack capacity effects (beyond reserved slot).
- Advanced lighting models and biomes.

These are captured as future extensions and will be designed separately once the core voxel sandbox is stable.

## Outcome

- Tasks TASK004–TASK010 implemented the multi-chunk voxel world, player interaction loop, dev flags, and renderer diff pipeline per this design.
- Persistence now migrates legacy saves into version 4 with sanitized snapshots and mesh diff rehydration.
