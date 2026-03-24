---
name: code-review
description: >
  Performs structured, layered frontend code review for entire files. Use this skill whenever
  the user asks to "review", "check", "audit", or "critique" any frontend code file — even if
  they phrase it casually like "take a look at this", "what do you think of this code", or
  "can you improve this". Supports Vue, React, Nuxt, Next.js, and TypeScript. Always apply
  this skill when a frontend file (.vue, .jsx, .tsx, .ts, .js) is shared for feedback.
  Outputs issues classified as 🔴 Critical / 🟡 Warning / 🔵 Suggestion across 5 review layers.
---

# Frontend Code Review Skill

Perform a **layered, severity-classified** code review on frontend files. Work through all 5 layers in order — do not skip layers. Each issue must be tagged with a severity level.

---

## Step 1: Detect Framework

Before reviewing, identify the framework from file content, extension, or user context:

| Signal | Framework |
|---|---|
| `<template>` + `.vue` | **Vue** |
| `defineNuxtConfig`, `useRoute()`, `useFetch()` | **Nuxt** |
| `JSX/TSX` + `useState`, `useEffect` | **React** |
| `getServerSideProps`, `getStaticProps`, `App Router` | **Next.js** |
| `.ts` extension, explicit type annotations | **+ TypeScript rules** |

→ State the detected framework at the top of your review.
→ Then load the appropriate reference file from `references/`:
- Vue-only → read `references/vue.md`
- React-only → read `references/react.md`
- Nuxt → read `references/vue.md` + `references/nuxt.md`
- Next.js → read `references/react.md` + `references/nextjs.md`
- TypeScript present → also read `references/typescript.md`

---

## Step 2: Run 5-Layer Review

Work through each layer sequentially. For each issue found, output it with a severity badge.

### Severity Definitions

| Badge | Level | Meaning |
|---|---|---|
| 🔴 **Critical** | Must fix | Bug risk, security issue, broken logic, major performance problem |
| 🟡 **Warning** | Should fix | Code smell, maintainability risk, non-idiomatic pattern |
| 🔵 **Suggestion** | Nice to have | Style preference, minor improvement, readability |

---

### Layer 1 — Syntax & Style

Check: naming conventions, formatting consistency, dead code, magic numbers, import order.

- Are variables/functions named clearly (camelCase, PascalCase for components)?
- Any unused imports or variables?
- Magic strings/numbers without constants?
- Overly long functions (>50 lines is a warning, >100 is critical)?

---

### Layer 2 — Component Design

Check: single responsibility, prop design, composability, separation of concerns.

- Does this component do too many things?
- Are props typed and validated?
- Is there logic that should be extracted to a composable/hook?
- Is the template/JSX too complex (>200 lines → critical)?

→ Apply framework-specific rules from the loaded reference file here.

---

### Layer 3 — State & Data Flow

Check: state placement, data flow direction, side effect handling, async patterns.

- Is state kept at the right level (not too global, not duplicated)?
- Are side effects isolated (not inside render/template directly)?
- Are async operations properly handled (loading, error states)?
- Any prop drilling that should use provide/inject or context?

---

### Layer 4 — Performance

Check: unnecessary re-renders, missing memoization, bundle size concerns, lazy loading.

- Any expensive computations not memoized (`computed`, `useMemo`, `useCallback`)?
- Are list items missing stable keys?
- Any synchronous heavy operations blocking the main thread?
- Are large dependencies imported whole vs tree-shaken?

---

### Layer 5 — Security & Maintainability

Check: XSS vectors, sensitive data exposure, accessibility, test coverage hints.

- Any `v-html` / `dangerouslySetInnerHTML` without sanitization? (→ Critical if present)
- Are API keys or secrets hardcoded?
- Missing ARIA labels on interactive elements?
- Are there any obvious missing test cases?

---

## Step 3: Output Format

Structure your review exactly as follows:

```
## 🔍 Code Review — [filename] ([Framework detected])

### Summary
> One paragraph: overall quality, biggest concerns, general tone.

---

### Layer 1 — Syntax & Style
[List issues or ✅ No issues found]

### Layer 2 — Component Design
[List issues or ✅ No issues found]

### Layer 3 — State & Data Flow
[List issues or ✅ No issues found]

### Layer 4 — Performance
[List issues or ✅ No issues found]

### Layer 5 — Security & Maintainability
[List issues or ✅ No issues found]

---

### 📊 Review Scorecard
| Layer | Critical | Warning | Suggestion |
|---|---|---|---|
| L1 Syntax & Style | 0 | 0 | 0 |
| L2 Component Design | 0 | 0 | 0 |
| L3 State & Data Flow | 0 | 0 | 0 |
| L4 Performance | 0 | 0 | 0 |
| L5 Security | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** |

### ✅ Action Items (Priority Order)
1. 🔴 [Most urgent fix]
2. 🔴 ...
3. 🟡 ...
4. 🔵 ...
```

Each issue within a layer should be formatted as:
```
- 🔴 **[Short title]** — Explanation of the problem.
  ```code snippet if helpful```
  💡 Fix: Suggested corrected code or approach.
```

---

## Notes

- Always complete all 5 layers, even if earlier layers have many issues.
- If the file is very large (>500 lines), note this and focus on the most impactful issues per layer.
- Do not rewrite the entire file unless the user asks — focus on targeted feedback.
- If the framework cannot be determined, ask the user before proceeding.