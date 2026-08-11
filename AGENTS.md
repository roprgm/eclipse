# Engineering rules

## Scope

These rules apply to the entire repository.

## Implementation

- Build the smallest complete solution for the current requirement. This project is intentionally extremely minimal.
- Prefer a small direct implementation over extensible architecture. If a request cannot be completed with a clearly small, focused change, stop and ask for confirmation before introducing substantial code, new layers, or complex coordination.
- Do not let implementation complexity grow silently: explain the tradeoff and get approval before a change risks becoming tangled or difficult to maintain.
- Avoid speculative abstractions, configuration, compatibility layers, and unused extension points.
- Remove obsolete code when behavior changes. Preserve backward compatibility only when explicitly required.
- Add a dependency only when it reduces total complexity.

## Structure

- Keep modules focused on one responsibility and one abstraction level.
- Keep dependencies one-way: `app` → `components` → `lib`.
- Put code in the lowest layer that can own it without creating upward dependencies.
- Keep helpers local until they represent a real shared concept or have a second consumer.
- Use the `@/` alias for cross-directory imports; avoid parent-relative imports (`../`).
- Use kebab-case filenames except where the framework requires another name.
- All the comments and code in this repository should be in English.

## TypeScript and React

- Avoid `any`, assertions, and unnecessary explicit annotations.
- Prefer immutable data, guard clauses, linear control flow, and `const`.
- Keep one source of truth. Derive values instead of synchronizing duplicate state.
- Use effects only to synchronize with external systems.
- Keep side effects and external-data validation at explicit boundaries.
- Do not add memoization or abstractions without a demonstrated need.

## UI

- Make loading, empty, error, disabled, keyboard, and reduced-motion behavior intentional.
- Do not share Tailwind class lists through constants or style-only TypeScript modules. Compose styles through reusable React components instead.
- For conditional classes, call `cn` inline with boolean conditions. Do not assign class names to local constants or select class strings with ternaries.
- When a genuinely low-level visual primitive must be shared without a component, define it in CSS with Tailwind's layer system. Reserve this for effects such as fades, shadows, or shimmers, not component styling or layout.

## React Three Fiber

- Model scene objects, controls, and optional features as declarative React Three Fiber components whenever practical; use mounting and unmounting to enable or disable them.
- Design scene features as self-contained components that can be enabled or disabled by mounting or unmounting them, rather than by coordinating imperative setup and teardown across the scene.
- Keep each scene concern in a focused component. For example, put camera behavior in a dedicated `camera-controls` component and compose it into the scene instead of placing camera-control logic inline.
- Use imperative Three.js code only when React Three Fiber cannot express the behavior cleanly. Encapsulate necessary imperative work inside the component that owns it rather than spreading it across the scene.
- Treat performance as a priority: target 120 FPS, and precompute or cache expensive GPU and CPU work when possible instead of repeating it every frame.
