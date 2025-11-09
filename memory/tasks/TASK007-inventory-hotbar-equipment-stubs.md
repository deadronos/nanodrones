# [TASK007] - Inventory, Hotbar, and Equipment Stubs

**Status:** Pending  
**Added:** 2025-11-09  
**Updated:** 2025-11-09

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

**Overall Status:** Not Started - 0%

### Subtasks

| ID  | Description                                | Status       | Updated     | Notes |
| --- | ------------------------------------------ | ------------ | ----------- | ----- |
| 7.1 | Implement inventory and hotbar types       | Not Started  | 2025-11-09  |       |
| 7.2 | Implement equipment slots on player state  | Not Started  | 2025-11-09  |       |
| 7.3 | Initialize empty equipment on spawn/reset  | Not Started  | 2025-11-09  |       |
| 7.4 | Add minimal hotbar UI                      | Not Started  | 2025-11-09  |       |
| 7.5 | Add tests for state invariants             | Not Started  | 2025-11-09  |       |

## Progress Log

2025-11-09
- Task created from DES004 spec.
