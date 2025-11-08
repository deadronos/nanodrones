
# Project Idea: Nano Drones Commander (React + PlayCanvas)

## Goal
Create a production-ready React + Vite + TypeScript project that embeds a PlayCanvas 3D scene (via `playcanvas-react`) for a 3rd-person, Minecraft-style voxel world.  
The player controls a character and commands “nano drones” that can execute explicit orders or act autonomously via behavior trees/GOAP. The simulation must be deterministic and testable.

## Tech Stack & Constraints
- Package manager: **npm**.
- Build tooling: **Vite**, **TypeScript**, **ESLint**, **Prettier**, **Vitest**, **Playwright**.
- No Husky or lint-staged.
- UI: **React 19.2**, **Tailwind CSS**, optional **shadcn/ui** for debug panels.
- 3D Engine: **PlayCanvas** via `playcanvas-react`.
- State: **Zustand** with deterministic sim tick and offline catch-up.
- Persistence: LocalStorage (`nano-drones-save`) with versioned migrations.
- Style: Clean, modular, commented; deterministic before pretty.

## Directory Structure
```
/src
  /app
  /pc
  /ecs
  /state
  /ai
  /input
  /controls
  /voxel
  /utils
  /ui
  /tests
  /e2e
/specify
```

### Key Highlights
- **PlayCanvas React Integration** via `<PlayCanvasApp />`.
- **Third-Person Controller:** WASD + mouse orbit, smooth camera rig.
- **Voxel World:** Seeded generator, chunk system, greedy meshing.
- **Nano Drones:** Behavior-tree AI (mine, carry, build, recharge).
- **Simulation Loop:** Fixed step, deterministic RNG, ECS-based.
- **Persistence:** Versioned, additive/idempotent migrations.
- **UI:** Debug panel, drone list, and order radial menu.

## NPM Scripts
- `dev`: start Vite dev server
- `build`: Vite production build
- `preview`: preview build
- `lint`: ESLint
- `format`: Prettier write
- `typecheck`: `tsc --noEmit`
- `test`: Vitest
- `e2e`: Playwright
- `check`: run all static checks

## Acceptance Criteria
- `npm install && npm run dev` boots a scene with ground, player, 1–3 drones.
- Player moves, camera orbits, and drones can receive a “Mine” order.
- Pausing sim freezes logic but not render.
- Reloading restores deterministic world from seed and save.
- All unit and e2e tests pass.

## Stretch Goals
- Chest/inventory system (drone hauling loop).
- Minimap overlay (orthographic chunk projection).
- Simple post-processing and day/night cycle.

---
**Project Codename:** _Nano Drones Commander_  
**Keywords:** voxel, deterministic, ECS, drone AI, PlayCanvas, React 19.2, TypeScript, Vite
