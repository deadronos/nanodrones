# Active Context

## Current Focus

- Bootstrapping repository structure and core modules (sim core, voxel generator, PlayCanvas integration).
- Implement the basic third-person controller and the minimal drone order system.

## Recent Changes

- Initial architecture doc (`DES001-initial-architecture.md`) added.
- Basic requirement set created in `requirements.md` (EARS-style requirements).
- `TASK001` created for project bootstrapping.

## Next Steps

1. Implement an embedded PlayCanvas shell and a simple scene.
2. Wire up a deterministic tick loop and minimal sim store (`simStore.ts`).
3. Add save/load persistence and a simple drone order queue.
4. Add unit tests for the sim core and deterministic RNG.

## Active Decisions

- Determinism will be enforced via a seed-based RNG (`state/rng.ts`) and by keeping simulation updates pure/functional where possible.
- Use PlayCanvas (existing code references) for the 3D view rather than introducing a new rendering stack.
