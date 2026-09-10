---
title: 'Documentation'
description: Index of the rift-chat documentation, organised with the Diátaxis framework.
category: explanation
---

# Documentation

This documentation follows the [**Diátaxis**](https://diataxis.fr/) framework, which splits
docs into four kinds based on what the reader needs _right now_:

| Quadrant | Need | Question it answers | Folder |
| -------- | ---- | ------------------- | ------ |
| **Tutorials** | Learning | "Teach me, step by step." | [`tutorials/`](./tutorials) |
| **How-to guides** | A task done | "How do I _do_ X?" | [`how-to/`](./how-to) |
| **Reference** | Facts to look up | "What exactly is X?" | [`reference/`](./reference) |
| **Explanation** | Understanding | "Why is it like this?" | [`explanation/`](./explanation) |

The split matters: a tutorial that stops to explain theory, or a reference page that tries to
teach, serves neither reader well. Pick the quadrant by the reader's need, not the topic.

## Start here

- **New to the project?** → [Tutorial: Getting started](./tutorials/getting-started.md)
- **Wondering why messages work the way they do?** →
  [Explanation: Message model](./explanation/message-model.md) — the single most important
  design decision in this codebase.
- **About to write code?** → [Reference: Conventions](./reference/conventions.md)
- **Need a command?** → [Reference: Commands](./reference/commands.md)

## Map of the docs

### Tutorials (learning-oriented)

- [Getting started](./tutorials/getting-started.md) — install, run, send a message, run the tests.

### How-to guides (task-oriented)

- [Add a feature](./how-to/add-a-feature.md) — the vertical-slice workflow.
- [Run and test](./how-to/run-and-test.md) — day-to-day commands, building the release APK,
  measuring list performance, and troubleshooting.

### Reference (information-oriented)

- [Commands](./reference/commands.md)
- [Project structure](./reference/project-structure.md)
- [Tech stack & versions](./reference/tech-stack.md)
- [Conventions](./reference/conventions.md)
- [API contract](./reference/api-contract.md) — the real responserift.dev shapes.
- [Query keys & state](./reference/query-keys-and-state.md) — the server/client ownership boundary.
- [Design tokens](./reference/design-tokens.md)
- [i18n](./reference/i18n.md) — catalogs, keys, and adding a locale.

### Explanation (understanding-oriented)

- [Architecture](./explanation/architecture.md) — feature slices and the dependency direction.
- [Message model](./explanation/message-model.md) — the outbox, optimistic sends, and why a
  thread is never invalidated.
- [Testing strategy](./explanation/testing-strategy.md) — the pyramid and what each layer buys.
- [Guardrails](./explanation/guardrails.md) — type-check, lint, format, test gates.
- [Decision records](./explanation/adr/README.md) — the four ADRs, each with a plus/minus table.

## See also

- [`../CLAUDE.md`](../CLAUDE.md) — working instructions for AI assistants.
- [`../plans/rift-chat-mvp/`](../plans/rift-chat-mvp) — requirements, technical design, and the
  delivery checklist.
- [`../README.md`](../README.md) — the top-level project readme (the graded submission document).
