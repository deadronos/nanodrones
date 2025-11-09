<!--
This file was generated to capture Context7 findings for PlayCanvas
and to collect key API references used by the project.
-->

# PlayCanvas Engine — Context & Findings

Purpose: collect results from Context7 lookups for PlayCanvas, summarize
key points from the engine and the PlayCanvas React wrapper, and point to
primary API references used when integrating PlayCanvas into this repo.

**Context7 lookups**

- Resolved libraries (top matches):
  - **/playcanvas/engine** — PlayCanvas Engine (Trust Score: 9.5, ~40 code snippets)
    - Summary: official PlayCanvas engine repository and documentation.
    - Key content surfaced: install/build/docs commands, example app bootstrap,
      API reference link and examples (create Application, add Entities, start loop).
  - **/playcanvas/react** — PlayCanvas React (Trust Score: 9.5, ~277 code snippets)
    - Summary: React wrapper and component/hook layer for PlayCanvas (components,
      asset hooks, typed component props, examples).

Findings below are condensed from the Context7 lookup results and the
PlayCanvas repositories' docs (engine + react wrapper).

---

## Key findings — PlayCanvas Engine

- PlayCanvas engine focus: advanced WebGL2/WebGPU graphics, animation, physics (ammo.js),
  input, audio, streaming assets (glTF/Draco/Basis), and a scriptable API for game logic.
- Standard developer flow: `npm install`, `npm run build`, `npm run docs`, and run
  the examples browser via `npm run develop` or `npm run serve`.
- Official engine API reference: https://api.playcanvas.com/engine/
- Basic bootstrapping example (from engine examples):

```js
import * as pc from 'playcanvas';
const canvas = document.getElementById('application-canvas');
const app = new pc.Application(canvas, {});
app.start();
```

Notes:
- The engine repo provides runnable examples and scripts to build API docs.
- If you rely on runtime properties not present in current type definitions
  (e.g. legacy `shininess`, or scene-level `gammaCorrection`/`toneMapping`),
  consider augmenting typings or casting to `any` (see TypeScript guidance below).

## Key findings — PlayCanvas React wrapper (@playcanvas/react)

- The React wrapper exposes components such as `Application`, `Entity`, and
  per-component wrappers under `@playcanvas/react/components` (e.g. `Render`, `Camera`, `Light`).
- Asset hooks: `useAsset`, `useModel`, `useTexture`, `useSplat`, and convenience
  helper hooks like `useModel` that return `{ asset, loading, error }`.
- `useMaterial` hook exposes material setters/getters such as `normalMap`,
  `normalDetailMap`, `emissiveIntensity`, and UV-channel setters.
- Example usage patterns identified:

```tsx
import { Entity } from '@playcanvas/react'
import { Render, Collision, RigidBody } from '@playcanvas/react/components'

const Demo = () => (
  <Entity name="Cube">
    <Render type="box" />
    <Collision type="box" />
    <RigidBody type="dynamic" />
  </Entity>
)
```

And a typical asset hook pattern:

```tsx
import { useModel } from '@playcanvas/react/hooks'
const { asset, loading, error } = useModel('model.glb');
```

The react wrapper docs also expose TypeScript-driven prop extraction patterns
(`React.ComponentProps<typeof Application>` etc.), so prop types are usually
discoverable from the installed package.

---

## Requested API references (pinned)

- PlayCanvas Engine API: https://api.playcanvas.com/engine/
- PlayCanvas React docs (site): https://playcanvas-react.vercel.app/docs/api
- Application component: https://playcanvas-react.vercel.app/docs/api/application
- Render / components: https://playcanvas-react.vercel.app/docs/api/components/render
- Entity component: https://playcanvas-react.vercel.app/docs/api/entity
- Asset hook: https://playcanvas-react.vercel.app/docs/api/hooks/use-asset
- Material hook: https://playcanvas-react.vercel.app/docs/api/hooks/use-material

These links are canonical entry points for the engine and the React wrapper
APIs. The Context7 docs included the same references as part of the engine
and wrapper repositories.

---

## TypeScript compatibility & recommended fixes

Problem examples observed in the repo:

- `Property 'shininess' does not exist on type 'StandardMaterial'.`
- `Property 'gammaCorrection' does not exist on type 'Scene'.`
- `Property 'toneMapping' does not exist on type 'Scene'.`

Quick fixes (non-invasive):

- Cast to `any` when you need to access runtime-only properties:

```ts
const mat = material as any;
mat.shininess = 80;

const scene = app.scene as any;
scene.gammaCorrection = 1;
scene.toneMapping = 2;
```

Better fix (type-safe): declaration merging / typing augmentation. Add a
definition file (for example `types/playcanvas-augmentations.d.ts`) and include it
in `tsconfig.json` `include`:

```ts
// types/playcanvas-augmentations.d.ts
declare namespace pc {
  interface StandardMaterial {
    shininess?: number;
  }
  interface Scene {
    gammaCorrection?: number;
    toneMapping?: number;
  }
}
```

This keeps your code typed while acknowledging runtime extensions or
legacy engine properties.

## React ref cleanup warning (common lint rule)

Lint warning example: "The ref value 'droneRefs.current' will likely have changed
by the time this effect cleanup function runs..."

Fix — capture the current ref value inside the effect and use that in cleanup:

```tsx
useEffect(() => {
  const dronesSnapshot = droneRefs.current;
  // attach listeners / do setup using dronesSnapshot

  return () => {
    // cleanup using the captured snapshot (stable reference)
    dronesSnapshot?.forEach(d => {
      // remove listeners / destroy
    });
  };
}, [/* other dependencies (not droneRefs.current) */]);
```

## Recommendations & next steps

- If you need runtime/legacy properties widely in the codebase, prefer adding
  a small `types/` augmentation file so the compiler knows about them.
- Consider aligning the installed `playcanvas` / `@playcanvas/react` versions
  with the docs you used (API surfaces evolve between engine versions).
- Use the `@playcanvas/react` hooks and components where convenient — they
  provide idiomatic React patterns (hooks for assets, typed component props,
  and `useApp` for low-level `pc.Application` access).

If you'd like, I can:

- add the `types/playcanvas-augmentations.d.ts` file to this repo and update
  `tsconfig.json` to include it;
- or create a tiny example component that demonstrates `useModel` + `<Render/>`.

---

Generated: by assistant (Context7 lookups + repository docs)
