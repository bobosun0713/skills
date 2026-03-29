# Black-box Testing

**Impact: High** — Testing implementation details makes refactoring extremely painful.

## Core Principle

Test "externally observable behavior", not internal implementation.

## Bad Example ❌

```typescript
// Directly accessing internal component data → will break after any refactor
it('should update internal counter', () => {
  const wrapper = mount(Counter)
  wrapper.vm.count = 5  // ❌ directly mutating internal state
  expect(wrapper.vm.count).toBe(5)
})
```

## Good Example ✅

```typescript
// Test what the user actually sees
it('should increment the counter when clicked', async () => {
  const wrapper = mount(Counter)
  await wrapper.find('[data-testid="increment"]').trigger('click')
  expect(wrapper.find('[data-testid="count"]').text()).toBe('1')
})
```

## What counts as "observable behavior"?

| Type | Example |
|---|---|
| DOM output | `wrapper.text()`, `wrapper.find(...)` |
| Emitted events | `wrapper.emitted('update:modelValue')` |
| Function return values | `expect(formatDate('2024-01-01')).toBe('2024/01/01')` |
| API call count / args | `expect(mockFn).toHaveBeenCalledWith(...)` |

## What NOT to test?

- `wrapper.vm.internalMethod()`
- Internal `ref` or `reactive` values (unless exposed via props/emit)
- CSS class application logic (unless it directly affects user interaction)