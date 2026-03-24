# React-Specific Code Review Rules

Apply these rules during **Layer 2 (Component Design)** and **Layer 3 (State & Data Flow)** when the framework is React.

---

## Hooks Rules (Layer 2 & 3)

- 🔴 **Critical**: Hooks called inside conditions, loops, or nested functions — violates Rules of Hooks.
  ```jsx
  // ❌ Critical
  if (condition) { const [x] = useState(0) }
  ```
- 🔴 **Critical**: Missing dependency array in `useEffect` causing infinite loops.
- 🟡 **Warning**: Missing or incomplete `useEffect` dependency array.
  ```jsx
  // ❌ Warning — `userId` not in deps
  useEffect(() => { fetchUser(userId) }, [])
  
  // ✅ Good
  useEffect(() => { fetchUser(userId) }, [userId])
  ```
- 🟡 **Warning**: Using `useEffect` for synchronous derived state — use `useMemo` instead.
- 🔵 **Suggestion**: Extract multi-purpose `useEffect` blocks into custom hooks.

## Component Design (Layer 2)

- 🟡 **Warning**: Component returning different numbers of hooks conditionally (conditional hook order).
- 🟡 **Warning**: Props not typed (missing PropTypes or TypeScript interface).
- 🟡 **Warning**: Inline function/object definitions passed as props — causes re-renders.
  ```jsx
  // 🟡 Warning — new object on every render
  <Child style={{ color: 'red' }} />
  
  // ✅ Better — extract or memoize
  const style = useMemo(() => ({ color: 'red' }), [])
  ```
- 🔵 **Suggestion**: Components >150 lines should be split into smaller components or use composition.
- 🔵 **Suggestion**: Prefer named exports for components (easier to refactor, better in dev tools).

## State Management (Layer 3)

- 🔴 **Critical**: Directly mutating state object instead of using setter.
  ```jsx
  // ❌ Critical
  state.count = 1
  
  // ✅ Good
  setState(prev => ({ ...prev, count: 1 }))
  ```
- 🟡 **Warning**: Redundant state that can be derived from existing state/props.
- 🟡 **Warning**: `useContext` causing broad re-renders — consider splitting contexts or using `useMemo`.
- 🔵 **Suggestion**: Use `useReducer` when state transitions have complex logic with multiple sub-values.

## Performance (Layer 4)

- 🟡 **Warning**: Large lists rendered without `React.memo` or virtualization.
- 🟡 **Warning**: Missing `useCallback` for functions passed to memoized child components.
- 🟡 **Warning**: Missing `useMemo` for expensive computations called during render.
- 🔵 **Suggestion**: Use `React.lazy` + `Suspense` for code splitting heavy components.
- 🔵 **Suggestion**: Profile with React DevTools before assuming a memoization issue — premature memoization adds complexity.

## Event Handling (Layer 2 & 4)

- 🟡 **Warning**: Not cleaning up subscriptions or timers in `useEffect` return function.
  ```jsx
  // ✅ Always return cleanup
  useEffect(() => {
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  ```
- 🔵 **Suggestion**: Use `useRef` for mutable values that shouldn't trigger re-renders (e.g., timer IDs, previous values).

## JSX (Layer 1 & 2)

- 🔴 **Critical**: `dangerouslySetInnerHTML` used without sanitization → XSS risk.
- 🟡 **Warning**: Missing `key` prop in list renders, or using index as key in dynamic lists.
- 🔵 **Suggestion**: Avoid negation in JSX conditions — prefer ternary or early return patterns.
  ```jsx
  // 🔵 Suggestion
  {!loading && <Component />}
  // ✅ Clearer
  {loading ? null : <Component />}
  ```