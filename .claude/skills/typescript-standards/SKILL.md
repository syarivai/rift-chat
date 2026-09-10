---
name: typescript-standards
description: TypeScript idioms, the Result/Failure error model, and antipatterns for rift-chat. Load before writing TypeScript.
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

## Errors are values

Fallible operations return `Result<T, Failure>` rather than throwing. `Failure` is a **sealed
union**, which is what makes handling exhaustive:

```ts
type Failure =
  | { kind: 'network'; status?: number }
  | { kind: 'validation'; field: string }
  | { kind: 'storage' }
  | { kind: 'unknown'; cause?: unknown };

type Result<T, E = Failure> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Adding a `kind` surfaces every unhandled `switch` at compile time — which is the entire point.
Use an exhaustiveness guard:

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled: ${JSON.stringify(x)}`);
}
```

Throw only for **programmer errors** (an impossible state), never for expected failures like a
network timeout.

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
  | { status: 'failed'; error: Failure };
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
| Optional properties everywhere | A discriminated union with exact members |
| `as SomeType` to force a shape | Validate at the boundary and return a `Result` |
| Enums | `as const` object plus a derived union type |
| Deep generic gymnastics | A simpler runtime shape |
| `Promise<void>` that swallows errors | Return `Promise<Result<T>>` |

## At the API boundary

Never trust a response. Validate the shape in `core/api` and return
`Result<T, Failure>`, so a malformed payload becomes a handled failure instead of an
`undefined` that surfaces three components later as a crash.
