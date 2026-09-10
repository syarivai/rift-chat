---
name: typescript-standards
description: TypeScript idioms, discriminated-union modelling, error handling, and antipatterns for rift-chat. Load before writing TypeScript.
---

# TypeScript standards

`strict` is on. The type system is treated as a design tool, not a formality.

## Non-negotiables

- **No `any`.** Use `unknown` and narrow. If a type is genuinely unknowable, it is unknown —
  say so and handle it.
- **No `@ts-ignore` / `@ts-expect-error`** without a comment naming the upstream issue.
- **No non-null assertion (`!`)** to silence a nullable. Narrow it, or make the type honest.
- **`readonly` on entities and state.** Updates produce new objects.
- **`as const`** on literal maps, key factories, and token objects, so their types are exact.

## Errors

Errors propagate. There is no `Result` type in this codebase — that was considered and
rejected as an abstraction nobody asked for (see the ponytail ladder in
[project-conventions](../project-conventions/SKILL.md)).

- **Reads**: let the fetcher throw. React Query catches it and gives you `error`, `isError`,
  and retry for free. Re-implementing that in the type system buys nothing the UI uses.
- **Writes**: the send path's outcome is already modelled where the UI reads it — the outbox
  message's `status` is `'sending' | 'sent' | 'failed'`. That union *is* the error handling,
  and it is the one the screen renders.
- **Validation at the API boundary**: if a payload is malformed, throw. It is not an expected
  outcome, and pretending otherwise spreads handling across every caller.

Throw `Error` with a useful message. Do not invent an error class hierarchy until something
actually branches on the type — today nothing does.

## Inference

Let TypeScript infer locals and return types of simple functions. Annotate **boundaries** —
exported function signatures, props, store slices, API response types — because those are the
contracts, and an inferred contract changes silently.

## Discriminated unions over booleans

```ts
// weak: 2^3 = 8 states, most of them impossible
type Msg = { sending: boolean; failed: boolean; sent: boolean };

// strong: exactly three states, and the compiler enforces it
type Msg =
  | { status: 'sending' }
  | { status: 'sent'; deliveredAt: string }
  | { status: 'failed'; error: string };
```

The second version makes the impossible states unrepresentable and gives each state exactly the
data it needs. This is the outbox message model.

## Type-level hygiene

- **Branded ids** where confusion is possible: `type ContactId = number & { __brand: 'ContactId' }`
  prevents passing a message id where a contact id belongs.
- **`satisfies`** for config objects: keeps the literal type while checking the shape.
- Prefer `type` for unions and object shapes; `interface` only when declaration merging is
  actually wanted.
- Never widen a type to make a test pass. The test is telling you something.

## Antipatterns

| Antipattern | Instead |
| ----------- | ------- |
| `any` in a catch | `catch (e: unknown)` then narrow |
| A `Result` wrapper around a throw | Let it throw; React Query already models the failure |
| Optional properties everywhere | A discriminated union with exact members |
| `as SomeType` to force a shape | Validate at the boundary and return a `Result` |
| Enums | `as const` object plus a derived union type |
| Deep generic gymnastics | A simpler runtime shape |
| `Promise<void>` that swallows errors | Let it throw; React Query surfaces it |

## At the API boundary

Never trust a response. Validate the shape in `core/api` and **throw** on a malformed payload,
so it fails at the boundary instead of surfacing three components later as an `undefined`
crash with no useful stack. React Query turns that throw into an error state the screen
already knows how to render.
