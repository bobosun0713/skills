# Vue Code Review Rules

Comprehensive rules for Vue 3 projects. Apply all sections relevant to what's present in the code.

**Quick detection guide:**
- Options API (`data()`, `methods`, `this`) → apply [Options API](#options-api) section
- JSX / TSX syntax → apply [JSX](#jsx) section
- Pinia (`defineStore`) → apply [Pinia](#pinia) section
- Vue Router (`useRoute`, `router.beforeEach`) → apply [Vue Router](#vue-router) section
- Test files (`*.spec.ts`, `*.test.ts`) → apply [Testing](#testing) section

---

## Layer 1 — Syntax & Style

- 🟡 **Warning**: Mixing Options API and Composition API in the same component without clear reason.
- 🔵 **Suggestion**: Prefer Composition API (`<script setup lang="ts">`) for new Vue 3 components — more type-safe and tree-shakeable.
- 🟡 **Warning**: `shallowRef` needed for dynamic component refs — regular `ref` triggers reactive component warnings.
- 🟡 **Warning**: Union-typed template expressions — TypeScript can't narrow types in templates; use a computed with explicit narrowing.

---

## Layer 2 — Component Design

### Template Rules
- 🔴 **Critical**: `v-html` used without sanitization → XSS risk. Always sanitize with DOMPurify or similar.
- 🔴 **Critical**: `v-for` without `:key`, or using array index as key in dynamic lists.
- 🟡 **Warning**: `v-if` and `v-for` on the same element — always separate (filter via `computed` first).
- 🟡 **Warning**: Complex expressions directly in template — move to `computed`.
- 🔵 **Suggestion**: Use `v-show` instead of `v-if` for elements toggled frequently.

### Props & Emits
- 🟡 **Warning**: Props without TypeScript type annotation.
  ```ts
  // ❌ defineProps(['title'])
  // ✅ defineProps<{ title: string; count?: number }>()
  ```
- 🟡 **Warning**: Emitting events not declared in `defineEmits`.
- 🔵 **Suggestion**: Use `defineModel()` (Vue 3.4+) for two-way binding instead of manual `modelValue` + `update:modelValue`.
  ```ts
  // ❌ Verbose manual pattern
  const props = defineProps<{ modelValue: string }>()
  const emit = defineEmits<{ 'update:modelValue': [string] }>()
  // ✅ Concise
  const model = defineModel<string>()
  ```
- 🟡 **Warning**: `defineModel` object mutation — mutating a nested property won't emit; must replace the whole object.
- 🟡 **Warning**: `defineModel` default misaligned with parent initial value — can cause divergence; always align.

### Component Split Triggers
Split a component if **any** of these is true:
- 🔴 **Critical**: Full feature implementation in a route/page-level view component — keep view components thin (layout, provider wiring, composition only).
- 🟡 **Warning**: Component owns both data orchestration AND substantial markup for multiple UI sections.
- 🟡 **Warning**: 3+ distinct UI sections (e.g. form, filters, list, footer) — split each into its own component.
- 🟡 **Warning**: Repeated template blocks that could be a reusable component (item rows, cards, list entries).

For CRUD/list features, split at minimum into: feature container → input/form → list/item → footer/actions.

### Composables
Extract into a `useXxx.ts` when **any** is true:
- 🟡 **Warning**: Same stateful logic repeated in 2+ components.
- 🟡 **Warning**: Side-effect-heavy logic (timers, fetch, subscriptions) mixed directly in component setup.
- 🔵 **Suggestion**: Accept `MaybeRefOrGetter<T>` for composable params for reactivity flexibility.
  ```ts
  import type { MaybeRefOrGetter } from 'vue'
  function useFeature(id: MaybeRefOrGetter<string>) { ... }
  ```
- 🔵 **Suggestion**: Use `defineExpose` intentionally — avoid exposing internal state unnecessarily.

### Advanced Patterns (apply only when pattern appears in code)
- 🟡 **Slots**: Scoped slot data not typed; `name` is reserved and won't appear in slot binding; wrapper components must forward slots via `v-bind="$slots"`.
- 🟡 **Fallthrough attrs**: Wrapper not using `inheritAttrs: false` + `v-bind="$attrs"` when custom forwarding is needed.
- 🟡 **`<KeepAlive>`**: Used without `include`/`exclude` — may cache unintended components; template refs reset on deactivation, re-acquire in `onActivated`.
- 🔵 **`<Teleport>`**: Missing `defer` prop when target element may not exist yet on mount.
- 🟡 **`<Suspense>`**: Async setup component not wrapped in `<Suspense>` — will show broken state without a fallback.
- 🟡 **Async components**: `defineAsyncComponent` without `errorComponent` and `onError` — network failures silently leave an empty slot.
- 🔴 **Render functions**: Reusing vnode instances — a vnode must not appear more than once in the same render tree.
- 🟡 **Render functions**: String component names resolved as HTML elements — use `resolveComponent()` or import directly.

### v-model & Form Gotchas
- 🟡 **Warning**: `v-model` ignores HTML `value` attribute — set ref's initial value directly in script.
- 🟡 **Warning**: `<textarea>{{ content }}</textarea>` doesn't work — must use `v-model`.
- 🔴 **Critical (iOS)**: `<select>` with no `v-model` default — first option not selectable on iOS; always initialize the ref to the first option's value.
- 🟡 **Warning**: `v-model` with IME (Chinese/Japanese) — rely on `v-model`, not `:value + @input`, to handle composition correctly.
- 🟡 **Warning**: `v-model.number` on empty input returns `""` not `0` — handle empty string explicitly.
- 🟡 **Warning**: Event modifier order matters — `.prevent.stop` ≠ `.stop.prevent`; apply in intended execution order.
- 🟡 **Warning**: `.passive` and `.prevent` cannot be combined — browser ignores `preventDefault` on passive listeners.

---

## Layer 3 — State & Data Flow

### Reactivity
- 🔴 **Critical**: Destructuring `reactive()` — loses reactivity silently.
  ```ts
  // ❌ const { name } = reactive(user)
  // ✅ const { name } = toRefs(reactive(user))
  ```
- 🔴 **Critical**: Missing `.value` on `ref` in non-template code.
- 🔴 **Critical**: Mutating props directly — always emit events instead.
- 🟡 **Warning**: `ref` inside arrays, Maps, or Sets — not auto-unwrapped; must access `.value` explicitly.
- 🟡 **Warning**: `reactive()` used for primitive values — use `ref()` instead.
- 🟡 **Warning**: Nested `ref` inside `reactive` rendered in template — only top-level refs auto-unwrap; nested ones show `[object Object]`.

### Watchers & Side Effects
- 🟡 **Warning**: `watch(reactiveObj)` without `{ deep: true }` — nested changes won't trigger.
- 🟡 **Warning**: Using `watch` for synchronous derived state — use `computed` instead.
- 🟡 **Warning**: Expensive operations in high-frequency `watch` without debounce.
- 🔵 **Suggestion**: Prefer `watchEffect` over `watch` when dependencies are obvious from usage.

### Lifecycle
- 🔴 **Critical**: DOM / template ref access before `onMounted` — unavailable synchronously in `setup()`.
- 🔴 **Critical**: `provide()` called after `await` — must be called synchronously in setup.
- 🟡 **Warning**: DOM reads returning stale values after state change — wrap in `nextTick()`.
- 🟡 **Warning**: Lifecycle hooks registered after `await` — silently won't run; Vue only registers them during synchronous setup.
- 🟡 **Warning**: Not cleaning up in `onUnmounted` — intervals, event listeners, subscriptions must be removed.
  ```ts
  onUnmounted(() => clearInterval(timer))
  ```
- 🟡 **Warning**: `onMounted` / `onUpdated` run client-side only — SSR code inside them is safe, but be aware they don't run on server.

### Provide / Inject
- 🟡 **Warning**: Provided value not reactive — must be a `ref` or `reactive` for changes to propagate.
- 🟡 **Warning**: `inject` default using object literal — shared reference across consumers; use a factory:
  ```ts
  inject('key', () => ({ count: 0 }), true) // true = factory mode
  ```

---

## Layer 4 — Performance

- 🟡 **Warning**: Missing `computed` for derived state recalculated in template.
- 🟡 **Warning**: Static subtrees in dynamic lists without `v-memo` — causes unnecessary re-renders.
  ```html
  <ListItem v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]" />
  ```
- 🟡 **Warning**: Lists over ~100 items without virtual scrolling (`vue-virtual-scroller`, `@tanstack/vue-virtual`).
- 🟡 **Warning**: Route-level components wrapped in `defineAsyncComponent` — Vue Router already handles lazy loading via `() => import(...)`.
- 🔵 **Suggestion**: `v-once` for truly static content that never changes after first render.
- 🔵 **Suggestion**: `shallowRef` / `shallowReactive` for large objects not needing deep reactivity.

---

## Layer 5 — Security & Maintainability

- 🔴 **Critical**: `v-html` without sanitization (flag here as well as L2 — it's both an XSS and a maintainability risk).
- 🟡 **Warning**: `defineAsyncComponent` without error handling — always add `errorComponent` and `onError`.

---

## Options API

> Apply when component uses `data()`, `methods`, `this` context.

- 🔴 **Critical**: Not wrapping with `defineComponent()` — TypeScript cannot infer `this` type without it.
- 🔴 **Critical**: Multiple mixins with overlapping property names — later mixin silently overwrites earlier one.
- 🟡 **Warning**: Arrow functions in `methods` — loses `this` context.
  ```ts
  // ❌ methods: { fetch: () => { this.data = ... } }
  // ✅ methods: { fetch() { this.data = ... } }
  ```
- 🟡 **Warning**: Complex prop types (arrays/objects) missing `PropType<T>`.
  ```ts
  props: { items: { type: Array as PropType<Item[]>, required: true } }
  ```
- 🟡 **Warning**: `provide` / `inject` not typed — use `InjectionKey<T>` for type safety.
- 🟡 **Warning**: Vue 2 lifecycle names (`beforeDestroy`, `destroyed`) in Vue 3 — renamed to `beforeUnmount` / `unmounted`.
- 🟡 **Warning**: Using a method where `computed` would work — methods recalculate every render; `computed` is cached.
- 🟡 **Warning**: Array mutation via index (`this.items[0] = x`) — use `splice` or reassign the full array.
- 🟡 **Warning**: `computed` with side effects — must be pure; move side effects to `watch`.
- 🟡 **Warning**: Using mixins — implicit dependencies and name conflicts; prefer composables via `setup()`.

---

## JSX

> Apply when component uses JSX / TSX (`.tsx` files, render functions returning JSX).

- 🔴 **Critical**: Missing `@vitejs/plugin-vue-jsx` or `@vue/babel-plugin-jsx` — JSX treated as unknown syntax.
- 🔴 **Critical**: `className` instead of `class` — Vue JSX uses DOM attribute names, not React conventions.
- 🔴 **Critical**: `htmlFor` instead of `for` on `<label>`.
- 🔴 **Critical**: Reusing vnode instances — must not appear more than once in same render tree.
- 🟡 **Warning**: `jsxImportSource` set to `react` — Vue uses a different pragma.
- 🟡 **Warning**: Style prop as string — Vue JSX only accepts objects for style.
- 🟡 **Warning**: Event names not using camelCase `on` prefix (`onClick`, `onMouseenter`).
- 🟡 **Warning**: `v-model` requires manual wiring in JSX:
  ```tsx
  <MyInput modelValue={val.value} onUpdate:modelValue={(v) => (val.value = v)} />
  ```
- 🟡 **Warning**: Multiple root nodes without `Fragment` wrapper.
- 🟡 **Warning**: Named slots need object syntax in JSX:
  ```tsx
  <MyDialog v-slots={{ default: () => <p>Body</p>, footer: () => <button>OK</button> }} />
  ```
- 🔵 **Suggestion**: Array for conditional classes: `class={[base, isActive && 'active']}`.

---

## Pinia

> Apply when `defineStore`, `storeToRefs`, or `useXxxStore()` are present.

- 🔴 **Critical**: Setup store not returning all state — unreturned `ref`/`computed` disappear from DevTools and SSR.
- 🔴 **Critical**: Destructuring store directly — loses reactivity.
  ```ts
  // ❌ const { count } = useCounterStore()
  // ✅ const { count } = storeToRefs(useCounterStore())
  // Actions can be destructured directly without storeToRefs
  ```
- 🟡 **Warning**: Store used before `app.use(pinia)` — common issue in router guards or utility files.
- 🟡 **Warning**: Storing derived values as raw state — use `computed` getters instead.
- 🟡 **Warning**: Storing component-local state in Pinia — only use for cross-component/cross-route shared state.
- 🟡 **Warning**: SSR: not passing the Pinia instance to `useStore(pinia)` — causes state leakage between requests.
- 🔵 **Suggestion**: Prefer Setup Store over Options Store — better TypeScript inference, composable-friendly.
- 🔵 **Suggestion**: Compose stores by calling `useOtherStore()` inside a Setup store, not by importing raw state.
- 🔵 **Suggestion**: Ephemeral UI state (filters, sort order) belongs in URL query params, not Pinia — shareable and survives refresh.
- 🔵 **Suggestion (tests)**: Use `createTestingPinia()` from `@pinia/testing` + `setActivePinia(createPinia())` in `beforeEach`.

---

## Vue Router

> Apply when `useRoute`, `useRouter`, `router.beforeEach`, or `<RouterLink>` are present.

- 🔴 **Critical**: Navigation guard with async call not awaited — guard resolves before data is ready.
  ```ts
  // ❌ router.beforeEach((to) => { fetchUser(to.params.id) })
  // ✅ router.beforeEach(async (to) => { await fetchUser(to.params.id) })
  ```
- 🔴 **Critical**: Infinite redirect loop in guard — always check the current route before redirecting.
- 🔴 **Critical**: `createWebHistory()` without server-side fallback — non-root routes return 404 on direct access or refresh.
- 🟡 **Warning**: Deprecated `next()` callback in Vue Router 4 — return a route location object or `false` instead.
- 🟡 **Warning**: Same-route navigation with different params — `beforeRouteEnter` doesn't re-fire; watch `route.params`.
  ```ts
  watch(() => route.params.id, (id) => fetchData(id), { immediate: true })
  ```
- 🟡 **Warning**: `<a href>` instead of `<RouterLink>` for internal navigation — causes full page reload.
- 🟡 **Warning**: `router.push()` for external URLs — use `window.location.href` or plain `<a>` instead.
- 🟡 **Warning**: Subscriptions/intervals in route components not cleaned up on leave — use `onUnmounted` or `onBeforeRouteLeave`.
- 🔵 **Suggestion**: `createWebHashHistory()` only for static hosting where server config is impossible.

---

## Testing

> Apply when reviewing `*.spec.ts` / `*.test.ts` files, or evaluating testability of component code.

### Strategy
- 🔵 **Suggestion**: Test pyramid — Unit (composables/utils) → Component (Vue Test Utils) → E2E (Playwright).
- 🔵 **Suggestion**: Prefer **Vitest** over Jest — same Vite pipeline, faster in Vue projects.
- 🔵 **Suggestion**: Prefer **Playwright** over Cypress for E2E — better async model, officially recommended by Vue.

### Component Tests
- 🔴 **Critical**: Browser-only APIs (`localStorage`, `IntersectionObserver`) not mocked in jsdom — will throw.
- 🟡 **Warning**: Required plugins (Pinia, Router) not provided to `mount`:
  ```ts
  mount(MyComponent, { global: { plugins: [createTestingPinia(), router] } })
  ```
- 🟡 **Warning**: Testing implementation details (internal refs, method calls) instead of rendered output and emits.
- 🟡 **Warning**: Shallow-mounting everything by default — prefer real integration; only shallow when a child is genuinely heavy.
- 🟡 **Warning**: Not awaiting `nextTick()` after triggering updates — assertions run before DOM flushes.
  ```ts
  await wrapper.find('button').trigger('click')
  await nextTick()
  ```
- 🟡 **Warning**: Async `setup()` or `<Suspense>` not handled — use `flushPromises()` from `@vue/test-utils`.
- 🟡 **Warning**: `<Teleport>` content queried via `wrapper.find()` — teleported DOM is outside the wrapper; use `document.body.querySelector()`.
- 🔵 **Suggestion (Pinia)**: Use `createTestingPinia()` + `setActivePinia(createPinia())` in `beforeEach` to prevent state leakage.

### Testability Smells (in component code)
- 🟡 **Warning**: Hard-coded `setTimeout`/`setInterval` — makes timing tests flaky; isolate so tests can use `vi.useFakeTimers()`.
- 🟡 **Warning**: `window`/`document` accessed directly throughout component — isolate in a composable for easy mocking.
- 🔵 **Suggestion**: Complex component with no `*.spec.ts` — suggest creating one with at minimum a mount smoke test.