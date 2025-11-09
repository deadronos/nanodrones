# Tech Context

## Languages & Frameworks

- TypeScript (strict mode encouraged)
- React + Vite for the front-end shell
- PlayCanvas for in-browser 3D rendering
- PlayCanvas UI (`@playcanvas/pcui`) for UI components and data binding
- Zustand for state management

## Tooling

- Build: `vite`
- Testing: `vitest` (config present in repo)
- Linting / formatting: ESLint / Prettier (repo has `eslint.config.js`)

## Notable Libraries / Patterns

- Lightweight ECS-style sim instead of a full ECS library — keeps control over deterministic behavior.
- Deterministic RNG module (`state/rng.ts`) used across sim to ensure reproducibility.
- PlayCanvas UI (`@playcanvas/pcui`): consider using or extending PCUI components for editor UI, forms, and tool panels. Use `@playcanvas/pcui/react` wrappers for React integration and `@playcanvas/observer` for data binding. Import `@playcanvas/pcui/styles` once near app entry. See `docs/context/context-playcanvas-pcui.md` for a quick reference.

## Run / Dev Commands

- Install: `npm install`
- Dev: `npm run dev`
- Test: `npm test` or `npm run test`
