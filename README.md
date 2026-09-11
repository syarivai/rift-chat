# Rift Chat

A React Native chat client built with Expo, TanStack Query and Zustand, over the public
[responserift.dev](https://responserift.dev) API — where `api/users` are contacts and
`api/posts` are messages.

> **Status: in progress.** Phases 0–5 of the [delivery plan](./plans/rift-chat-mvp/delivery.md)
> are complete and verified on a device (45 of 74 tasks). Offline handling, the Maestro flow,
> measured performance numbers and the release APK are still outstanding — see
> [What's left](#whats-left). Nothing in this README claims work that has not been done.

## Demo

All screenshots are from the app running against the live API on an Android emulator.

|                                                                                        Chats                                                                                        |                                                                          Chat                                                                           |                                                   Profile                                                   |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------: |
| ![Chats list showing contacts with avatars; Bob Smith's row shows a real last message and timestamp while the rest show an italic "Tap to start chatting"](./docs/assets/chats.png) | ![Chat thread with two incoming grey bubbles and two outgoing green bubbles, each showing a relative time and a delivered tick](./docs/assets/chat.png) | ![Contact profile showing avatar, name, phone number and a Block contact button](./docs/assets/profile.png) |

|                                                                             Blocked                                                                              |                                                            Settings                                                            |                                              Dark mode + Indonesian                                              |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------: |
| ![Chat screen where the composer is replaced by "You blocked this contact" and an Unblock action, with message history still visible](./docs/assets/blocked.png) | ![Settings screen showing developer name, app version, a language picker and an appearance picker](./docs/assets/settings.png) | ![Settings screen rendered in the dark palette with all labels in Indonesian](./docs/assets/dark-indonesian.png) |

## Quick start

```bash
npm install
npm run android      # or: npm run ios — prebuild runs automatically
```

Expo Go will not work: MMKV and Reanimated need native code, so this is a development build.
Full walkthrough: [Tutorial: Getting started](./docs/tutorials/getting-started.md).

## The interesting part

**`POST /api/posts` returns `201` and does not persist anything**, and the `id` it returns is
always `101`. `GET /api/posts?userId=5` returns three posts, all authored _by_ the contact —
there is no sender field, so nothing in the API can represent a message the user wrote.

I found this by probing the API before writing any code, and it decided the architecture.

A conversation cannot be a projection of server state, because the outgoing half has nowhere on
the server to live. So a thread is the union of two sources, merged at read time:

```text
thread(contactId) = server posts (incoming)  ∪  outbox messages (outgoing)
                    ordered by createdAt
```

The consequence that matters: **a successful send must never invalidate the thread query.**
Invalidating refetches the contact's original posts and would delete every message the user had
ever sent — as the direct result of a _successful_ send. So the send mutation touches no query
at all. It appends to a persisted outbox, and the merged selector picks it up on the next
render.

Two more things follow:

- **A failed send is not rolled back.** The textbook optimistic pattern restores the previous
  cache on error; here that would delete something the user typed. The message stays visible,
  marked failed, with tap-to-retry. What is optimistic is the _delivery claim_, not the
  message's existence.
- **The response `id` is discarded.** It is always `101`, so it is neither unique nor stable and
  cannot be a React key.

This is not a workaround for a limited test API — it is what real messaging clients do: compose
locally, persist immediately, reconcile when the network allows. Full reasoning in
[Message model](./docs/explanation/message-model.md) and
[ADR 0004](./docs/explanation/adr/0004-message-model-and-outbox.md).

## Architecture

Feature slices over a shared core, with a one-way dependency direction:

```text
app  →  features  →  core
```

```text
src/
├── app/                      # expo-router routes — thin; no data fetching, no logic
│   ├── (tabs)/               #   Chats · Settings
│   ├── chat/[id].tsx
│   └── profile/[id].tsx
├── core/                     # cross-cutting only; imports nothing from features/
│   ├── api/                  #   BaseHttpClient (axios) · RiftApi · wire types
│   ├── store/                #   Zustand store + MMKV persistence
│   ├── query-keys/           #   the single query-key factory
│   ├── theme/                #   design tokens, light/dark palettes
│   ├── i18n/                 #   i18next + en/ms/id catalogs
│   ├── format/               #   relative time, id generation
│   └── ui/                   #   Avatar, Skeleton, EmptyState, ErrorState
└── features/
    ├── chats/    { api, model, ui }
    ├── chat/     { api, model, ui }   ← the only slice with real domain logic
    ├── profile/  { api, model, ui }
    └── settings/ { ui }
```

Slices never import each other; shared code moves down into `core/`.

### The state boundary

One rule decides where everything lives:

> **React Query owns what the server knows. Zustand owns what only this device knows.**

| State                             | Owner          | Persisted |
| --------------------------------- | -------------- | --------- |
| Contacts, profiles, threads       | React Query    | no        |
| Outbox (messages the user sent)   | Zustand + MMKV | **yes**   |
| Blocked contacts, language, theme | Zustand + MMKV | **yes**   |

Because the API does not persist writes, everything the user authors falls in the second
category. That is the whole design in one line.

### Architecture proportional to complexity

Strip this app down and it is **three queries and one mutation** over a read-only API. A
uniform four-layer treatment across every slice would have looked more rigorous and taught a
reader less about where the difficulty actually is.

So exactly one slice gets a domain layer: `chat/model` holds the outbox merge, the ordering
rule, and the `sending → sent | failed` lifecycle as pure functions, tested without React, a
network, or a renderer. Those are rules that would still be true if React Query were replaced
tomorrow. Everything else stays thin on purpose.

Three abstractions were considered and **cut**: a `Result<T, Failure>` type (React Query already
models read failure, and the outbox's `status` union already models write failure — it described
the same states twice), ports for storage/clock/connectivity (Jest already provides
`setSystemTime` and `jest.mock`), and barrel files. An interface with one implementation is not
an abstraction, it is a redirect.

### The API layer

Endpoints are declared once, on a `RiftApi` class extending an axios `BaseHttpClient`. A
`withQuery` helper attaches `.useQuery` / `.useInfiniteQuery` / `.useMutation` to each endpoint,
so `api.getContacts(params)` is a promise and `api.getContacts.useQuery(params)` is a hook. No
feature file imports axios or builds a URL.

Both collections are offset-paginated and report `total`, so the infinite-scroll stop condition
is arithmetic rather than a guess:

```ts
getNextPageParam: (last) =>
  last.offset + last.limit >= last.total ? undefined : last.offset + last.limit;
```

## Technical decisions

Each record states the context, lays the alternatives side by side with their trade-offs, and
names the condition that would change the answer.

| #                                                               | Decision           | Outcome                                                                                       |
| --------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| [0001](./docs/explanation/adr/0001-state-management-zustand.md) | Client state       | **Zustand** over Redux Toolkit and Jotai                                                      |
| [0002](./docs/explanation/adr/0002-storage-mmkv.md)             | Persistence        | **MMKV** over AsyncStorage — synchronous reads mean no flash of an empty thread on cold start |
| [0003](./docs/explanation/adr/0003-list-rendering-flatlist.md)  | List rendering     | **FlatList, tuned** over FlashList — 60 rows paged 20 at a time does not need a recycler      |
| [0004](./docs/explanation/adr/0004-message-model-and-outbox.md) | Conversation model | **Persisted outbox merged at read time** over two fabricated-data alternatives                |

ADR 0003 is the one I would most expect to be challenged. Reaching for FlashList would have
signalled "performance work" without evidence; the defensible position is _"I measured, the
built-in was sufficient, here is the data"_ — which is why that ADR carries a measurement
protocol and a 5% janky-frame acceptance bar rather than a claim.

## Testing

80 tests, 75% statements / 74% branches over the logic (`src/core`, `src/features/*/model`).

| Layer       | Covers                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Outbox merge and stability, status lifecycle including illegal transitions, relative-time formatting, envelope validation |
| Integration | Pagination stop condition, the optimistic send lifecycle, failure, retry, store persistence                               |
| Component   | Composer behaviour, empty/error states, row rendering                                                                     |

Tests mock the **transport** (axios) or the **API class**, never the hooks — so the real React
Query cache, retry and mutation lifecycle are exercised. Fixtures reproduce the API's quirks:
the `POST` fixture returns `id: 101` and the collection is unchanged afterwards. A fixture that
pretended the write persisted would hide the bug the app is designed around.

The test that matters most asserts a **negative**: sending triggers no thread refetch, and ten
consecutive sends leave ten distinct messages. That is the one bug that would silently destroy
user data while demoing perfectly.

Deliberately not tested: broad screen snapshots (high maintenance, low defect yield) and thin
platform adapters. Reasoning in [Testing strategy](./docs/explanation/testing-strategy.md).

## How AI aided development

This project was built with Claude Code, and the evidence is committed rather than described:
[`.claude/`](./.claude) holds 10 agents and 14 skills, and
[`plans/rift-chat-mvp/`](./plans/rift-chat-mvp) holds the requirements, technical design and a
74-task delivery checklist. The commit history shows the sequence.

**What the AI did that mattered.** It probed the live API before any code was written and found
that `POST` does not persist and always returns `id: 101` — the fact the entire architecture
turns on, and one I would not have discovered until much later by reading the brief alone. It
then ran a structured design interrogation (~20 decisions, each with alternatives and
trade-offs) _before_ implementation, and wrote the Diátaxis docs and ADRs.

**What I decided.** Every architectural fork, including several where I overruled it:

- It proposed **FlashList**; I rejected it as unmeasured over-engineering at 60 rows. It agreed
  the reasoning was sound and wrote ADR 0003 around the measured position instead.
- It proposed **seeded placeholder messages** to make the Chats list look populated; I rejected
  fabricating data the API does not have. The honest empty state is the result.
- It proposed `Result<T, Failure>`, ports, and barrel files; I cut all three as abstractions
  nobody asked for.

**Where it was wrong, and how that was caught.** Twice it documented things confidently that
turned out to be false, and both were caught by _running_ rather than reading:

- It claimed `react-native-mmkv` ships a Jest mock. v4 is a Nitro module and cannot load under
  Jest at all; a hand-written mock was required.
- It claimed Hermes ships full `Intl`. `Intl.RelativeTimeFormat` is **undefined** on device —
  Node implements it, so every unit test passed while the app crashed with a red box.

That second one is the clearest lesson from this build: a green test suite is not evidence that
an app runs. Four bugs reached a working device despite full test coverage, and each was found
by driving the real app and reading a screenshot.

## Performance

The approach is measured, not asserted: a dev-only render counter on the contact row, plus
`adb shell dumpsys gfxinfo` against a **release** build with a scripted `adb input swipe` so
runs are comparable. Protocol in
[Run and test](./docs/how-to/run-and-test.md#measure-list-performance).

The tuning is in place — memoised rows declared outside the parent, no inline arrow props,
stable `keyExtractor`, `getItemLayout` (row height is fixed), tuned window props, and
`expo-image` with `recyclingKey` so a recycled row never flashes the previous avatar.

**The numbers are not captured yet** (Phase 9). This section will carry a before/after table, or
the FlashList decision gets revisited per ADR 0003's stated trigger.

## Documentation

Organised with [Diátaxis](https://diataxis.fr/) — index at [`docs/`](./docs/README.md).

- **Understanding** → [Architecture](./docs/explanation/architecture.md) ·
  [Message model](./docs/explanation/message-model.md) ·
  [Decision records](./docs/explanation/adr/README.md)
- **Looking up** → [API contract](./docs/reference/api-contract.md) (the real probed shapes) ·
  [Conventions](./docs/reference/conventions.md) ·
  [Project structure](./docs/reference/project-structure.md)
- **Doing** → [Add a feature](./docs/how-to/add-a-feature.md) ·
  [Run and test](./docs/how-to/run-and-test.md)

## What's left

Named so their absence reads as a plan rather than an omission:

| Item                                                     | Status                                          |
| -------------------------------------------------------- | ----------------------------------------------- |
| Offline banner, query pausing, outbox flush on reconnect | Phase 7                                         |
| Maestro end-to-end flow                                  | Phase 8                                         |
| Measured performance numbers                             | Phase 9                                         |
| Screen transitions, message send animation               | Phase 6 (stretch)                               |
| **Release APK**                                          | Phase 10 — required by the brief, not yet built |

## Tech stack

Expo SDK 57 · React Native 0.86.3 · React 19.2.3 · TypeScript 6 (strict) · expo-router ·
TanStack Query 5 · Zustand 5 · MMKV 4 · axios · i18next (en/ms/id) · Jest + React Native
Testing Library.

Versions are pinned to Expo's SDK manifest, not npm's `latest` — for a managed Expo project
those differ, and `react-native-gesture-handler` is a whole major version apart. Details and the
version traps that cost real time: [Tech stack](./docs/reference/tech-stack.md).

## Licence

[MIT](./LICENSE) © Muhammad Syarif Abdullah
