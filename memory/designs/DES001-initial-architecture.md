# DES001 - Initial Architecture

High-level architecture for Nano Drones Commander following idea.md.

- React shell + UI
- PlayCanvas scene via @playcanvas/react
- Deterministic sim core (tick loop, ECS-ish state) in /src/state and /src/ecs
- Voxel world module under /src/voxel
- Nano drone AI in /src/ai
