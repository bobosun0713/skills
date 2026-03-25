# Vue-Specific Code Review Rules

Apply these rules during **Layer 2 (Component Design)** and **Layer 3 (State & Data Flow)** when the framework is Vue (2 or 3).

---

## Options API vs Composition API

- 🟡 **Warning**: Mixing Options API and Composition API in the same component without good reason.
- 🔵 **Suggestion**: Prefer Composition API (`<script setup>`) for new Vue 3 components — it's more type-safe and tree-shakeable.

## Template Rules (Layer 2)

- 🔴 **Critical**: `v-html` used without sanitization → XSS risk. Always sanitize with DOMPurify or similar.
- 🔴 **Critical**: `v-for` without `:key`, or using index as key in dynamic lists.
- 🟡 **Warning**: Complex expressions directly in template (should be moved to `computed`).
- 🟡 **Warning**: `v-if` and `v-for` on the same element — always separate them.
- 🔵 **Suggestion**: Use `v-show` instead of `v-for` + `v-if` for toggling frequently rendered elements.

## Component Design (Layer 2)

- 🟡 **Warning**: Props without type validation or defaults.
  ```vue
  // ❌ Bad
  defineProps(['title'])
  
  // ✅ Good
  defineProps<{ title: string; count?: number }>()
  ```
- 🟡 **Warning**: Emitting events not declared in `defineEmits`.
- 🔵 **Suggestion**: Large components (>200 lines) should be split or use composables.
- 🔵 **Suggestion**: Use `defineExpose` intentionally — avoid exposing internal state unnecessarily.

## State & Reactivity (Layer 3)

- 🔴 **Critical**: Mutating props directly instead of emitting events.
- 🟡 **Warning**: Using `reactive()` for primitive values — use `ref()` instead.
- 🟡 **Warning**: Watching `reactive` objects without `deep: true` when nested changes are expected.
- 🟡 **Warning**: Expensive operations inside `watch` without debounce for high-frequency triggers.
- 🟡 **Warning**: Not cleaning up watchers, intervals, or event listeners in `onUnmounted`.
  ```js
  // ✅ Always cleanup
  onUnmounted(() => clearInterval(timer))
  ```
- 🔵 **Suggestion**: Prefer `watchEffect` over `watch` when dependencies are obvious from usage.
- 🔵 **Suggestion**: Extract reusable stateful logic into composables (`use*.ts` files).

## Performance (Layer 4)

- 🟡 **Warning**: Missing `computed` for derived state that's recalculated in template.
- 🟡 **Warning**: Using `v-for` over large lists without virtual scrolling consideration.
- 🔵 **Suggestion**: Use `shallowRef` / `shallowReactive` for large objects that don't need deep reactivity.
- 🔵 **Suggestion**: Consider `defineAsyncComponent` for heavy child components.

## Pinia / Vuex (Layer 3, if store is present)

- 🟡 **Warning**: Modifying store state directly outside actions (non-Pinia stores).
- 🟡 **Warning**: Storing derived/computed values in the store — use `getters` instead.
- 🔵 **Suggestion**: In Pinia, prefer `storeToRefs()` to destructure reactive state without losing reactivity.

---

## Component Split Triggers (Layer 2)

Split a component if **any** of these conditions is true:

- 🟡 **Warning**: Component owns both data orchestration/state AND substantial presentational markup for multiple sections.
- 🟡 **Warning**: Component has 3+ distinct UI sections (e.g. form, filters, list, footer/status).
- 🟡 **Warning**: A template block is repeated or could become reusable (item rows, cards, list entries).
- 🔴 **Critical**: Full feature implementation placed in a route/page-level view component — keep view components thin (layout, provider wiring, feature composition only).

For CRUD/list features (todo, table, catalog), split at minimum into:
- feature container component
- input/form component
- list (and/or item) component
- footer/actions or filter/status component

## Composables (Layer 2 & 3)

Extract logic into a composable (`useXxx.ts`) when **any** is true:
- 🟡 **Warning**: Same stateful logic is used in 2+ components — should be a composable.
- 🟡 **Warning**: Component has side-effect-heavy logic (timers, subscriptions, fetch) mixed with template — extract to composable.
- 🔵 **Suggestion**: Composable APIs should be small, typed, and accept `MaybeRef` / `MaybeRefOrGetter` for input params to allow reactivity flexibility.
  ```ts
  // ✅ Flexible composable input
  import type { MaybeRefOrGetter } from 'vue'
  function useFeature(id: MaybeRefOrGetter<string>) { ... }
  ```

## v-model with `defineModel` (Layer 2, Vue 3.4+)

- 🔵 **Suggestion**: Use `defineModel()` macro instead of manual `props` + `emit` for two-way binding — cleaner and less boilerplate.
  ```ts
  // ❌ Old pattern (still valid but verbose)
  const props = defineProps<{ modelValue: string }>()
  const emit = defineEmits<{ 'update:modelValue': [string] }>()
  
  // ✅ Vue 3.4+ preferred
  const model = defineModel<string>()
  ```

## Performance Directives (Layer 4)

- 🟡 **Warning**: Large static subtrees inside dynamic lists without `v-once` or `v-memo` — causes unnecessary re-renders.
  ```html
  <!-- ✅ Skip re-render when item.id unchanged -->
  <ListItem v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]" />
  ```
- 🟡 **Warning**: Lists over ~100 items rendered in full DOM without virtual scrolling (e.g. `vue-virtual-scroller` or `tanstack-virtual`) — consider virtualizing.
- 🔵 **Suggestion**: Use `v-once` for truly static content that will never change after first render.

## Advanced Component Patterns (Layer 2, load only when applicable)

Apply these rules only if the pattern appears in the code being reviewed:

- **Slots**: `🟡` Scoped slot data not typed — use `defineComponent` generic or TypeScript slot type annotation.
- **Fallthrough attrs**: `🟡` Wrapper components not using `inheritAttrs: false` + `v-bind="$attrs"` when custom attr forwarding is needed.
- **`<KeepAlive>`**: `🟡` Used without `include`/`exclude` — may cache unintended components and cause stale state.
- **`<Teleport>`**: `🔵` Used without `defer` prop in cases where the target may not exist yet on mount.
- **`<Suspense>`**: `🟡` Async setup component not wrapped in `<Suspense>` — will show empty/broken state without a fallback boundary.