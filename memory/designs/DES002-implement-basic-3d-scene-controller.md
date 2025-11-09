# DES002 - Basic 3D Scene & Controller

## Goal

Provide a minimal embedded PlayCanvas scene and a basic third-person movement controller so the app has a working 3D visualisation and the user can move a player entity. This supports verification of requirement #2 and provides a baseline scene for future AI/drone visualization.

## Scope

- Mount a PlayCanvas application inside the React shell (`src/pc/PlayCanvasShell.tsx` - reuse or extend existing component).
- Programmatically create a simple scene on startup: ground plane, ambient + directional light, and a box/sphere representing the player.
- Implement a deterministic, simple `ThirdPersonController` system that consumes keyboard input and updates the player transform.
- Expose `onReady` from the `PlayCanvasShell` to enable test/automation hooks and to allow the sim to attach transforms.

## Interfaces / Files

- `src/pc/PlayCanvasShell.tsx` — React component that mounts the PlayCanvas `pc.Application`. Props:
  - `onReady?: (app: pc.Application) => void` — called when engine is initialised.
  - `pixelRatio?: number` — optional override.
- `src/pc/scene/simpleScene.ts` — helper that creates ground, lights, and a player entity.
- `src/ecs/systems/thirdPersonController.ts` — pure-ish system that applies movement deltas to a transform.
- `src/controls/useKeyboard.ts` — existing input hook; use it to produce move vectors or commands.

## Data Flow

- UI/Input -> `useKeyboard` (hook) -> Movement command (structure) -> consumed by `ThirdPersonController` during sim tick -> player transform updated -> PlayCanvas render reads transform and draws.

## Acceptance Criteria (testable)

- When arrow keys or WASD are pressed, the player entity visibly moves in the PlayCanvas canvas (smooth movement at a fixed speed).
- Camera can orbit or follow the player using `useOrbitCamera` without breaking sim determinism.
- Rendering remains responsive if the sim tick is paused (render loop decoupled from simulation ticks).

## Implementation Notes & Constraints

- Keep controller logic deterministic and avoid browser-dependent randomness.
- Controller should accept a fixed delta-time parameter so movement is stable across frame rates.
- Keep visual assets minimal (simple primitives + colours) to avoid the need for external downloads.

## Tasks (high level)

1. Ensure `PlayCanvasShell` supports an `onReady` hook and clean mount/unmount semantics.
2. Add `simpleScene` helper to instantiate ground, light, and player entity.
3. Implement `ThirdPersonController` system and connect to `useKeyboard`.
4. Wire the shell into `App.tsx` (or a story) for manual validation.
5. Add unit test(s) for the controller logic (pure function) and a small integration test to observe transform change.
