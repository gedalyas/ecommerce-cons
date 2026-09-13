# Folder architecture: modules with contracts, shared kernel, cycle ratchet

## Context

The repository grew as a presentation prototype with six layer folders at the
root of `src/` (`components/`, `design-system/`, `hooks/`, `layout/`, `lib/`,
`server/`) plus `features/`. Nothing enforced who could import what: any
screen could reach into any other feature's internal file, `design-system`
re-exported everything through 40+ `index.ts` barrels (a four-level `export *`
at the root), the layout imported the assistant domain, and there was no
measurement of import cycles at all. The data module (Prax parity, six
stages) was about to be built on top of that layout.

The team already runs a different architecture in its other systems
(`arko_frontend` + `arko_backend`), documented in `architecture-reference.md`:
the folder is the business domain, the layer is the file; one hand-written
`contract.ts` per module; a shared kernel that knows no domain; boundaries
enforced by `no-restricted-imports`; import cycles measured as files inside a
strongly connected component and capped by a ratchet that only goes down.

Gap analysis on 2026-09-12: of 20 reference rules, 8 were missing here, 10
were different, 2 were kept as-is (Prettier style, Vite import protection).

## Decision

Adopt the reference architecture with the adaptations for one repo running
TanStack Start SSR + Prisma (`architecture.md`):

- `src/modules/<domain>/` flat (`MAX_MODULE_DEPTH = 0`), `contract.ts` as the
  only public file; `src/shared/` as the kernel; `src/routes/` as the
  composition root (the framework's route table plays the `App.tsx` role).
- `<domain>Controller.ts` holds the server functions (transport, isomorphic);
  `<domain>Service.ts` is the only file that imports the Prisma client and is
  kept out of the client bundle by Vite import protection. Enums come from
  `@/generated/prisma/enums` anywhere.
- `AppShell` (shared) receives the assistant panel and fab as slots from
  `__root.tsx` instead of importing the assistant module.
- ESLint boundary rules copied from the reference; `scripts/checkCycles.ts` +
  `scripts/cyclicFiles.ts` copied byte for byte (plus a Windows shim for the
  depcruise binary); CI caps lint warnings and files-in-cycles at **0**.
- Vitest with colocated tests for the pure core; named exports everywhere;
  camelCase files, PascalCase only for component files, no kebab-case.
- The 40 vendored shadcn files nothing imported were deleted; the six in use
  became the `shared/ui` primitives.

Executed in four commits (shared kernel → modules + contracts → tooling →
docs) with typecheck, lint, cycles, tests, build and the dev routes green
after each.

## Why

Doing it after six stages of screens would have meant moving six times the
files and re-deriving every import. Doing it now cost one small move of the
Stage 0 code. The two properties the user asked for — no import cycles and
communication only through contracts — are the ones the reference enforces by
tooling rather than convention, which is what makes them survive a growing
codebase.

## Alternatives discarded

- **Keep `features/` + `design-system/` and only add lint rules.** The layer
  folders at the root are exactly what the reference forbids (`extinct`), and
  the barrels would have kept every cycle path open.
- **`*.server.ts` suffix instead of `*Service.ts` for the Prisma file.**
  Rejected to keep the reference's `dependenciesOnlyInService` glob and role
  vocabulary reusable literally; the build guard covers the server-only
  concern.
- **dependency-cruiser `no-circular` with a baseline.** Rejected for the same
  reason the reference records: the baseline matches cycles by path and
  flags old cycles as new after any edit in the middle.
- **Default exports for page components (reference style).** Rejected: the
  codebase already used named exports everywhere and `contract.ts` lines stay
  simpler without `default as`.
