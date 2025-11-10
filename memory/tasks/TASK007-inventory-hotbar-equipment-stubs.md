# [TASK007] - Inventory, Hotbar, and Equipment Stubs

**Status:** Completed
**Added:** 2025-11-09
**Updated:** 2025-11-10

## Original Request

Add core inventory, hotbar, and equipment slot structures in sim state and minimal HUD wiring without full gameplay effects.

## Implementation Plan

- Define `ItemId`, `ItemStack`, `InventoryState`, and `HotbarState`.
- Add `PlayerEquipment` with slots: head, chest, legs, boots, leftHand, rightHand, backpack.
- Initialize all equipment slots empty on spawn/reset.
- Implement a minimal hotbar UI bound to sim state.
- Ensure backpack slot is reserved for future extra capacity only.
- Add tests for initialization and basic invariants.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                | Status       | Updated     | Notes |
| --- | ------------------------------------------ | ------------ | ----------- | ----- |
| 7.1 | Implement inventory and hotbar types       | Completed    | 2025-11-10  |       |
| 7.2 | Implement equipment slots on player state  | Completed    | 2025-11-10  |       |
| 7.3 | Initialize empty equipment on spawn/reset  | Completed    | 2025-11-10  |       |
| 7.4 | Add minimal hotbar UI                      | Completed    | 2025-11-10  |       |
| 7.5 | Add tests for state invariants             | Completed    | 2025-11-10  |       |

## Progress Log

2025-11-09
- Task created from DES004 spec.

2025-11-10
- Added inventory/hotbar structures, equipment stubs, the HUD overlay, and baseline invariants/tests.
