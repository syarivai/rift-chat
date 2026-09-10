---
title: 'API contract'
description: The responserift.dev endpoints this app uses, their exact shapes, and their quirks.
category: reference
---

# API contract

Base URL: `https://responserift.dev`

Everything below was verified against the live API on **2026-09-10**. The
`api-contract-verifier` agent re-probes these shapes and reports drift; if the API changes,
this page is what gets corrected first.

## Conventions

- Responses are JSON. CORS is open (`access-control-allow-origin: *`).
- Reads are cacheable: `cache-control: public, max-age=300`.
- **Pagination is offset-based.** Collections take `limit` and `offset` and return `total`.
  There are no cursors and no sort parameters.
- No authentication.

## Collection envelope

Every collection endpoint returns the same wrapper:

```json
{
  "total": 60,
  "limit": 20,
  "offset": 0,
  "results": [ ... ]
}
```

`total` is the count of **all** matching records, not the page size — it is what tells the
infinite query when to stop.

## `GET /api/users` — contacts

Query parameters: `limit`, `offset`.

```json
{
  "id": 1,
  "name": "Alice Johnson",
  "username": "alicej",
  "email": "alice.johnson@example.com",
  "avatar": "https://i.pravatar.cc/150?img=1",
  "phone": "+1-202-555-0101",
  "website": "https://alicejohnson.dev",
  "address": { "street": "123 Maple St", "city": "Springfield", "zipcode": "62704" }
}
```

`total` is **60**.

Every field the Profile screen needs — name, avatar, phone — is already present in the list
payload. The profile query therefore resolves from the list cache on navigation and refetches
in the background, so the screen never shows a spinner for data the app already has.

## `GET /api/users/:id` — one contact

Returns a bare user object, **not** wrapped in the collection envelope.

## `GET /api/posts` — messages

Query parameters: `limit`, `offset`, `userId`.

```json
{
  "id": 1,
  "userId": 5,
  "title": "Exploring REST APIs in 2025",
  "body": "REST APIs continue to be the backbone of modern web development...",
  "tags": ["1", "16", "15"],
  "category": "API Design",
  "createdAt": "2025-07-01T10:12:00Z"
}
```

`total` is **100** unfiltered.

**`userId` filters server-side.** `GET /api/posts?userId=5` returns `total: 3` — the filtering
happens on the server, so the app never over-fetches a thread.

### Consequences for the chat screen

- **Threads are short.** 100 posts across 60 users is two or three messages each. Infinite
  scroll is implemented correctly and simply terminates quickly on a fresh thread; threads
  grow as the user sends messages.
- **Every server post is authored by the contact.** There is no "from me" flag, so server
  posts render as incoming and the user's own messages come from the local outbox.
- `title` and `body` are both present; the app renders `body` as the message text and ignores
  `title`, `tags`, and `category`. Mapping these into the UI would be inventing a data model
  the API does not express.

## `POST /api/posts` — send a message

```bash
curl -X POST https://responserift.dev/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"userId":5,"title":"hi","body":"test message"}'
```

Responds **201** with:

```json
{
  "id": 101,
  "userId": 5,
  "title": "hi",
  "slug": "hi",
  "body": "test message",
  "tags": [],
  "category": "General",
  "createdAt": "2026-09-09T23:22:00.377Z"
}
```

### Two quirks that shape the whole app

1. **The write is not persisted.** A subsequent `GET /api/posts?userId=5` still returns the
   original three posts. The server accepts the write and forgets it.
2. **`id` is always `101`.** It is `total + 1`, not a real identifier, so it is neither unique
   nor stable and must never be used as a React key or a cache identity.

Together these mean **a successful send must never invalidate the thread query** — the refetch
would return the original posts and destroy every message the user had sent. Outgoing messages
are owned by the persisted outbox and merged at read time.

The full reasoning is in [Explanation: Message model](../explanation/message-model.md), and the
ownership boundary is in [Query keys & state](./query-keys-and-state.md).

## What the app does not use

`email`, `website`, `address`, `tags`, `category`, and `slug` are fetched (they arrive in the
payload) but not rendered. `title` is sent on write because the endpoint expects it; the app
derives it from the message body.
