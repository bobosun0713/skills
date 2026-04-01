---
name: unit-testing
description: "Unit testing best practices, workflows, and common pitfalls. Use this skill whenever the user wants to write, generate, fix, or improve unit tests. Triggers include: write tests, unit test, test coverage, how to test, how to mock, tests keep failing, how to test a composable / service / function, or any task involving Vitest, Jest, Vue Test Utils, or testing-library. Even if the user simply says help me test this code, this skill must be triggered. Always generate a test-case.md in doc/test/ before writing any test code."
---

# Unit Testing Skill

Best practices, workflows, and common pitfalls for Vue 3 / TypeScript / Vitest projects.

## Core Principles

- **Black-box testing**: Test behavior (output/events/DOM), not implementation details (internal variables, private methods)
- **AAA structure**: Every test follows Arrange → Act → Assert
- **Single responsibility**: One `it()` verifies one thing only
- **Readability first**: Test names should clearly state "given what condition, expect what result"

---

## Quick Reference Index

| Scenario | Reference File |
|---|---|
| **Generate test-case.md document** | [→ test-case-template.md](reference/test-case-template.md) |
| Project test environment setup (Vitest + Vue Test Utils) | [→ testing-setup.md](reference/testing-setup.md) |
| Tests keep breaking after refactoring | [→ testing-blackbox.md](reference/testing-blackbox.md) |
| Async tests / race conditions | [→ testing-async.md](reference/testing-async.md) |
| How to test Composables | [→ testing-composables.md](reference/testing-composables.md) |
| How to test Pinia Stores | [→ testing-pinia.md](reference/testing-pinia.md) |
| How to mock APIs / external dependencies | [→ testing-mocking.md](reference/testing-mocking.md) |
| How to test Vue components | [→ testing-components.md](reference/testing-components.md) |

---

## Workflow (follow in order for every testing task)

> ⚠️ **Mandatory rule**: Always complete Step 1 and Step 2 — generating `test-case.md` — before writing any test code.

### Step 1: Understand the subject under test

Read the source code and identify:
- Is this a function, composable, component, or store?
- What are the inputs? What are the side effects (API calls, emits, route navigation)?
- What are the "observable outputs" (return values, DOM changes, emitted events)?

### Step 2: Generate test-case.md ⬅️ Always do this first

**Before writing any test code**, create the document following these rules:

- Path: `doc/test/{filename}.test-case.md`
  - Example: `src/composables/useCounter.ts` → `doc/test/useCounter.test-case.md`
  - Example: `src/components/LoginForm.vue` → `doc/test/LoginForm.test-case.md`
- Format: follow [→ test-case-template.md](reference/test-case-template.md)

After creating it, inform the user: "Test case list created at `doc/test/xxx.test-case.md` — please review before I proceed to write the tests."

### Step 3: Write the tests

Use the AAA structure:

```typescript
it('should remove the item from the list when the user clicks delete', async () => {
  // Arrange
  const wrapper = mount(TodoList, {
    props: { items: [{ id: 1, text: 'Buy milk' }] }
  })

  // Act
  await wrapper.find('[data-testid="delete-btn"]').trigger('click')

  // Assert
  expect(wrapper.findAll('[data-testid="todo-item"]')).toHaveLength(0)
})
```

### Step 4: Run and verify

```bash
npx vitest run          # single run
npx vitest              # watch mode
npx vitest --coverage   # with coverage report
```

---

## Naming Conventions

```
describe('ComponentName / functionName', () => {
  it('should [expected result] when [condition]', () => { ... })
  it('when [scenario], should [result]', () => { ... })
})
```

❌ Avoid: `it('works')` / `it('test 1')`
✅ Prefer: `it('should show an error message when the input is empty')`

---

## Selector Priority

1. `data-testid="xxx"` — most stable, unaffected by style refactoring
2. ARIA role (`getByRole('button')`) — accessibility-friendly
3. Text content (`getByText`) — suitable for static text
4. ❌ CSS class — least stable, avoid

---

## References

- [Vitest Docs](https://vitest.dev/)
- [Vue Test Utils Docs](https://test-utils.vuejs.org/)
- [Pinia Testing Guide](https://pinia.vuejs.org/cookbook/testing.html)
