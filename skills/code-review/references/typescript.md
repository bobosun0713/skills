# TypeScript-Specific Code Review Rules

Apply these rules **in addition to** the framework reference file whenever TypeScript is present.

---

## Type Safety (Layer 1 & 2)

- 🔴 **Critical**: Using `any` type explicitly — defeats TypeScript's purpose.
  ```ts
  // ❌ Critical
  const data: any = await fetchData()
  
  // ✅ Good
  const data: UserResponse = await fetchData()
  ```
- 🔴 **Critical**: Type assertions (`as X`) used to silence errors without actual type narrowing.
  ```ts
  // ❌ Critical — hiding a real type problem
  const user = response as User
  
  // ✅ Good — proper narrowing
  if (isUser(response)) { const user = response }
  ```
- 🟡 **Warning**: Using `// @ts-ignore` or `// @ts-expect-error` without an explanatory comment.
- 🟡 **Warning**: Non-null assertions (`!`) used without a clear reason.
  ```ts
  // 🟡 Warning — may crash if null
  const name = user!.name
  ```
- 🔵 **Suggestion**: Enable and respect `strict: true` mode in `tsconfig.json`.

## Interface & Type Design (Layer 2)

- 🟡 **Warning**: Duplicated type definitions across files — extract to a shared `types/` directory.
- 🟡 **Warning**: Using `object` or `{}` as a type — too broad, use a specific interface.
- 🔵 **Suggestion**: Prefer `interface` for object shapes (extendable) and `type` for unions/intersections.
- 🔵 **Suggestion**: Use `Readonly<T>` for props/configs that shouldn't be mutated.

## Generics (Layer 2)

- 🟡 **Warning**: Overly complex generics that reduce readability — consider splitting or adding type aliases.
- 🔵 **Suggestion**: Use generic constraints (`T extends SomeType`) instead of casting inside generic functions.

## Enum & Constants (Layer 1)

- 🟡 **Warning**: Numeric enums without explicit values — fragile if order changes.
  ```ts
  // 🟡 Warning
  enum Status { Active, Inactive } // Active = 0, Inactive = 1
  
  // ✅ Better
  enum Status { Active = 'ACTIVE', Inactive = 'INACTIVE' }
  // or use const object
  const STATUS = { Active: 'ACTIVE', Inactive: 'INACTIVE' } as const
  ```
- 🔵 **Suggestion**: Prefer `as const` objects over enums for simpler serialization and tree-shaking.

## Return Types & Function Signatures (Layer 1)

- 🟡 **Warning**: Public/exported functions without explicit return types — harder to detect breaking changes.
- 🔵 **Suggestion**: Use `Promise<void>` explicitly for async functions that don't return values, instead of relying on inference.

## API & External Data (Layer 3 & 5)

- 🔴 **Critical**: Trusting external API responses without runtime validation — use `zod` or similar.
  ```ts
  // ✅ Validate at runtime boundary
  const schema = z.object({ id: z.string(), name: z.string() })
  const user = schema.parse(await response.json())
  ```
- 🟡 **Warning**: Spreading untyped external data into typed objects — bypasses type safety.