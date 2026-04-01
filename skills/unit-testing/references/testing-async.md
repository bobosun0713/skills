# Async Testing

**Impact: High** — Missing `await` is the most common cause of flaky tests.

## Golden Rule

Triggering DOM events, waiting for APIs, waiting for nextTick — all require `await`.

## Bad Example ❌

```typescript
it('should show message after click', () => {
  const wrapper = mount(MyComponent)
  wrapper.find('button').trigger('click')  // ❌ missing await
  expect(wrapper.text()).toContain('Success')  // DOM may not have updated yet
})
```

## Good Example ✅

```typescript
import { flushPromises } from '@vue/test-utils'

it('should show message after click', async () => {
  const wrapper = mount(MyComponent)
  await wrapper.find('button').trigger('click')
  await flushPromises()  // wait for all Promises (API calls etc.) to resolve
  expect(wrapper.text()).toContain('Success')
})
```

## When do you need `flushPromises`?

| Situation | Solution |
|---|---|
| Component has `await fetch(...)` inside | `await flushPromises()` |
| Component has async `watch` callback | `await flushPromises()` |
| Just triggering a click that updates DOM | `await trigger('click')` is enough |

## Testing async setup (`await` inside `<script setup>`)

```typescript
it('should display async-loaded data', async () => {
  const wrapper = mount(AsyncComponent, {
    global: {
      stubs: { Suspense: false }
    }
  })
  await flushPromises()
  expect(wrapper.text()).toContain('Loaded')
})
```

## Mocking timers

```typescript
it('should hide toast after 3 seconds', async () => {
  vi.useFakeTimers()
  const wrapper = mount(Toast)
  vi.advanceTimersByTime(3000)
  await nextTick()
  expect(wrapper.find('.toast').exists()).toBe(false)
  vi.useRealTimers()
})
```