# Tech Context

## Languages & Frameworks

- TypeScript (strict mode encouraged)
- React + Vite for the front-end shell
- PlayCanvas for in-browser 3D rendering

## Tooling

- Build: `vite`
- Testing: `vitest` (config present in repo)
- Linting / formatting: ESLint / Prettier (repo has `eslint.config.js`)

## Notable Libraries / Patterns

- Lightweight ECS-style sim instead of a full ECS library — keeps control over deterministic behavior.
- Deterministic RNG module (`state/rng.ts`) used across sim to ensure reproducibility.

## Run / Dev Commands

- Install: `npm install`
- Dev: `npm run dev`
- Test: `npm test` or `npm run test`
