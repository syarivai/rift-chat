---
title: 'Message model'
description: How posts become a conversation, why the outbox exists, and why a thread is never invalidated.
category: explanation
---

# Message model

This is the most important page in the documentation. Everything unusual about the app follows
from two facts about the API.

## The two facts

**1. `POST /api/posts` is not persisted.** The endpoint returns `201` with a well-formed body,
and a subsequent `GET /api/posts?userId=5` returns exactly the same three posts as before. The
server accepts the write and forgets it.

**2. Every server post belongs to the contact.** `GET /api/posts?userId=5` returns posts
authored _by_ user 5. There is no sender field, no "from me" flag, and nothing that could
represent a message the app's user wrote.

## What follows

A conversation cannot be a projection of server state, because half of it — everything the user
sends — has nowhere on the server to live. So the app models a thread as the union of two
sources:

```text
messages(contactId) = server posts (incoming)  ∪  outbox messages (outgoing)
                    ordered by createdAt
```

- **Incoming** — `GET /api/posts?userId=<contactId>`, owned by React Query, paginated by offset.
- **Outgoing** — the outbox, owned by Zustand and persisted to MMKV, keyed by `contactId`.

The merge happens at read time in a pure function. Neither source knows about the other.

## Why a send must never invalidate the thread

The reflex after a successful mutation is `invalidateQueries`. Here that call is destructive.

Invalidating `messages.byContact(5)` refetches `GET /api/posts?userId=5`, which returns the
original three posts — because the write was never persisted. If the thread were the source of
truth for outgoing messages, **every message the user had ever sent would vanish**, instantly,
as the direct result of a successful send.

So the send mutation invalidates nothing. It appends to the outbox; the merged selector picks
the new message up on the next render. The query cache is never asked to hold something the
server will not give back.

This is rule 1 in [`CLAUDE.md`](../../CLAUDE.md) and the first thing the `rn-code-checker`
agent looks for.

## Identity: never trust `id`

Every successful write returns `id: 101`. It is `total + 1`, not an allocation — send ten
messages and all ten come back as `101`. Using it as a React key would collapse ten bubbles
into one.

Outbox messages therefore carry a client-generated `localId`, assigned at enqueue time and
never replaced. The server response contributes exactly one useful field, `createdAt`, and even
that is only used to refine ordering.

## The send lifecycle

```text
enqueue ──► sending ──► sent
                │
                └────► failed ──(retry)──► sending
```

1. **Enqueue.** The user hits send. A message with a fresh `localId`, status `sending`, and a
   timestamp is appended to the outbox and persisted. The bubble appears
   immediately — this is the optimistic update, and it is optimistic about _delivery_, not
   about existence: the message is already durable before the request leaves.
2. **`201`.** Status becomes `sent`, `createdAt` is refined from the response, and a tick
   renders. No query is touched.
3. **The request fails.** Status becomes `failed`. The bubble stays put with a red retry affordance. The
   message is not lost and is not rolled back — rolling back would delete something the user
   wrote, which is the wrong instinct for a messaging app even when the request genuinely failed.
4. **Retry.** Status returns to `sending` and the request is re-issued.

"Optimistic update with rollback" is the textbook pattern, and it is the wrong pattern for user
content. What gets rolled back here is the _delivery claim_, never the message.

## Consequences the UI has to own

**Threads start nearly empty.** Two or three posts per contact is what the fixture data offers.
Infinite scroll is implemented correctly — offset paging with an arithmetic stop condition —
and simply terminates quickly. Threads grow as the user sends messages, because those persist.

**The Chats list reads the outbox.** A contact with outbox messages shows the real last message
and a live relative timestamp. A contact without shows an honest empty state — "Tap to start
chatting" — and no timestamp. The alternative, inventing plausible-looking last messages from
the user id, would look better in a first screenshot and would be fabricating data the API does
not have.

**Sending updates two screens.** The Chats row updates the moment a message is enqueued,
because both screens read the same store. That coherence is the whole point of keeping client
state in one place.

## What this is not

This is not a workaround for a limited test API. It is what messaging clients actually do:
compose offline, persist locally, reconcile with the server when it is reachable, and never let
a network round-trip decide whether a message the user typed exists. The API's quirks made the
correct design mandatory rather than optional.

## See also

- [API contract](../reference/api-contract.md) — the probes behind the two facts.
- [ADR 0004](./adr/0004-message-model-and-outbox.md) — the alternatives considered.
- [Query keys & state](../reference/query-keys-and-state.md) — the invalidation table.
