# Vitest 4.0.8 — API & Migration Summary

This document is a concise, developer-focused summary of Vitest 4.x API notes and migration highlights (targeting the installed version: 4.0.8). Content was collected from Upstash/Context7 (sources from vitest.dev: blog v4, migration guide, browser guide, API pages).

**Purpose:** Give quick reference for code changes, configuration, browser testing, and notable API additions introduced around Vitest v4 so maintainers can adapt tests and CI in this repo.

---

## At-a-glance

- **Target version:** Vitest 4.0.8 (installed in this project).
- **Primary themes in 4.x:** migration of several config and API options, improved browser testing, new matchers (schema-based), reporter changes, snapshot behavior updates, and worker/pool config simplification.
- **Sources:** vitest.dev blog & guides (migration, browser, coverage, API). See "Sources" at the end for links.

---

## Migration & Breaking/Behavioral Changes (high priority)

- **`test` / `describe` signature changed** — options must be passed before the test callback. Old style (no longer supported):

```ts
// old (deprecated)
test('example', () => { /* ... */ }, { retry: 2 })

// new (correct)
test('example', { retry: 2 }, () => { /* ... */ })
```

- **Pool / worker options simplified** — `poolOptions` and many nested options were replaced by top-level options such as `maxWorkers` and `vmMemoryLimit`.

```ts
export default defineConfig({
  test: {
    // deprecated: poolOptions
    // new:
    maxWorkers: 1,
    vmMemoryLimit: '300Mb',
  }
})
```

- **`test.workspace` → `test.projects`** — monorepo/workspace configuration migrated to `projects` for clearer project scoping.

- **Reporter changes** — the old `basic` reporter is removed; use `default`, `verbose`, `tree`, etc. Example conditional reporter selection for CI:

```ts
export default defineConfig({
  test: {
    reporter: process.env.CI ? 'verbose' : 'default',
  },
})
```

- **Snapshot changes** — shadow DOM content is included in snapshots by default. Use `printShadowRoot: false` to restore previous snapshot output behavior.

---

## New & Notable API Additions

- **`expect.schemaMatching`** — a new asymmetric matcher to validate values against schema validators (Zod, Valibot, ArkType). Example:

```ts
expect(user).toEqual({
  email: expect.schemaMatching(z.string().email()),
})
```

- **`expect.assert`** — runtime type narrowing helper useful with discriminated unions.

```ts
expect.assert(animal.__type === 'Dog')
expect(animal.bark()).toBeUndefined()
```

- **Custom matchers with `expect.extend`** — same pattern as other frameworks:

```ts
expect.extend({
  toBeFoo(received) {
    return { pass: received === 'foo', message: () => `${received} is not foo` }
  }
})
```

- **Snapshot update control** — `enableSnapshotUpdate()` and `resetSnapshotUpdate()` allow programmatic control over snapshot-update mode.

- **Mock & global helpers**
  - `vi.restoreAllMocks()` — restore spies to original implementations.
  - `vi.stubGlobal(name, value)` — stub global variables for tests.
  - Automatic mock cleanup via scoped helpers (example using `using` in docs to auto-restore spies when the scope exits).

---

## Browser Testing (Vitest Browser Mode)

- Vitest expanded browser testing capabilities and providers (Playwright, WebdriverIO, etc.). Providers are added separately (e.g. `@vitest/browser-playwright`).

- **Import `page` & utilities** from `vitest/browser` (simplified import compared to older `@vitest/browser/context`). `page` exposes helpers for viewport, screenshots, locator APIs, extending page, and frame locators.

- **Playwright provider example:**

```ts
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      provider: 'playwright',
      provider: playwright({ launchOptions: { slowMo: 100 } }),
      instances: [ { browser: 'chromium', launch: { slowMo: 100 } } ],
    }
  }
})
```

- **Tracing & Playwright traces** — enable trace generation via `test.browser.trace` or CLI flag (`--browser.trace`). Useful for debugging failed tests.

```ts
export default defineConfig({
  test: { browser: { trace: 'on' } }
})
```

- **Visual regression** — `toMatchScreenshot` is available for visual comparisons in browser tests.

- **Locator helpers** — locators now expose properties like `length`, integrate with `toHaveLength`, and can be extended via `locators.extend` to keep selectors reusable and composable.

---

## Configuration Examples (short)

- **Reporter + workers + memory**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: [['default', { summary: false }]],
    maxWorkers: 2,
    vmMemoryLimit: '400Mb',
  }
})
```

- **Standalone dev runner (package.json script)**

```json
{ "scripts": { "test:dev": "vitest --standalone" } }
```

Start in standalone mode and then run a single test file:

```bash
# start
pnpm run test:dev
# run a specific file against the running standalone instance
pnpm run test:dev math.test.ts
```

---

## Quick Commands & CI notes

- Run tests locally: `npx vitest` or `npm test` / `pnpm vitest` (depending on package manager).
- Standalone mode for incremental testing: `vitest --standalone`.
- Browser tests in CI with Playwright: ensure Playwright browsers are installed in CI: `npx playwright install --with-deps --only-shell` (see workflow examples for GitHub Actions in the sources).
- When updating reporters or pool/workers, verify CI runner resources and concurrency (`maxWorkers`, `vmMemoryLimit`).

---

## Notes / Recommendations for this repo

- Confirm `vitest` entry in `package.json` is `4.0.8` (the summary is targeted to that minor/patch); run `npm ls vitest` or inspect `package.json` to confirm.
- If tests use old `test(name, fn, options)` signatures, update them to `test(name, options, fn)`.
- If this repo uses `poolOptions` or `test.workspace`, migrate to `maxWorkers`/`vmMemoryLimit` and `test.projects` respectively.
- For any browser-based tests (PlayCanvas/Playwright/etc.), prefer the provider-based configuration and verify that CI installs required browser binaries.

---

## Sources (collected via Upstash Context7 from vitest.dev)

- https://vitest.dev/blog/vitest-4  (blog / v4 highlights)
- https://vitest.dev/guide/migration  (migration notes)
- https://vitest.dev/guide/browser  (browser guide & examples)
- https://vitest.dev/guide/coverage  (coverage notes)
- https://vitest.dev/advanced/api/vitest  (snapshot update control)
- https://vitest.dev/api/vi  (vi API helpers)


---

If you want, I can:
- run `npm ls vitest` to confirm the exact installed version in this repo,
- update any failing test signatures or a codemod for `test()` signatures,
- add a short CI checklist to `README.md` for Playwright/browser tests.

