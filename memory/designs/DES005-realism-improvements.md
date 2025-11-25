# DES005 - Realism Improvements (Physics, RNG, Drones)

**Status:** Draft
**Author:** Copilot
**Created:** 2025-11-25

## Context
The current simulation is functional but simplistic. Movement is instantaneous or linear without inertia, the RNG is a basic LCG, and drones have infinite energy (mostly) and perfect information. The user wants to make the simulation "better/more accurate/realistic".

## Goals
1.  **Physics & Movement**: Implement a simple physics integrator (velocity, acceleration, drag) for smoother, more realistic movement.
2.  **RNG Upgrade**: Replace the simple LCG with a more robust PRNG (e.g., PCG or xoshiro128**) to ensure better statistical properties while maintaining determinism.
3.  **Drone Realism**:
    *   **Battery**: Implement battery drain based on activity (move, mine, idle) and a "return to base" or "shutdown" state when empty.
    *   **Sensors**: (Optional/Future) Limit drone perception range or add noise. For now, focus on battery as the primary constraint.
4.  **World**: (Optional/Future) Improve resource generation.

## Architecture Changes

### 1. RNG (`src/state/rng.ts`)
*   Replace `Rng` class with an implementation of a better algorithm (e.g., Mulberry32 or PCG).
*   Ensure it remains seedable and serializable (if needed, though usually we just save the seed/state).

### 2. Physics (`src/ecs/physics.ts` - New)
*   Introduce `PhysicsComponent` or similar data structure: `{ velocity: Vec3, mass: number, drag: number }`.
*   Update `SimState` entities (Player, Drones) to include physics properties.
*   Create a `physicsSystem(state, dt)` that updates positions based on velocity and applies drag/acceleration.

### 3. Drone Logic (`src/sim/drones.ts`)
*   Update `DroneState` to include `battery` (current/max), `state` (idle, moving, mining, returning, dead).
*   Update `processDroneTick`:
    *   Consume battery on actions.
    *   If battery low, override current task to "return home" (if home exists) or land.
    *   If battery 0, stop functioning.

### 4. Engine (`src/ecs/engine.ts`)
*   Integrate `physicsSystem` into `runSimTick`.
*   Ensure `dt` is used correctly for integration.

## Detailed Design

### RNG
Using Mulberry32 for a good balance of simplicity and quality for JS.

```typescript
export class Rng {
  constructor(seed: number) { ... }
  next(): number { ... } // 0-1
  nextRange(min: number, max: number): number { ... }
}
```

### Physics
Simple Euler integration.

```typescript
interface PhysicsState {
  position: Vec3;
  velocity: Vec3;
  acceleration: Vec3; // cleared each tick? or persistent?
  drag: number;
}

const updatePhysics = (p: PhysicsState, dt: number) => {
  // v = v + a * dt
  // p = p + v * dt
  // apply drag
}
```

### Drone Battery
*   `battery`: number (0-100)
*   `drainRate`: { idle: 0.01, move: 0.1, mine: 0.5 }

## Plan
1.  **RNG**: Upgrade `src/state/rng.ts`.
2.  **Physics**: Add physics types and system. Update Player/Drone to use it.
3.  **Battery**: Add battery logic to `processDroneTick`.
