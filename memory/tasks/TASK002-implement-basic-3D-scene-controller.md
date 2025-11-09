# TASK002 - Implement basic 3D scene & controller

**Status:** Pending  
**Added:** 2025-11-09  
**Updated:** 2025-11-09

## Original Request

Implement a basic embedded 3D PlayCanvas scene and a player controller so the user can move a player in third-person (maps to requirements #2 and related visualization needs).

## Thought Process

This task creates the visual foundation for the simulator: an in-browser 3D canvas with a simple player entity and a deterministic controller. The scene should be minimal to avoid asset dependencies, and the controller should be implemented so it can be unit-tested as a pure function (movement vector given input and dt -> new position).

## Implementation Plan

0. Create `types/playcanvas-augmentations.d.ts` that augments the `pc` namespace with small runtime-only fields (for example: `StandardMaterial.shininess?`, `Scene.gammaCorrection?`, `Scene.toneMapping?`). Add the `types` folder to `tsconfig.app.json` `include` (e.g. `"include": ["src","types"]`) and run `npm run typecheck` to validate. This avoids repeated `as any` casts across the codebase.
1. Review and extend `src/pc/PlayCanvasShell.tsx` to ensure it exposes `onReady` and mounts/unmounts the PlayCanvas `pc.Application` cleanly. (If the file already works, add the `onReady` prop.)
2. Add `src/pc/scene/simpleScene.ts` which creates a ground plane, ambient + directional light, and a `player` entity (box/sphere). Export a `createSimpleScene(app)` helper that returns the player entity reference.
3. Implement `src/ecs/systems/thirdPersonController.ts` containing a small `applyMovement(position, input, dt, speed)` pure function plus a thin system wrapper that reads input and updates transforms during the sim tick.
4. Wire keyboard input from `src/controls/useKeyboard.ts` (existing) to produce a normalized movement vector and pass it to the controller.
5. Add a small integration story or wire `PlayCanvasShell` into `App.tsx` (dev-only) to manually verify movement and camera follow.
6. Add tests:
   - Unit: `applyMovement` returns expected position deltas for given inputs and dt.
   - Integration: simulate keyboard input and assert the player entity transform changes.
7. Update docs: add a short note in `memory/` design and the task log.

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID  | Description                                      | Status       | Updated     | Notes |
| --- | ----------------------------------------------- | ------------ | ----------- | ----- |
| 2.0 | Create `types/playcanvas-augmentations.d.ts` and update `tsconfig.app.json` `include` | Not Started | - | Adds TS augmentation and runs typecheck |
| 2.1 | Create DES002 (design)                           | Completed    | 2025-11-09  | Design added to `memory/designs` |
| 2.2 | Ensure `PlayCanvasShell` supports `onReady`      | Not Started  | -           | May already exist; verify |
| 2.3 | Add `simpleScene` helper                         | Not Started  | -           | Creates ground/player |
| 2.4 | Implement `ThirdPersonController` system         | Not Started  | -           | Controller+unit test |
| 2.5 | Wire into `App.tsx` / manual validation story    | Not Started  | -           | Dev-only UI entrypoint |
| 2.6 | Add tests (unit + integration)                   | Not Started  | -           | Use Vitest |

## Progress Log

### 2025-11-09

- Created design `DES002` and this task file. Task remains Pending; ready to start implementation when approved.
- 2025-11-09

- Added augmentation + tsconfig step to the task (create `types/playcanvas-augmentations.d.ts`, update `tsconfig.app.json` `include`, run `npm run typecheck`). This makes the TypeScript augmentation explicit and avoids scattered `as any` casts when accessing runtime PlayCanvas properties.
