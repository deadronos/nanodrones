# PlayCanvas PCUI (pcui & pcui-graph) — Context Summary

**Sources:**

- GitHub: [playcanvas/pcui](https://github.com/playcanvas/pcui)
- NPM: [@playcanvas/pcui](https://www.npmjs.com/package/@playcanvas/pcui)
- Developer manual: [PlayCanvas User Manual — PCUI](https://developer.playcanvas.com/user-manual/pcui/)
- Retrieved: 2025-11-09

## Short overview

`@playcanvas/pcui` is PlayCanvas's lightweight UI component library for web-based tools and editors. It provides a set of DOM-based, styled components (and matching React wrappers) used throughout PlayCanvas tooling. `@playcanvas/pcui-graph` is a separate package built on top of PCUI that offers node-graph primitives (nodes, edges, ports) for visual editors.

This file summarizes the PCUI README, the NPM package listing, and the PlayCanvas user manual to give a concise developer-facing reference.

## Key points (PCUI)

- Purpose: UI primitives and components for building web tools and editors.
- Distribution: published on NPM (current at retrieval: v5.2.4) and maintained in the `playcanvas/pcui` GitHub repo.
- Styling: global styles are provided from `@playcanvas/pcui/styles` — import once per app.
- React: React wrapper components live under `@playcanvas/pcui/react` (Storybook shows examples).
- Data binding: integrates with `@playcanvas/observer` to provide one- and two-way data bindings between components.
- Docs & examples: Storybook, ESM examples, and API docs are available online (links below).

## Getting started

Install the package (the README suggests installing as a dev dependency for development use, or omit `--save-dev` for production installs):

```bash
npm install @playcanvas/pcui --save-dev
```

Basic ESM usage:

```js
import { Label } from '@playcanvas/pcui';
import '@playcanvas/pcui/styles';

const label = new Label({
    text: 'Hello World'
});
document.body.appendChild(label.dom);
```

React wrapper example:

```jsx
import * as React from 'react';
import ReactDOM from 'react-dom';
import { TextInput } from '@playcanvas/pcui/react';
import '@playcanvas/pcui/styles';

ReactDOM.render(<TextInput text="Hello World" />, document.body);
```

## Core concepts

- Components: each component lives in `./src/components` and includes an element implementation (`index.ts`), SASS styles (`style.scss`), a React wrapper (`component.tsx`), and a Storybook story (`component.stories.tsx`).
- Styles: import `@playcanvas/pcui/styles` one time to get base CSS for all components. Individual components also expose their SCSS if you build a custom bundle.
- Data binding: PCUI uses PlayCanvas' `Observer` system. Typical bindings include `BindingObserversToElement`, `BindingElementToObservers`, and `BindingTwoWay`.

Example (Observer binding):

```js
import { Observer } from '@playcanvas/observer';
import { Label, TextInput, BindingObserversToElement, BindingElementToObservers } from '@playcanvas/pcui';
import '@playcanvas/pcui/styles';

const observer = new Observer({ text: 'Hello World' });

const label = new Label({ binding: new BindingObserversToElement() });
label.link(observer, 'text');

const textInput = new TextInput({ binding: new BindingElementToObservers() });
textInput.link(observer, 'text');
```

## Styling & fonts

- PCUI exposes font helper classes: `.font-regular`, `.font-bold`, `.font-thin`, and `.font-light`. By default they use the Helvetica Neue stack. Override them in your global CSS to use a different font family.

Example override:

```css
.font-regular, .font-bold, .font-thin, .font-light {
  font-family: 'Your Custom Font', sans-serif;
}
```

## Build, Storybook & docs

- Storybook: run the local Storybook to explore components and their variations.

```bash
npm install
npm run storybook
```

- API docs: the repository can build API docs via `npm run docs` which outputs to a `docs` folder. Online API reference is at `https://api.playcanvas.com/pcui`.
- UMD bundle: if you need a UMD build (e.g., for editor integrations), follow the repo `BUILDGUIDE.md` for instructions.

## Useful links

- GitHub repository: [playcanvas/pcui](https://github.com/playcanvas/pcui)
- NPM package: [@playcanvas/pcui](https://www.npmjs.com/package/@playcanvas/pcui)
- User manual: [PlayCanvas User Manual — PCUI](https://developer.playcanvas.com/user-manual/pcui/)
- API reference: [PCUI API Reference](https://api.playcanvas.com/pcui)
- ESM examples: [PCUI ESM examples](https://playcanvas.github.io/pcui/examples/)
- React/Storybook examples: [PCUI Storybook](https://playcanvas.github.io/pcui/storybook/)

## Developer notes & recommendations

- Import `@playcanvas/pcui/styles` once near your app entry; components expect the global CSS to exist.
- Prefer the React wrappers (`@playcanvas/pcui/react`) when integrating PCUI into React code to avoid directly manipulating the DOM.
- Use `@playcanvas/observer` for synchronized state between components and UI.
- Run Storybook locally while authoring changes to visualize component states and props.
- When upgrading PCUI, check the `CHANGELOG`/releases for breaking changes; the repo has many releases and semantic versioning is used.

---

*Consolidated from the PCUI README, the NPM package page, and the PlayCanvas user manual (retrieved 2025-11-09).* 
