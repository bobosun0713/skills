# Testing Pinia Stores

**Impact: High** — Forgetting to initialize Pinia will throw "injection Symbol(pinia) not found".

## Basic Setup

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

beforeEach(() => {
  setActivePinia(createPinia())  // fresh Pinia instance for every test
})
```

## Testing State

```typescript
it('initial state should be empty', () => {
  const store = useUserStore()
  expect(store.users).toEqual([])
  expect(store.loading).toBe(false)
})
```

## Testing Actions

```typescript
it('should update state after fetchUsers succeeds', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([{ id: 1, name: 'Alice' }])
  }))

  const store = useUserStore()
  await store.fetchUsers()

  expect(store.users).toHaveLength(1)
  expect(store.users[0].name).toBe('Alice')
  expect(store.loading).toBe(false)
})
```

## Testing Getters

```typescript
it('activeUsers getter should return only active users', () => {
  const store = useUserStore()
  store.users = [
    { id: 1, name: 'Alice', active: true },
    { id: 2, name: 'Bob', active: false },
  ]
  expect(store.activeUsers).toHaveLength(1)
  expect(store.activeUsers[0].name).toBe('Alice')
})
```

## Providing Pinia in Component Tests

```typescript
import { createTestingPinia } from '@pinia/testing'

it('should display the user name from the store', () => {
  const wrapper = mount(UserProfile, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            user: { name: 'Alice', id: 1 }
          }
        })
      ]
    }
  })
  expect(wrapper.text()).toContain('Alice')
})
```

## Note

`createTestingPinia` stubs all actions by default. To let actions actually run:

```typescript
createTestingPinia({ stubActions: false })
```