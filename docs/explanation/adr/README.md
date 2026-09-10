---
title: 'Decision records'
description: Index of the architecture decision records, each with the alternatives and their trade-offs.
category: explanation
---

# Decision records

Each ADR states the context, lays the realistic options side by side with their pluses and
minuses, records what was chosen and why, and notes what the choice costs. They exist so a
reviewer can see that the alternatives were considered rather than defaulted past.

| # | Decision | Outcome |
| - | -------- | ------- |
| [0001](./0001-state-management-zustand.md) | Client state management | **Zustand** over Redux Toolkit and Jotai |
| [0002](./0002-storage-mmkv.md) | Persistence layer | **react-native-mmkv** over AsyncStorage and expo-sqlite |
| [0003](./0003-list-rendering-flatlist.md) | List rendering | **FlatList, tuned** over FlashList |
| [0004](./0004-message-model-and-outbox.md) | Conversation model | **Persisted outbox merged at read time** |

## Format

```text
Status · Context · Options (with + / − tables) · Decision · Consequences · Revisit if
```

The **Revisit if** line matters: a decision without a trigger for reconsidering it is a
prejudice. Each ADR names the condition that would change the answer.
