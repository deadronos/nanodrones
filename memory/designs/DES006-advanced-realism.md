# DES006 - Advanced Realism (Resources, Charging, Sensors)

**Status:** Draft
**Author:** Copilot
**Created:** 2025-11-25

## Context
Following DES005 (Physics, RNG, Battery), we want to further improve realism by making resource distribution more natural, adding a way for drones to recharge, and limiting their perception.

## Goals
1.  **Natural Resources**: Use Perlin noise for resource placement to create veins/clusters rather than random scatter.
2.  **Charging Mechanics**: Introduce a "Base" block where drones can recharge. Drones should seek this base when low on battery.
3.  **Sensors**: Limit drone perception to a specific range, requiring them to be near resources to "see" them (or at least assign orders to them).

## Architecture Changes

### 1. Noise (`src/utils/noise.ts`)
*   Implement a simple 2D Perlin noise function.

### 2. World Generation (`src/voxel/generator.ts`)
*   Use noise for resource placement.
*   Place a "Base" block at the world origin (0, Y, 0).

### 3. Types (`src/state/simTypes.ts`)
*   Add `base` to `BlockId`.
*   Add `sensorRange` to `DroneState`.

### 4. Drone Logic (`src/sim/drones.ts`)
*   **Low Battery Behavior**: If battery < threshold (e.g., 0.2), override current task to find nearest "Base" block.
*   **Charging**: When at base, increase battery over time.

### 5. Engine (`src/ecs/engine.ts`)
*   **Sensor Range**: Update `findNearestResource` to only return resources within `drone.sensorRange` (or a global max range if assigning from a central "hive mind" perspective, but for now let's assume the *player* assigns orders based on *their* view, but maybe drones can only *accept* orders if they are close? Or maybe `findNearestResource` is used by the system to auto-assign. Let's stick to: `findNearestResource` respects a range).

## Detailed Design

### Perlin Noise
Standard implementation.

### Charging Logic
In `processDroneTick`:
1. Check battery.
2. If low, scan for `base` block (need a `findNearestBlock` helper).
3. If found, move to it.
4. If at base, `activity = 'charging'`, `battery += rate`.
5. If full, resume idle/previous task.

### Base Block
New block type `base`.
Visuals: distinct color (e.g., blue/cyan).

## Plan
1.  Implement Noise.
2.  Update Generator (Resources + Base).
3.  Update Types.
4.  Update Drone Logic (Charging).
5.  Update Engine (Sensors).
