# Layout and navigation

## Global shell (`src/layout/AppShell`)

Three columns on desktop (≥1280px):

| Column          | Width                                                    | Content                 |
| --------------- | -------------------------------------------------------- | ----------------------- |
| Sidebar         | 240px (`w-60`) at `xl`; 72px icon rail from `md` to `xl` | Navigation              |
| Content         | flexible, `max-w-5xl` container, own scroll              | Active section          |
| Assistant panel | 360px (`w-90`), collapsible to a 56px rail               | AI chat, always visible |

Below `md` the sidebar disappears and a fixed **bottom nav** (6 items:
Dashboard, Dinheiro, Marketing, Logística, Gestão, Mais→Conexões) takes over.
Between `md` and `xl` the assistant becomes a floating "Assistente" button that
opens a drawer; below `md` the button links to the full-screen `/assistente`
page instead.

The content area (`#app-scroll`) owns the scrolling; `PageHeader` is sticky
inside it and gains a bottom border + shadow after 1px of scroll. Scroll
shadows (top/bottom gradients) indicate clipped content.

## Sidebar (`src/layout/Sidebar`)

- Top: product name "Nome Provisório", then the selected client under a
  "Cliente" label: "Loja Aurora".
- Group "Áreas": Assistente, Dashboard, Dinheiro, Marketing, Logística, Gestão.
  Active item: left border + accent background + primary color.
- Divider, then group "Infraestrutura": **Conexões** with a small orange square
  dot signalling a problem (Meta Ads sync error).
- Footer: "Maturidade" progress bar, "2 de 4 critérios", bar at 50%.

## Routes

Route **files** are English; **URLs** are Portuguese. The mapping is defined in
`src/routes.ts` (TanStack virtual file routes):

| URL           | File                     | Screen                          |
| ------------- | ------------------------ | ------------------------------- |
| `/`           | `routes/dashboard.tsx`   | Dashboard                       |
| `/dinheiro`   | `routes/money.tsx`       | Dinheiro                        |
| `/marketing`  | `routes/marketing.tsx`   | Marketing                       |
| `/logistica`  | `routes/logistics.tsx`   | Logística                       |
| `/gestao`     | `routes/management.tsx`  | Gestão                          |
| `/conexoes`   | `routes/connections.tsx` | Conexões                        |
| `/assistente` | `routes/assistant.tsx`   | Assistente (mobile full-screen) |

Route files stay thin: `head()` meta (Portuguese titles/descriptions) plus the
feature component import. Screens live in `src/features/<area>/index.tsx`.

`/assistente` hides the docked panel and the floating button (the page itself
is the assistant) and locks the shell scroll.

## Error handling

- `routes/__root.tsx` renders the 404 and the root error boundary (both with a
  "go home" action) and reports boundary errors via `src/lib/error-reporting`.
- `src/start.ts` adds server middleware: converts unexpected SSR errors into a
  friendly static 500 page (`src/lib/error-page.ts`) and installs CSRF
  protection for server functions.
- `src/server.ts` wraps the server entry to recover errors h3 swallows.
