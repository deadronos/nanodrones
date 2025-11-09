# Progress

## What Works

- Project scaffold and initial architecture document present.
- Requirements (EARS-style) drafted in `requirements.md`.
- Basic task index and `TASK001` added.

## What's Left

- Implement PlayCanvas shell and simple scene.
- Wire deterministic sim tick loop and sim store.
- Add drone behaviors, order queue, and persistence.
- Add unit/integration tests for sim core and persistence.

## Current Status

- Early prototype / bootstrap phase. Core design and requirements defined; implementation work beginning.

## Known Issues / Risks

- Deterministic behavior requires careful avoidance of non-deterministic browser APIs; ensure RNG and state updates are isolated.
- Integration between PlayCanvas render loop and the sim tick may need careful frame-rate decoupling.
