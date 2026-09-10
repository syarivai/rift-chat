---
name: project-conventions
description: The house rules for rift-chat — layering, imports, naming, i18n and theming discipline, commit format, and the delivery-checklist protocol. Load before writing code or committing.
---

# Project conventions

The full checklist is [`docs/reference/conventions.md`](../../../docs/reference/conventions.md).
This skill is the working subset plus the process rules that live outside the code.

## Before you write anything

1. Open [`plans/rift-chat-mvp/delivery.md`](../../../plans/rift-chat-mvp/delivery.md) and take
   the next unchecked task.
2. If what you are about to build is not on the checklist, **add it there first**. The
   checklist is the plan of record, not a summary written afterwards.
3. Read the task's acceptance criteria before writing code, not after.

## Layering

- `core/` imports nothing from `features/`. Slices never import each other — shared code moves
  down into `core/`.
- `model/` holds pure logic and store slices. No JSX.
- Native modules are reached only through a `core/` port. Feature code never imports
  `react-native-mmkv`, `expo-localization`, or `@react-native-community/netinfo` directly.
- **Add a domain layer only when a rule would survive swapping React Query, the UI, or the
  API.** Today the outbox is the only such place.

## Imports and naming

- `@/…` alias, never `../../../`.
- `kebab-case.ts`; one primary export per file where practical.
- Import through a folder's barrel `index.ts`, not deep paths.

## Non-negotiables in UI code

| Rule | Why |
| ---- | --- |
| No raw hex, rgb, or magic numbers — tokens from `@/core/theme` | Dark mode breaks silently otherwise |
| No string literals in JSX — `t()` keys in **all three** catalogs | A key missing from `ms`/`id` falls back to English and looks like a bug |
| `accessibilityLabel` + `accessibilityRole` on interactive elements | Tests and the Maestro flow depend on them |
| Every screen handles loading, empty, error, and content | Three of the four are where apps feel unfinished |

## Types and errors

- `strict` TypeScript, no `any`; prefer `unknown` plus narrowing.
- Fallible operations return `Result<T, Failure>`; never throw for an expected failure.
- `Failure` is a sealed union — handle every `kind`.

## Time and determinism

Inject `Clock` from `@/core/time`; never call `Date.now()` inside logic. This is what makes
outbox ordering assertable.

## Commits

- Trunk-based: small commits straight to `main`.
- [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`,
  `test:`, `refactor:`, `chore:`, `perf:`.
- Describe **behaviour**, not files. "feat: persist sent messages across restarts" beats
  "add outbox.ts".
- **Tick the delivery.md task in the same commit as the work it describes.**

## Definition of done

A task is done when **all** of these hold — never tick on intent:

1. Its acceptance criteria pass, verified by running something.
2. `npm run check` is green.
3. Docs are updated if behaviour or structure changed.
4. The checklist item is ticked in the same commit.

## Scope tiers

Every delivery task is **P0** (required by the brief), **P1** (high-value polish), or **P2**
(stretch). There is a hard cut line at the end of day 3: unfinished P2 work is dropped and
recorded in the README as a deliberate decision. Do not start a P2 task while a P0 or P1 task
is unfinished.
