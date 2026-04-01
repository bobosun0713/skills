# Testing Composables

**Impact: High** — Composables that use lifecycle hooks or `inject` must run inside a Vue environment.

## Simple Composables (no lifecycle / inject)

Call directly:

```typescript
import { useCounter } from '@/composables/useCounter'

it('count should increment by 1 after calling increment', () => {
  const { count, increment } = useCounter()
  increment()
  expect(count.value).toBe(1)
})
```

## Composables That Require a Vue Environment

Use a `withSetup` helper:

```typescript
import { createApp } from 'vue'

function withSetup<T>(composable: () => T): [T, ReturnType<typeof createApp>] {
  let result: T
  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    }
  })
  app.mount(document.createElement('div'))
  return [result!, app]
}
```

Usage example:

```typescript
import { useMousePosition } from '@/composables/useMousePosition'

it('should track mouse position', async () => {
  const [result, app] = withSetup(() => useMousePosition())

  window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }))
  await nextTick()

  expect(result.x.value).toBe(100)
  expect(result.y.value).toBe(200)

  app.unmount()  // clean up lifecycle hooks
})
```

## Composables That Depend on Pinia

```typescript
import { setActivePinia, createPinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})

it('should return null user when not logged in', () => {
  const { currentUser } = useAuthComposable()
  expect(currentUser.value).toBeNull()
})
```

## Testing Composable Cleanup (`onUnmounted`)

```typescript
it('should remove event listener after unmount', () => {
  const removeSpy = vi.spyOn(window, 'removeEventListener')
  const [, app] = withSetup(() => useWindowResize())
  app.unmount()
  expect(removeSpy).toHaveBeenCalled()
})
```