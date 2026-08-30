# Routes

This project uses TanStack Start with **virtual file routes**: the mapping
between URL and file lives in [`src/routes.ts`](../routes.ts), not in the file
names. That is how route files stay in English while the URLs the user sees
stay in Portuguese (see `specs/conventions.md`).

| URL           | File              |
| ------------- | ----------------- |
| `/`           | `dashboard.tsx`   |
| `/dinheiro`   | `money.tsx`       |
| `/marketing`  | `marketing.tsx`   |
| `/logistica`  | `logistics.tsx`   |
| `/gestao`     | `management.tsx`  |
| `/conexoes`   | `connections.tsx` |
| `/assistente` | `assistant.tsx`   |

Adding a screen means adding the file here **and** a `route()` entry in
`src/routes.ts` — a new file alone is not picked up.

`__root.tsx` is the app shell (wraps every page; preserve `<Outlet />` in
`AppShell`). `routeTree.gen.ts` is auto-generated — never edit it by hand.
