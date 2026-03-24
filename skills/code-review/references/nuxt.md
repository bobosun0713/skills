# Nuxt-Specific Code Review Rules

Apply **in addition to** `vue.md` when the framework is **Nuxt 3**.

---

## Data Fetching (Layer 3)

- 🔴 **Critical**: Using `fetch()` or `axios` directly in `<script setup>` without `useFetch` / `useAsyncData` — breaks SSR hydration.
  ```js
  // ❌ Critical — won't hydrate correctly on client
  const data = await fetch('/api/items')
  
  // ✅ Good
  const { data } = await useFetch('/api/items')
  ```
- 🟡 **Warning**: Not handling `pending` and `error` states from `useFetch` / `useAsyncData`.
- 🟡 **Warning**: Fetching the same data in multiple components — consider a shared composable or store.
- 🔵 **Suggestion**: Use `$fetch` (oFetch) for client-only calls; use `useFetch` for universal (SSR+CSR) calls.

## Routing & Pages (Layer 2)

- 🟡 **Warning**: Using `<a href>` instead of `<NuxtLink>` — breaks client-side navigation and prefetching.
- 🟡 **Warning**: Heavy logic placed directly in page components — extract to composables.
- 🔵 **Suggestion**: Use `definePageMeta` for route-level middleware, layout, and auth guards instead of inline logic.
  ```js
  definePageMeta({
    middleware: 'auth',
    layout: 'dashboard'
  })
  ```

## SSR Awareness (Layer 3 & 5)

- 🔴 **Critical**: Accessing `window`, `document`, or `localStorage` outside `onMounted` / `process.client` guards — will crash on server.
  ```js
  // ❌ Critical
  const stored = localStorage.getItem('token')
  
  // ✅ Good
  onMounted(() => { stored = localStorage.getItem('token') })
  // or
  if (process.client) { ... }
  ```
- 🟡 **Warning**: Secrets or private API keys referenced in `useRuntimeConfig()` public namespace.

## Composables & Auto-imports (Layer 2)

- 🟡 **Warning**: Manually importing Vue/Nuxt composables that are already auto-imported — unnecessary noise.
- 🔵 **Suggestion**: Place shared composables in `composables/` for auto-import instead of deep relative imports.

## Server Routes (Layer 5)

- 🔴 **Critical**: Missing input validation in `server/api/` routes.
- 🟡 **Warning**: Not using `defineEventHandler` wrapper — missing error handling context.
- 🔵 **Suggestion**: Use `H3` utility helpers (`readBody`, `getQuery`) instead of raw `event.node.req` parsing.