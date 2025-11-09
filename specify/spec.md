# Nano Drones Commander — Voxel Sandbox Spec

Scope: Evolve Nano Drones Commander into a deterministic, Minecraft-like voxel sandbox while preserving the pure sim core and drones concept.

## Core Goals

- Deterministic 3x3 chunk voxel world around origin using seeded RNG.
- Survival-style block interaction and inventory as default.
- Dev-only creative powers: infinite blocks, flying, noclip (non-persistent).
- Stubbed equipment system and inventory model prepared for future tech tree.

## World & Rendering Requirements

1. WHEN the simulation initializes with a seed, THE SYSTEM SHALL generate a deterministic 3x3 grid of voxel chunks around the origin using only the seeded RNG in the sim core.
2. WHEN a chunk is generated, THE SYSTEM SHALL represent each voxel using a `BlockId` that distinguishes at minimum air, ground, and resource blocks.
3. WHEN the world state for a chunk changes (e.g., a voxel is mined or placed), THE SYSTEM SHALL emit a chunk mesh diff for that chunk so the renderer can rebuild only affected meshes.
4. WHEN the camera is within a configured view distance (initially covering the 3x3 grid), THE SYSTEM SHALL ensure all intersecting chunks have corresponding PlayCanvas mesh entities created; chunks outside this range SHALL be unloaded.
5. WHEN rendering, THE SYSTEM SHALL use consistent ambient + directional lighting and simple fog parameters (outside the sim core) to convey a clear voxel aesthetic.

## Simulation & Interaction Requirements

1. WHEN the player moves using input during a tick, THE SYSTEM SHALL update player position using fixed timestep and voxel-collision-aware movement that prevents entry into solid blocks, except when dev noclip/fly is enabled.
2. WHEN the player targets a voxel within reach and issues a break action, THE SYSTEM SHALL deterministically change that voxel from solid to air/depleted and add the corresponding block item to the player inventory in survival mode.
3. WHEN the player targets a valid placement position and has the required block item, THE SYSTEM SHALL consume one item from inventory and set the corresponding voxel to the chosen `BlockId` in survival mode.
4. WHEN in dev creative mode, THE SYSTEM SHALL allow block placement and removal without affecting survival inventory.
5. WHEN the user issues a mining order via UI, THE SYSTEM SHALL translate it into voxel-level mining tasks targeting specific resource `BlockId` positions.
6. WHEN a drone completes a mining task, THE SYSTEM SHALL update the voxel to its mined state and adjust relevant counters/inventory deterministically.
7. WHEN the simulation is paused, THE SYSTEM SHALL halt state updates for player, drones, and world while allowing camera-only movement in the renderer.

## UX & Performance Requirements

1. WHEN in control, THE SYSTEM SHALL render a central crosshair aligned with the voxel targeting ray.
2. WHEN the player changes the active slot (scroll or number keys), THE SYSTEM SHALL update a hotbar selection reflecting the current block or item.
3. WHEN a targetable block is under the crosshair, THE SYSTEM SHALL display a highlight derived from current world state without mutating the sim.
4. WHEN multiple voxel changes occur, THE SYSTEM SHALL batch mesh rebuilds per tick so that no tick attempts to rebuild more than a bounded number of chunk meshes.
5. WHEN saving and loading, THE SYSTEM SHALL persist world, chunks, player (excluding dev flags), drones, orders, and inventory with versioned migrations to preserve determinism.

## Player State, Inventory, and Equipment

- Player has:
  - `inventory`: survival item slots (exact size tbd; baseline fits common blocks and drops).
  - `hotbar`: subset of inventory for quick selection.
  - `equipment`:
    - Slots: `head`, `chest`, `legs`, `boots`, `leftHand`, `rightHand`, `backpack`.
    - All slots exist and are empty on spawn/reset.
    - `backpack` is reserved for future extra carried item capacity; no effect yet.
- Dev flags:
  - `devCreative`, `devFly`, `devNoclip` exist only at runtime, may be toggled via dev UI, and MUST NOT be persisted.

## Dev Tools & Modes

- Dev UI may expose toggles for:
  - Creative mode (infinite blocks, instant break).
  - Fly mode (ignore gravity, free 3D movement).
  - Noclip (ignore collision).
- Requirements:
  - WHEN the app reloads or a save is loaded, dev flags SHALL reset to false.
  - Dev modes SHALL never alter persisted save data semantics.

## Future Extensions (Non-Scope for This Milestone)

- Tech tree and research unlocking:
  - Drone upgrades, new tools, structures.
- Buildable structures:
  - Factories, walls, doors, defensive blocks.
- Backpack upgrades:
  - Increase player carrying capacity via research/equipment.
- Advanced lighting, biomes, and worldgen.

## Phased Rollout

1. Phase 1 — Voxel Core
   - Introduce `BlockId`, `ChunkId`, `WorldState` with deterministic generation for current area.
   - Adapt mesher and renderer to read from voxel world (still close to current terrain).
2. Phase 2 — 3x3 Chunks + Collision
   - Implement multi-chunk management (3x3), voxel collision for player, and voxel-level mining for drones.
   - Update persistence for new world format.
3. Phase 3 — Survival Interaction & Dev Modes
   - Add inventory, hotbar, block break/place, and crosshair/selection.
   - Wire dev-only creative/fly/noclip flags via DevTools panel; ensure non-persistent.
4. Phase 4 — Mesh Diffs & Polish
   - Introduce chunk mesh diffing, batching, and visibility culling.
   - Tune lighting/fog/materials to reinforce Minecraft-like look without changing sim.
