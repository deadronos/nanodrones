## Phase 1 Complete: Documentation

Phase TL;DR: Added versioned snapshot schema design and updated TASK003 requirements and task file to document the `{ version, createdAt, state }` wrapper, migration contract, and test guidance.

**Files created/changed:**
- `memory/designs/DES003-snapshot-schema-v2.md` (new)
- `memory/requirements.md` (updated)
- `memory/tasks/TASK003-add-sim-state-drones-persistence.md` (updated)

**Functions created/changed:**
- None (documentation-only changes)

**Tests created/changed:**
- None (recommend adding migration-fixture tests; see Recommendations)

**Review Status:** Changes requested (minor editorial items remain: unify terminology in legacy doc, and small editorial cleanups). See review notes in the implementation thread.

**Git Commit Message:**
```
docs: Add snapshot schema & migration docs

- Add `DES003-snapshot-schema-v2.md` (wrapper `{version,createdAt,state}` and migration guidance)
- Update `memory/requirements.md` to require `{version,createdAt,state}` and clear Acceptance criteria
- Update `memory/tasks/TASK003-add-sim-state-drones-persistence.md` with migration contract and notes
```

Notes / Next Steps:
- Run a quick grep for remaining uses of the word "payload" and replace with `snapshot` or `state` to remove ambiguity.
- Add `tests/fixtures/migrations/v1-to-v2.json` and a Vitest that asserts `migrateSnapshot` upgrades it to `CURRENT_VERSION` (recommended follow-up).
- When ready, commit the changes locally and open a PR referencing TASK003 and DES003.
