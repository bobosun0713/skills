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