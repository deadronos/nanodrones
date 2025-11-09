# AGENTS.md

## Project Overview

NanoDrones — a small React + TypeScript + Vite app with PlayCanvas for 3D rendering and a deterministic simulation core. State is managed with Zustand; tests use Vitest. This file is a concise agent-focused guide to help automated contributors work effectively in this repo.

## Quick Start / Useful Commands

- **Install:** `npm install`
- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Run tests:** `npm run test`
- **Watch tests:** `npm run test:watch`
- **Coverage:** `npm run test:coverage`
- **Typecheck:** `npm run typecheck`
- **Lint:** `npm run lint`
- **Full check:** `npm run check`

```bash
npm install
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
```

## Key Files / Where To Start

- `src/ecs/engine.ts` — deterministic sim tick (`runSimTick`). Keep sim core pure.
- `src/state/simStore.ts` — fixed-timestep loop and persistence triggers.
- `src/pc/PlayCanvasShell.tsx` — PlayCanvas setup, RAF loop, and mapping sim -> scene.
- `src/state/persistence.ts` — localStorage save/load + migration strategy.
- `@playcanvas/pcui`: Consider using or extending PlayCanvas UI components (`pcui`) for editor-like UI, tool panels, and HUDs. React wrappers are available at `@playcanvas/pcui/react`; import `@playcanvas/pcui/styles` once per app. See `docs/context/context-playcanvas-pcui.md` for a short summary.
- `memory/` — memory bank for specs, designs, and tasks (update when making design/requirement changes).

## Agent Guidance (must-read)

- Read the repository-specific agent guide at: `.github/copilot-instructions.md` — it contains conventions, coding patterns, and important rules (simulation purity, fixed timestep, persistence migrations, memory-bank usage, and testing workflows).
- Follow the Spec-Driven Workflow in `.github/instructions/spec-driven-workflow-v1.instructions.md` when making non-trivial changes.
- When changing persisted shapes, add a migration in `src/state/persistence.ts` and bump the payload `CURRENT_VERSION`.
- Keep `runSimTick(state, ctx)` pure (avoid `Date.now()` / `Math.random()` in the sim core). Use the repo RNG where required.

## Testing & Validation

- Tests: Vitest (run with `npm run test`). Keep tests deterministic and small.
- If adding ESM/CJS packages that break tests, update `vitest.config.ts` `deps.inline` as needed.

## PR Checklist for Agents

- **Tests:** All new behavior has unit tests and `npm run test` passes.
- **Lint/Typecheck:** Run `npm run lint` and `npm run typecheck` locally.
- **Memory / Design:** Add or update `memory/designs/*` and `memory/tasks/*` for design-level changes.
- **Migrations:** If persisted state changes, add migration(s) in `src/state/persistence.ts` and tests for older payloads.

## Notes / Contact

- Keep changes minimal and focused; respect existing public APIs and file structure.
- For ambiguous or high-impact changes, open an issue describing proposed approach before large refactors.

---

Reference: See repository agent guidance at `./.github/copilot-instructions.md` for detailed conventions and patterns.
