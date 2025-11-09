---
title: React 19.2.0 — Context Summary (Upstash/context7)
generated: 2025-11-09
source: Upstash Context7 (react docs)
---

# React 19.2.0 — API & Migration Summary

This file summarizes the up-to-date API surface and migration notes for React 19.2.0, based on documentation fetched via Upstash Context7. It highlights the most important runtime, rendering, server-side, and TypeScript changes you should know when upgrading or working with React 19.x.

## Major changes (high level)

- createRoot is required for modern mounting and enables concurrent rendering features introduced in React 18 and required by React 19.
- The `use` resource-reading API lets components read Promises and Context values directly inside render and integrates with `Suspense` for loading states.
- New resource preloading APIs live in `react-dom`: `prefetchDNS`, `preconnect`, `preload`, and `preinit`, which surface resource hints from components.
- Server/SSR improvements: streaming APIs such as `renderToReadableStream` are the recommended path for progressive SSR; legacy `renderToString`/`renderToStaticMarkup` remain available for non-streaming scenarios.
- Legacy class-component context APIs (`contextTypes`, `getChildContext`) are removed — migrate to `React.createContext` and the modern Provider API.
- TypeScript updates: element introspection uses `unknown` by default (not `any`), and there are recommended codemods to fix unsound `element.props` access patterns.

## Mounting & unmounting

Replace legacy `ReactDOM.render` and `unmountComponentAtNode` with the new root API:

```js
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
// later
root.unmount();
```

Notes:
- `createRoot` is the entry point for concurrent features.
- When migrating, ensure all roots are created via `createRoot` instead of `ReactDOM.render`.

## The `use` resource-reading API

React 19 introduces `use` which lets components synchronously read resources that may be Promises or context-like resources. When `use` encounters a Promise it will suspend rendering and cooperate with `Suspense` boundaries.

Example (reading a promise):

```jsx
import { use } from 'react';

function Comments({ commentsPromise }) {
  const comments = use(commentsPromise); // suspends until resolved
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}

function Page({ commentsPromise }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}
```

Important behaviors:
- `use` can read Promises and Context values (e.g., `use(ThemeContext)`).
- `use` may be used conditionally in render (works with early returns), which `useContext` cannot.

## Resource preloading APIs (client-side hints)

React 19 adds functions in `react-dom` to surface resource hints from components: `prefetchDNS`, `preconnect`, `preload`, and `preinit`.

Example:

```js
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom';

function MyComponent() {
  preinit('https://cdn.example.com/lib.js', { as: 'script' });
  preload('/fonts/MyFont.woff2', { as: 'font' });
  prefetchDNS('https://api.example.com');
  preconnect('https://api.example.com');
}
```

These APIs typically result in standard `<link>` and `<script>` tags in the document head (e.g., `rel="preload"`, `rel="preconnect"`, etc.) and should be used to optimize initial load and updates.

## Server rendering & streaming

- Use `renderToReadableStream` for streaming server rendering:

```js
const stream = await renderToReadableStream(<App />, options);
// stream can be piped to a response body in modern runtimes
```

- Legacy non-streaming APIs remain:
  - `renderToString` — synchronous full HTML string
  - `renderToStaticMarkup` — static HTML without React hydration attributes

## Context & class components

- Legacy context (`contextTypes`, `getChildContext`) for class components has been removed. Migrate to `React.createContext()`.
- You can now (in React 19) use the Context object itself as a provider shorthand in JSX in some docs, but the canonical pattern remains `Context.Provider` for clarity and compatibility.

Migration example:

```js
// Before (legacy class-based context)
class Parent extends React.Component {
  static childContextTypes = { foo: PropTypes.string };
  getChildContext() { return { foo: 'bar' }; }
  render() { return <Child />; }
}

// After (modern context)
const FooContext = React.createContext();
class Parent extends React.Component {
  render() {
    return (
      <FooContext.Provider value="bar">
        <Child />
      </FooContext.Provider>
    );
  }
}

class Child extends React.Component {
  static contextType = FooContext;
  render() { return <div>{this.context}</div>; }
}
```

## TypeScript & tooling notes

- `ReactElement`'s `props` default to `unknown` (not `any`) in React 19 typings; code that accessed `element.props` unsafely may require fixes.
- Recommended codemod to address `element.props` issues:

```bash
npx types-react-codemod@latest react-element-default-any-props ./path-to-your-ts-files
```

- If you publish compiled libraries that must support older React versions, consider adding `react-compiler-runtime` as a dependency and declare React as a peer dependency (e.g., `^17 || ^18 || ^19`).

## Common migration checklist

1. Replace `ReactDOM.render` with `createRoot` and `root.render`.
2. Replace `unmountComponentAtNode` with `root.unmount()`.
3. Migrate legacy context usage to `createContext`/Provider.
4. Run TypeScript codemods for `element.props` and other breaking typing changes.
5. Audit uses of third-party libs for React 19 compatibility; add `react-compiler-runtime` when necessary.
6. Wrap components that use `use` around `Suspense` boundaries where appropriate.
7. Consider resource preloading usage and test resulting head tags and performance effects.

## Notable API references (short)

- `createRoot(container)` — create a new root for client rendering.
- `root.render(node)` — render into a root.
- `root.unmount()` — unmount a root.
- `use(resource)` — read a Promise or context-like resource (suspends if unresolved).
- `preinit/preload/preconnect/prefetchDNS` — resource hinting from `react-dom`.
- `renderToReadableStream(node, options?)` — obtain a readable stream for streaming SSR.
- `renderToString`, `renderToStaticMarkup` — legacy non-streaming SSR helpers.
- `useSyncExternalStore(subscribe, getSnapshot)` — subscribe to external stores in a stable way.

## Small reference examples

Mounting:

```js
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

Reading a promise with `use`:

```jsx
import { use } from 'react';

function Message({ messagePromise }) {
  const message = use(messagePromise);
  return <p>{message}</p>;
}
```

Resource preinit example:

```js
import { preinit } from 'react-dom';
function App() {
  preinit('https://cdn.example.com/widget.js', { as: 'script' });
  return <div>App</div>;
}
```

## Sources

- React docs and upgrade guides (react.dev) — React 19 blog/upgrade pages and API reference (fetched via Upstash Context7)
- React DOM server reference (`renderToReadableStream`, `renderToString`, `renderToStaticMarkup`)
- React API reference: `use`, `Children`, `cloneElement`, `useSyncExternalStore`

---

If you want a shorter checklist, an inline migration script, or a PR-ready branch with codemods applied to this repo, say the word and I can prepare it next.
