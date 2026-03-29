# Mocking External Dependencies

**Impact: High** — Tests should never make real API calls or depend on external systems.

## Mocking `fetch`

```typescript
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('should display data when API succeeds', async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ data: 'hello' })
  } as Response)

  const wrapper = mount(DataComponent)
  await flushPromises()

  expect(wrapper.text()).toContain('hello')
})
```

## Mocking Modules (`vi.mock`)

```typescript
// Declare at the top of the file (gets hoisted automatically)
vi.mock('@/services/authService', () => ({
  login: vi.fn(),
  logout: vi.fn(),
}))

import { login } from '@/services/authService'

it('should redirect after successful login', async () => {
  vi.mocked(login).mockResolvedValueOnce({ token: 'abc123' })
  // ...
})
```

## Mocking Vue Router

```typescript
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: {} }],
})

const wrapper = mount(MyComponent, {
  global: { plugins: [router] }
})

await router.isReady()
```

## Spying (observe without intercepting)

```typescript
it('should call console.error', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  triggerError()
  expect(consoleSpy).toHaveBeenCalledWith('error message')
  consoleSpy.mockRestore()
})
```

## Common `vi.fn()` APIs

```typescript
const mockFn = vi.fn()

mockFn.mockReturnValue(42)              // sync return value
mockFn.mockResolvedValue({ ok: true })  // async return value
mockFn.mockRejectedValue(new Error())   // throw error
mockFn.mockReturnValueOnce(1)           // one-time return value

expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenCalledTimes(3)
```

## Cleaning Up Mocks

```typescript
afterEach(() => {
  vi.clearAllMocks()    // clear call records
  // vi.resetAllMocks()   // clear + reset mock implementations
  // vi.restoreAllMocks() // restore all spies
})
```