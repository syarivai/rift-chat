---
title: 'ADR 0004 — Conversation model: a persisted outbox merged at read time'
description: How a chat is modelled over an API that stores no messages, and which alternatives were rejected.
category: explanation
---

# ADR 0004 — Conversation model: a persisted outbox merged at read time

**Status:** Accepted · 2026-09-10

## Context

The brief maps `api/posts` to messages. Probing the live API surfaced three facts that make the
naive mapping unworkable:

1. `GET /api/posts?userId=5` returns **`total: 3`**. With 100 posts across 60 users, a thread
   holds two or three messages.
2. Every post in that response is authored **by the contact**. There is no sender field, so a
   direct mapping yields a thread of entirely incoming bubbles — no conversation at all.
3. `POST /api/posts` returns `201` but **does not persist**, and returns `id: 101` every time.

So a conversation cannot be a projection of server state: the outgoing half has nowhere to live.

## Options

### A. Contact posts incoming, user's sends persisted locally _(chosen)_

| +                                                                                                     | −                                                                   |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Honest 1:1 mapping — nothing is invented; every bubble corresponds to real data or a real user action | The merge layer is extra code with real ordering rules to get right |
| Threads **grow with use**, so infinite scroll becomes genuinely demonstrable rather than decorative   | A fresh install still starts with short threads                     |
| Sent messages survive restart, which is what a messaging app must do                                  | Requires the discipline of never invalidating the thread query      |
| Gives the optimistic update a real failure path (`failed` + retry) instead of happy-path-only         |                                                                     |
| The Chats list updates on send, proving cross-screen state coherence                                  |                                                                     |

### B. Deterministic alternation for a fuller-looking thread

Split each post into a title bubble and a body bubble, alternating incoming/outgoing by id parity.

| +                                                                                | −                                                                                             |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Every thread looks like a real conversation immediately; better first screenshot | Fabricates a data model the API does not express                                              |
| No local persistence needed                                                      | A reviewer who reads the API will notice, and it undermines everything else in the submission |
| Trivial to implement                                                             | The "outgoing" messages are the contact's own words attributed to the user                    |

### C. Page the global post pool into every thread

| +                                          | −                                                       |
| ------------------------------------------ | ------------------------------------------------------- |
| Deep infinite scroll in every conversation | Messages from unrelated people appear in a private chat |
| No local storage required                  | Indefensible as a data model                            |
| Best scroll demo                           |                                                         |

## Decision

**Option A.** Server posts render as incoming; the user's messages live in a persisted outbox
and are merged with the thread by `createdAt` at read time.

The deciding argument is that A is the only option that is _true_. B and C both demo better
and both require claiming the data means something it does not — a bad trade in a submission
whose purpose is to demonstrate judgement.

A also turns out to be the design a real client would use anyway: compose locally, persist
immediately, reconcile with the server when possible.

## Consequences

- **A send never invalidates the thread query.** The refetch would return the original posts
  and delete everything the user had sent. This is rule 1 in `CLAUDE.md`.
- Outbox messages are identified by a client-generated `localId`; the server's `id` is unusable.
- The merge, ordering, and status lifecycle are pure functions — tests pin the clock with
  `jest.setSystemTime()` — and are
  the one part of the app with a real domain layer (see [Architecture](../architecture.md)).
- A failed send is **not** rolled back. It stays visible as `failed` with a retry affordance;
  deleting content the user wrote is the wrong response to a network error.
- The Chats list shows a real last message for contacts with outbox entries and an honest
  empty state — "Tap to start chatting" — for the rest, rather than invented preview text.
- The README documents this mapping explicitly, so the short threads read as a property of the
  fixture data rather than a bug.

## Revisit if

The API gains real message persistence or a sender field. Either would collapse the two sources
into one, and the outbox would shrink to what it is in a normal client: a queue for messages not
yet acknowledged.
