## Phase 1 Complete: Types & Snapshot

Added a canonical `Snapshot` interface and a runtime validator to support future persistence and migration work.

**Files created/changed:**
- `src/state/simTypes.ts` (added `Snapshot` and `validateSnapshotShape`)
- `tests/simTypes.test.ts` (added unit tests for snapshot validator)

**Functions created/changed:**
- `validateSnapshotShape(s: unknown): s is Snapshot` — runtime type guard for persisted snapshots

**Tests created/changed:**
- `tests/simTypes.test.ts` — two tests (valid snapshot, invalid/missing fields)

**Review Status:** APPROVED

**Git Commit Message:**
```
feat: Add Snapshot type and validator

- Add `Snapshot` interface referencing existing `SimState`
- Add runtime `validateSnapshotShape` type guard
- Add unit tests `tests/simTypes.test.ts` for positive/negative cases
```
