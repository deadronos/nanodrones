# Requirements (EARS-style)

1. WHEN the app starts, THE SYSTEM SHALL load a deterministic voxel world and initial drones from a seed and save-game (if present).
2. WHEN the user presses movement controls, THE SYSTEM SHALL move the player character in a smooth third-person controller within the PlayCanvas scene.
3. WHEN the user issues a "Mine" order to a drone, THE SYSTEM SHALL enqueue and execute a mine behavior deterministically.
4. WHEN the simulation is paused, THE SYSTEM SHALL halt simulation ticks while keeping rendering and camera orbit responsive.
5. WHEN the app reloads, THE SYSTEM SHALL restore state from `nano-drones-save` and reconcile with the deterministic world seed.
