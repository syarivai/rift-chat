---
title: 'Guardrails'
description: The quality gates — type-check, lint, format, test — and where each one runs.
category: explanation
---

# Guardrails

Guardrails are the automated gates that keep `main` green. They run at three points, each
stricter and slower than the last, so problems are caught as early and as cheaply as possible.

## The four gates

| Gate           | Command                | Enforces                                                                          |
| -------------- | ---------------------- | --------------------------------------------------------------------------------- |
| **Type-check** | `npm run typecheck`    | `tsc --noEmit` in strict mode — no `any`, exhaustive discriminated-union handling |
| **Lint**       | `npm run lint`         | `eslint .` with `eslint-config-expo` — hook rules, import hygiene, RN pitfalls    |
| **Format**     | `npm run format:check` | Prettier consistency                                                              |
| **Test**       | `npm run test:ci`      | Unit, integration, and component tests, with coverage thresholds                  |

`npm run check` runs all four in sequence — the same set, in the same order, that CI runs.

## Where each gate runs

### 1. In the editor

TypeScript and ESLint report inline as you type. This is where most issues die.

### 2. On commit — `pre-commit` (fast)

Husky runs **lint-staged** over staged files only, auto-fixing what it can. Fast by design so
committing stays snappy.

### 3. On push — `pre-push` (thorough)

Husky runs the full `npm run check`. Nothing reaches the remote without passing the whole
suite, so CI rarely fails for something that could have been caught locally.

### 4. In CI — GitHub Actions

`.github/workflows/ci.yml` re-runs all four gates on every push, on a clean
`npm ci` install. This is the authoritative run: it catches "works on my machine" drift and
anything a hook was bypassed for.

## Why hooks _and_ CI

Hooks give fast local feedback but can be skipped with `--no-verify`. CI is authoritative but
slower. Running the same commands in both means the fast path usually suffices and the
authoritative path is never a surprise.

Do not use `--no-verify`. If a gate is wrong, fix the gate.

## What CI does not do

CI does not build the APK. An Android release build is slow and occasionally fiddly, and on a
four-day budget the time is better spent on the app; the APK is built locally and committed to
`release/` with its SHA-256 recorded in the README so a reviewer can verify it independently.
This is a deliberate trade, noted here so it reads as a decision rather than an omission.

## See also

- [Testing strategy](./testing-strategy.md) — what the test gate actually covers.
- [Commands](../reference/commands.md) — every script.
