# Test Case Document Template

## File Naming Rules

| Source File | test-case.md Path |
|---|---|
| `src/composables/useCounter.ts` | `doc/test/useCounter.test-case.md` |
| `src/components/LoginForm.vue` | `doc/test/LoginForm.test-case.md` |
| `src/stores/user.ts` | `doc/test/user.test-case.md` |
| `src/utils/formatDate.ts` | `doc/test/formatDate.test-case.md` |

Rule: **filename (without path and extension) + `.test-case.md`**

---

## Template

Copy and fill in the following:

```markdown
# Test Cases | {filename}

- **Source file**: `{source file path}`
- **Test framework**: Vitest + Vue Test Utils
- **Created**: {YYYY-MM-DD}
- **Last updated**: {YYYY-MM-DD}

---

## Overview

{One sentence describing the responsibility of this component / function / store}

---

## Test Cases

### ✅ Happy Path

| # | Scenario | Input / Action | Expected Result |
|---|---|---|---|
| H1 | {scenario} | {input or action} | {expected output or behavior} |
| H2 | | | |

### ❌ Edge Cases

| # | Scenario | Input / Action | Expected Result |
|---|---|---|---|
| E1 | {scenario} | {input or action} | {expected output or behavior} |
| E2 | | | |

### 🚨 Error Cases

| # | Scenario | Input / Action | Expected Result |
|---|---|---|---|
| X1 | {scenario} | {input or action} | {expected output or behavior} |
| X2 | | | |

---

## Mock List

> List all external dependencies that need to be mocked in this test

| Dependency | Mock Strategy | Reason |
|---|---|---|
| `fetch` | `vi.stubGlobal` | Prevent real API calls |
| `useRouter` | `vi.mock('vue-router')` | Control routing behavior |

---

## Notes

- {Any special considerations, known limitations, or future improvements}
```

---

## Filled Example: LoginForm.test-case.md

```markdown
# Test Cases | LoginForm

- **Source file**: `src/components/LoginForm.vue`
- **Test framework**: Vitest + Vue Test Utils
- **Created**: 2025-03-29
- **Last updated**: 2025-03-29

---

## Overview

Login form component. The user enters an email and password, submits the form, and the component emits a `submit` event for the parent to handle.

---

## Test Cases

### ✅ Happy Path

| # | Scenario | Input / Action | Expected Result |
|---|---|---|---|
| H1 | Valid email and password submitted | email: `user@example.com`, password: `secret123` | Emits `submit` with `{ email, password }` |
| H2 | Fields should clear after submission | Same as above | Input values reset to empty string |

### ❌ Edge Cases

| # | Scenario | Input / Action | Expected Result |
|---|---|---|---|
| E1 | Both email and password are empty | Click submit directly | Shows "Please fill in all fields" |
| E2 | Email format is invalid | email: `notanemail` | Shows "Invalid email format" |
| E3 | Password is shorter than 6 characters | password: `abc` | Shows "Password must be at least 6 characters" |

### 🚨 Error Cases

| # | Scenario | Input / Action | Expected Result |
|---|---|---|---|
| X1 | (Handled by parent — component does not call API directly) | — | — |

---

## Mock List

| Dependency | Mock Strategy | Reason |
|---|---|---|
| None | — | Pure UI component with no direct external dependencies |

---

## Notes

- If validation logic is extracted to a composable, create a separate `useLoginValidation.test-case.md`
```