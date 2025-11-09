# Product Context

## Why this project exists

Nano Drones Commander is an experimental, deterministic voxel + drones simulator that makes it easy to prototype AI, game-play systems, and reproducible simulations in the browser. It provides a small, testable simulation core and a React UI with an embedded 3D view for interactive debugging and observation.

## Problems it solves

- Enables reproducible simulation runs using seed-based world generation and deterministic tick logic.
- Provides a lightweight integration of a 3D scene (PlayCanvas) with a React-based UI for controls, debugging, and replay.
- Offers a developer-friendly structure for iterating on drone AI, ECS-style simulation logic, and deterministic persistence.

## How it should work

- A deterministic simulation core runs the tick/update loop and exposes state via a small store API.
- The PlayCanvas scene is used purely as a renderer/visualiser and subscribes to simulation state (render loop separated from simulation ticks).
- User interaction (orders, camera controls) is sent as explicit commands/messages to the sim core to preserve determinism.
- Game state can be saved and restored from a single source-of-truth save key so runs are reproducible.

## User experience goals

- Fast startup and responsive controls in the browser.
- Clear debug visibility (orders, drone queues, tick counters) via a `DebugPanel` and `DroneList` UI.
- Deterministic replays for testing and verification.
- Low friction for iterating on AI and simulation logic (quick edit → run → reproduce).
