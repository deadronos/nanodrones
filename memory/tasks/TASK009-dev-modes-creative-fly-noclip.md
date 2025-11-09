# [TASK009] - Dev Modes: Creative, Fly, and Noclip (Non-Persistent)

**Status:** Pending  
**Added:** 2025-11-09  
**Updated:** 2025-11-09

## Original Request

Wire dev-only creative, fly, and noclip flags into sim state and DevTools UI, ensuring they affect behavior but never persist.

## Implementation Plan

- Add `devCreative`, `devFly`, `devNoclip` to player/sim state as runtime flags.
- Extend movement and block interaction logic to respect dev flags.
- Add controls in `DevToolsPanel` to toggle these flags.
- Ensure persistence explicitly excludes dev flags and they reset to false on load/new sim.
- Add tests verifying non-persistence and behavior toggling.

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID  | Description                               | Status       | Updated     | Notes |
| --- | ----------------------------------------- | ------------ | ----------- | ----- |
| 9.1 | Add dev flags to sim/player state         | Not Started  | 2025-11-09  |       |
| 9.2 | Wire flags into movement & interaction    | Not Started  | 2025-11-09  |       |
| 9.3 | Add DevTools UI toggles                   | Not Started  | 2025-11-09  |       |
| 9.4 | Ensure persistence excludes dev flags     | Not Started  | 2025-11-09  |       |
| 9.5 | Add tests for toggles & non-persistence   | Not Started  | 2025-11-09  |       |

## Progress Log

2025-11-09
- Task created from DES004 spec.
