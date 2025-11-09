## Phase 2 Complete: Persistence Module & Migrations

Added snapshot-oriented persistence helpers, import/export UX helpers, and unit tests validating roundtrip and file import. Kept existing `saveSim`/`loadSim` migration logic intact and built higher-level `saveSnapshot` / `loadSnapshot` / `migrateSnapshot` wrappers that return a canonical `Snapshot` object.

**Files created/changed:**
- `src/state/persistence.ts` (added `saveSnapshot`, `loadSnapshot`, `migrateSnapshot`, `exportSnapshotFile`, `importSnapshotFile`)
- `tests/persistence.test.ts` (added persistence unit tests: roundtrip, quota handling, file import)

**Functions created/changed:**
- `saveSnapshot(snapshot: Snapshot, key?: string): void`
- `loadSnapshot(key?: string): Snapshot | null`
- `migrateSnapshot(raw: unknown): Snapshot | null`
- `exportSnapshotFile(snapshot: Snapshot, filename?: string): void`
- `importSnapshotFile(file: File): Promise<Snapshot>`

**Tests created/changed:**
- `tests/persistence.test.ts` — three tests (save/load roundtrip, quota-handling, import-from-file)

**Review Status:** APPROVED (local unit tests passed)

**Git Commit Message:**
```
feat: Add snapshot persistence helpers and import/export

- Add `saveSnapshot` / `loadSnapshot` wrappers around existing persistence
- Add `migrateSnapshot` helper
- Add `exportSnapshotFile` and `importSnapshotFile` for file UX
- Add unit tests `tests/persistence.test.ts` for roundtrip and import
```
