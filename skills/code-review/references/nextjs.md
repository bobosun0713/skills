# Next.js-Specific Code Review Rules

Apply **in addition to** `react.md` when the framework is **Next.js** (App Router or Pages Router).

---

## Rendering Strategy (Layer 3)

- 🔴 **Critical**: Using `useEffect` + `fetch` for data that should be fetched server-side — missed SSR opportunity and waterfall risk.
- 🟡 **Warning**: Choosing `getServerSideProps` for data that rarely changes — prefer `getStaticProps` + ISR.
- 🔵 **Suggestion**: Use `React.cache()` (App Router) to deduplicate fetch calls across the same request.

## App Router Specific (Layer 2 & 3)

- 🔴 **Critical**: Using React hooks (`useState`, `useEffect`) in a Server Component — will throw at runtime.
  ```tsx
  // ❌ Critical — Server Components cannot use hooks
  // Add 'use client' directive if hooks are needed
  export default function Page() {
    const [count, setCount] = useState(0) // ❌
  }
  ```
- 🟡 **Warning**: Entire page marked `'use client'` when only a small interactive part needs it — pushes all code to client bundle.
- 🟡 **Warning**: Fetching data in a Client Component that could be fetched in a parent Server Component and passed as props.
- 🔵 **Suggestion**: Push `'use client'` boundary as deep (leaf-level) as possible to maximize Server Component usage.

## Data Fetching (Layer 3)

- 🟡 **Warning**: Not using `next: { revalidate }` option on fetch calls in App Router when static data is acceptable.
  ```tsx
  // ✅ ISR-style caching
  fetch('/api/data', { next: { revalidate: 60 } })
  ```
- 🟡 **Warning**: Parallel data fetching opportunities missed — use `Promise.all()` for independent fetches.
- 🔵 **Suggestion**: Use `loading.tsx` / `Suspense` boundaries for streaming instead of blocking the whole page.

## Routing & Navigation (Layer 2)

- 🟡 **Warning**: Using `<a href>` instead of `<Link>` from `next/link` — loses prefetching and client navigation.
- 🟡 **Warning**: Using `router.push` for external URLs — use `window.location` or `<a>` instead.
- 🔵 **Suggestion**: Use `useSearchParams` hook (App Router) instead of manually parsing `window.location.search`.

## Images & Assets (Layer 4)

- 🟡 **Warning**: Using raw `<img>` tags instead of `next/image` — misses lazy loading, optimization, and layout shift prevention.
- 🔵 **Suggestion**: Set appropriate `sizes` prop on `next/image` for responsive images to avoid over-fetching.

## API Routes (Layer 5)

- 🔴 **Critical**: Missing input validation in API routes / Route Handlers.
- 🔴 **Critical**: Exposing server-only environment variables (`process.env.SECRET`) in client-accessible code.
- 🟡 **Warning**: Not returning proper HTTP status codes from API routes.
- 🔵 **Suggestion**: Use `next-safe-action` or similar for type-safe Server Actions instead of raw `fetch`.