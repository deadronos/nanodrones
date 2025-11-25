# Realism Updates - November 25, 2025

This document details the recent improvements made to the Nano Drones simulation to increase realism, accuracy, and depth.

## 1. Physics System
We have introduced a lightweight physics engine to replace the previous instantaneous movement logic.

- **Integration**: Uses semi-implicit Euler integration.
- **Components**: Entities now track `position`, `velocity`, `acceleration`, and `drag`.
- **Inertia**: Objects (Player, Drones) now accelerate and decelerate naturally rather than stopping instantly.
- **Implementation**: Located in `src/ecs/systems/physics.ts`.

## 2. RNG Upgrade
The Random Number Generator has been upgraded from a simple Linear Congruential Generator (LCG) to **Mulberry32**.

- **Why**: Better statistical properties and distribution while maintaining 100% determinism.
- **Usage**: Used for world generation and simulation events.
- **Implementation**: `src/state/rng.ts`.

## 3. Drone Realism
Drones are no longer infinite-energy machines with perfect knowledge.

### Battery & Charging
- **Battery Life**: Drones have a battery level (0.0 to 1.0).
- **Drain Rates**:
  - **Idle**: Low drain.
  - **Moving**: Medium drain.
  - **Mining**: High drain.
- **Charging**: A new **Base Block** (cyan) is generated at the world origin. Drones will automatically seek this base when their battery is low (< 20%) or when carrying resources.
- **Failure State**: If a drone's battery reaches 0 away from the base, it shuts down and becomes unresponsive.

### Sensors
- **Sensor Range**: Drones have a limited `sensorRange` (default: 10 units).
- **Behavior**: Drones can only be assigned orders to resources that are within their sensor range.

## 4. World Generation
- **Perlin Noise**: Resource veins are now generated using 2D Perlin noise (`src/utils/noise.ts`) instead of random scatter. This creates more natural-looking ore clusters.
- **Base Station**: A base station block is guaranteed to generate at `(0, Y, 0)` to serve as a charging point.

## 5. Developer Notes
- **Tests**: Unit tests in `tests/simEngine.test.ts` and `tests/drone.test.ts` have been updated to account for physics inertia (checking for movement > 0 rather than exact distance) and sensor constraints.
- **Configuration**: Constants for battery drain, speed, and drag are located in `src/sim/drones.ts`.
