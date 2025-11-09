# Progress

## What Works

- Project scaffold and initial architecture document present.
- Requirements (EARS-style) drafted in `requirements.md`.
- Basic task index and `TASK001` added.
- PlayCanvas shell now instantiates a minimal scene, and the deterministic third-person controller is wired through the sim tick.

## What's Left
- Add drone behaviors, order queue, and persistence (TASK003).
- Expand coverage for persistence migrations and order flows.

## Current Status
- Early prototype with a working scene and deterministic controller; focus shifts toward persistence, drones, and broader integration.

## Known Issues / Risks

- Deterministic behavior requires careful avoidance of non-deterministic browser APIs; ensure RNG and state updates are isolated.
- Integration between PlayCanvas render loop and the sim tick may need careful frame-rate decoupling.
