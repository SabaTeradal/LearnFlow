---
name: Workspace package validation
description: Dependency and typecheck behavior for shared packages in this pnpm workspace
---

Shared libraries that import a peer runtime such as React should also declare that runtime and its type package as development dependencies. Peer dependencies describe consumers, but do not reliably make the module available while the library emits declarations.

**Why:** The workspace's composite TypeScript check failed because the React integration library exposed React hooks but had only a peer dependency, so the library itself could not resolve React or its types.

**How to apply:** When adding source imports to a shared library, keep peer dependencies for consumers and add matching catalog-based dev dependencies for declaration generation and local typechecking.