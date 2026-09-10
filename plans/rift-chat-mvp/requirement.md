---
title: 'Requirements'
description: Every requirement extracted from the take-home brief, with traceable ids, classification, and Gherkin acceptance specs.
category: reference
---

# Requirements — rift-chat

Extracted from [`take-home-assessment.md`](../../take-home-assessment.md) on **2026-09-10**.

Every requirement has a stable id. Ids are **never renumbered** — new requirements append. Each
delivery task in [`delivery.md`](./delivery.md) cites the ids it satisfies, so coverage can be
proven at submission rather than hoped for.

## How to read this

| Class | Meaning |
| ----- | ------- |
| **MUST** | Stated explicitly in the brief. Missing one is a failed submission. |
| **SHOULD** | Listed by the brief under "Optional (Nice to Have)". |
| **IMPLIED** | Not stated, but unavoidable for the submission to function. |
| **GRADED** | Named as an evaluation axis rather than a feature. Describes no screen, but decides the score. |
| **OURS** | Not in the brief. We chose to add it. First to be cut under time pressure. |

Gherkin blocks are **prose specifications**, not executable step files — this project does not
use jest-cucumber. Their job is to make "done" a fact rather than an opinion. `Then` steps are
observable: something on screen, in persisted storage, or in a network log.

---

## Index

| Id | Requirement | Class |
| -- | ----------- | ----- |
| R-01 | React Native application | MUST |
| R-02 | React Query for API caching | MUST |
| R-03 | A state management library | MUST |
| R-04 | UI library (optional) | SHOULD |
| R-05 | Use the responserift.dev API | MUST |
| R-06 | Bottom tabs — Chats and Settings | MUST |
| R-07 | Chats: fetch contacts from `GET api/users` | MUST |
| R-08 | Chats: each row shows avatar, name, last message, timestamp | MUST |
| R-09 | Chats: pagination by infinite scroll | MUST |
| R-10 | Chats: tapping a row opens the Chat screen | MUST |
| R-11 | Chat: list messages from `GET api/posts` | MUST |
| R-12 | Chat: message input at the bottom | MUST |
| R-13 | Chat: send a message with `POST api/posts` | MUST |
| R-14 | Chat: optimistic mutation update | MUST |
| R-15 | Chat: tapping the header opens the Profile screen | MUST |
| R-16 | Profile: name, avatar, phone number | MUST |
| R-17 | Profile: fetched with React Query | MUST |
| R-18 | Profile: block/unblock toggle in global state | MUST |
| R-19 | Settings: static info — name and app version | MUST |
| R-20 | README: project structure and architecture overview | MUST |
| R-21 | README: how AI tools aided development | MUST |
| R-22 | README: screenshots and/or recordings | MUST |
| R-23 | Public GitHub repository | MUST |
| R-24 | APK committed to the repository | MUST |
| R-25 | Delivered within four days | MUST |
| R-26 | Performance | GRADED |
| R-27 | State management quality | GRADED |
| R-28 | React Query depth | GRADED |
| R-29 | App architecture | GRADED |
| R-30 | UI/UX | GRADED |
| R-31 | Smooth transitions | SHOULD |
| R-32 | Automation tests | SHOULD |
| R-33 | Performance optimisation | SHOULD |
| R-34 | Empty view placeholders | SHOULD |
| R-35 | The app runs on a physical Android device from the APK | IMPLIED |
| O-01 | Sent messages persist locally across restarts | OURS |
| O-02 | Internationalisation — en, ms, id | OURS |
| O-03 | Dark mode | OURS |
| O-04 | Offline handling and send retry | OURS |
| O-05 | Documentation tree and decision records | OURS |

---

## Technology

### R-01 · React Native application

**Source**: "React Native (with or without Expo)"
**Class**: MUST

**Done when** the app is a React Native application that builds and runs on Android.

Satisfied by Expo SDK 57 with prebuild — see
[ADR context in tech-docs](./tech-docs.md#platform-and-build).

### R-02 · React Query for API caching

**Source**: "React Query for API caching"
**Class**: MUST · **Graded axis**: R-28

**Done when** every server read goes through TanStack Query, and no screen fetches with a bare
`useEffect`.

```gherkin
Scenario: Returning to a screen does not refetch from scratch
  Given the user has loaded the contacts list
  When the user opens a chat and navigates back
  Then the contacts list renders immediately from cache
  And no loading skeleton is shown
```

### R-03 · A state management library

**Source**: "State Management library ie Zustand, Redux, Mob (any of choice)"
**Class**: MUST · **Graded axis**: R-27

**Done when** client-only state lives in Zustand, separate from the React Query cache.
Rationale: [ADR 0001](../../docs/explanation/adr/0001-state-management-zustand.md).

### R-04 · UI library

**Source**: "Any UI library (optional - any of choice)"
**Class**: SHOULD (explicitly optional)

**Decision**: no UI library. A hand-built design-token layer is used instead — see
[Design tokens](../../docs/reference/design-tokens.md). Declining an optional item is a
decision, and it is recorded rather than silently skipped.

### R-05 · Use the responserift.dev API

**Source**: "The API you will use is https://responserift.dev/. You may use api/users for
contacts, api/posts as messages."
**Class**: MUST

**Done when** contacts come from `api/users` and messages from `api/posts`, with the shapes
recorded in [api-contract.md](../../docs/reference/api-contract.md).

---

## Navigation

### R-06 · Bottom tabs — Chats and Settings

**Source**: "Bottom Tabs: 1. Chat Tab 2. Settings Tab"
**Class**: MUST

```gherkin
Scenario: Both tabs are reachable from anywhere in the tab group
  Given the app is open on the Chats tab
  When the user taps the Settings tab
  Then the Settings screen is shown
  And the Settings tab is marked as selected

Scenario: Tab state survives switching away and back
  Given the user has scrolled the contacts list to the second page
  When the user switches to Settings and back to Chats
  Then the list is still showing the second page
  And it has not scrolled back to the top
```

---

## Chats tab

### R-07 · Fetch contacts from `GET api/users`

**Source**: "Fetch list of conversations `GET api/users`"
**Class**: MUST

```gherkin
Scenario: The contacts list loads
  Given the app is opened for the first time
  When the Chats tab finishes loading
  Then the first page of contacts is shown
  And each row shows that contact's real name and avatar

Scenario: The list shows a skeleton before data arrives
  Given the contacts request has not yet resolved
  When the user looks at the Chats tab
  Then a skeleton placeholder is shown
  And no empty-state message is shown

Scenario: A failed load offers a retry
  Given the contacts request fails
  When the user looks at the Chats tab
  Then an error message is shown with a retry control
  And tapping retry re-issues the request
```

### R-08 · Each row shows avatar, name, last message, timestamp

**Source**: "Each Item shows: Avatar, Name, Last message (placeholder), Timestamp (placeholder)"
**Class**: MUST

The brief marks last message and timestamp as *placeholders*. Our resolution: a row shows the
**real** last message once the user has sent one, and an honest empty state otherwise. We do
not invent preview text — see
[ADR 0004](../../docs/explanation/adr/0004-message-model-and-outbox.md).

```gherkin
Scenario: A contact with no history shows an honest empty state
  Given the user has never messaged Alice
  When the user looks at Alice's row in the Chats list
  Then the row shows Alice's avatar and name
  And the preview line reads "Tap to start chatting"
  And no timestamp is shown

Scenario: A contact with history shows the real last message
  Given the user has sent "see you at 6" to Alice
  When the user returns to the Chats list
  Then Alice's row shows "see you at 6" as the preview
  And the row shows a relative timestamp

Scenario: The list reflects a new message immediately
  Given the user is viewing Alice's row showing "Tap to start chatting"
  When the user opens Alice's chat and sends "hello"
  And navigates back to the Chats list
  Then Alice's row shows "hello"
  And the timestamp reads as just now

Scenario: Long content does not break the row
  Given a contact has a very long name and a very long last message
  When the row is rendered
  Then both are truncated on a single line each
  And the timestamp remains visible
```

### R-09 · Pagination by infinite scroll

**Source**: "Pagination (infinite scroll)"
**Class**: MUST · **Graded axis**: R-28

The API is offset-paginated and reports `total: 60`.

```gherkin
Scenario: Scrolling loads the next page
  Given the first page of 20 contacts is shown
  When the user scrolls to the end of the list
  Then a loading footer appears
  And the next 20 contacts are appended below the existing ones

Scenario: The list stops at the end of the data
  Given all 60 contacts have loaded
  When the user scrolls to the bottom
  Then no further request is made
  And no loading footer is shown

Scenario: Pagination does not duplicate rows
  Given the user has scrolled through all three pages
  When the user reviews the list
  Then each contact appears exactly once
```

### R-10 · Tapping a row opens the Chat screen

**Source**: "Tap item navigates to Chat Screen"
**Class**: MUST

```gherkin
Scenario: Opening a conversation
  Given the contacts list is shown
  When the user taps Alice's row
  Then the Chat screen for Alice is pushed
  And the header shows Alice's name and avatar
```

---

## Chat screen

### R-11 · List messages from `GET api/posts`

**Source**: "Shows a list of messages by user `GET api/posts`"
**Class**: MUST

Server posts are filtered per contact with `?userId=`, and render as **incoming** messages —
the API has no sender field, so nothing else is defensible.

```gherkin
Scenario: A contact's messages are shown
  Given Alice has three posts on the server
  When the user opens Alice's chat
  Then three incoming messages are shown
  And they are ordered oldest to newest

Scenario: Only this contact's messages appear
  Given Bob also has posts on the server
  When the user opens Alice's chat
  Then no message authored by Bob is shown

Scenario: A conversation with no history shows an empty state
  Given a contact has no posts and the user has sent nothing
  When the user opens that chat
  Then an empty-conversation placeholder is shown
  And the message input remains usable
```

### R-12 · Message input at the bottom

**Source**: "Message input at bottom of screen"
**Class**: MUST · **Graded axis**: R-30

```gherkin
Scenario: The keyboard does not cover the input
  Given the user is viewing a chat
  When the user focuses the message input
  Then the input sits directly above the keyboard
  And the newest message remains visible

Scenario: The input clears after sending
  Given the user has typed "hello"
  When the user sends the message
  Then the input is empty
  And the keyboard stays open for the next message

Scenario: An empty message cannot be sent
  Given the message input contains only whitespace
  When the user looks at the send control
  Then the send control is disabled
```

### R-13 · Send a message with `POST api/posts`

**Source**: "Send text message `POST api/posts`"
**Class**: MUST

```gherkin
Scenario: A message is sent to the server
  Given the user is in Alice's chat
  When the user sends "hello"
  Then a POST request is made to api/posts with Alice's userId and the body "hello"
  And the message is shown as an outgoing bubble
```

### R-14 · Optimistic mutation update

**Source**: "Optimistically update the mutation"
**Class**: MUST · **Graded axis**: R-28

This is the requirement the whole architecture turns on. `POST api/posts` returns `201` but
does not persist, and always returns `id: 101`, so the standard optimistic-update-with-rollback
pattern is wrong here — rolling back would delete content the user wrote.

```gherkin
Scenario: The message appears before the request resolves
  Given the network is slow
  When the user sends "hello"
  Then "hello" appears in the thread immediately
  And it shows a pending indicator

Scenario: A successful send is marked delivered
  Given the user has sent "hello"
  When the server responds successfully
  Then the pending indicator becomes a delivered indicator

Scenario: A failed send is kept, not discarded
  Given the device is offline
  When the user sends "hello"
  Then "hello" appears in the thread immediately
  And it is marked as failed with a retry affordance
  And it is not removed from the conversation

Scenario: Retrying a failed message
  Given a message to Alice is marked as failed
  And the device is back online
  When the user taps the retry affordance
  Then the message returns to the pending state
  And on success it is marked delivered

Scenario: Sending does not destroy earlier messages
  Given the user has previously sent three messages to Alice
  When the user sends a fourth message
  Then all four messages are visible
  And no refetch of Alice's thread is triggered
```

### R-15 · Tapping the header opens the Profile screen

**Source**: "Tap on header with contact avatar navigates to Profile Screen"
**Class**: MUST

```gherkin
Scenario: Opening a contact profile from the chat header
  Given the user is in Alice's chat
  When the user taps the header
  Then Alice's profile screen is pushed
  And it shows Alice's details
```

---

## Profile screen

### R-16 · Name, avatar, phone number

**Source**: "Basic User Info: Name, Avatar, Phone Number"
**Class**: MUST

```gherkin
Scenario: The profile shows the contact's details
  Given the user opens Alice's profile
  When the screen renders
  Then Alice's name, avatar and phone number are shown

Scenario: A missing avatar degrades gracefully
  Given a contact's avatar image fails to load
  When the profile renders
  Then a placeholder is shown in its place
  And the rest of the profile is unaffected
```

### R-17 · Fetched with React Query

**Source**: "Use React Query for profile fetching"
**Class**: MUST · **Graded axis**: R-28

The contacts list already carries every field the profile needs, so the detail query is seeded
from the list cache and refetched in the background.

```gherkin
Scenario: The profile opens without a spinner
  Given the contacts list has already loaded Alice
  When the user opens Alice's profile
  Then her details are shown immediately
  And no loading spinner is shown

Scenario: The profile is refreshed in the background
  Given Alice's profile has been opened from cached data
  When the background refetch completes
  Then the screen reflects the freshest server data
  And the screen does not flicker
```

### R-18 · Block/unblock toggle in global state

**Source**: "Add simple Block/Unblock toggle stored in global state"
**Class**: MUST · **Graded axis**: R-27

Blocking is wired to three surfaces so the global state is demonstrably global.

```gherkin
Scenario: Blocking a contact
  Given the user is on Alice's profile
  When the user taps Block
  Then the control changes to Unblock
  And Alice's chat replaces the message input with an unblock bar
  And Alice's row in the Chats list shows a blocked indicator

Scenario: Blocked history remains readable
  Given Alice is blocked
  When the user opens Alice's chat
  Then existing messages are still visible
  And no message can be sent

Scenario: Unblocking restores sending
  Given Alice is blocked
  When the user taps Unblock on her profile
  Then the message input returns in Alice's chat
  And the blocked indicator disappears from the Chats list

Scenario: The blocked state survives a restart
  Given Alice is blocked
  When the app is force-quit and reopened
  Then Alice is still blocked
```

---

## Settings screen

### R-19 · Static info — name and app version

**Source**: "Basic static info eg your name, app version"
**Class**: MUST

```gherkin
Scenario: Settings shows the developer name and app version
  Given the user opens the Settings tab
  When the screen renders
  Then the developer's name is shown
  And the app version matching the build is shown

Scenario: The version is not hardcoded
  Given the app version is changed in the build configuration
  When the app is rebuilt and Settings is opened
  Then the newly configured version is shown
```

---

## Submission

### R-20 · README: project structure and architecture overview

**Source**: "Give a brief of overview of the project structure and other architectural design
elements you would want to highlight in a README.md file."
**Class**: MUST

**Done when** the README describes the folder layout, the dependency direction, and the
architectural decisions worth highlighting — with the outbox design given prominence, since it
is the non-obvious one.

### R-21 · README: how AI tools aided development

**Source**: "You are allowed to use any AI tools as long as you explain how it aided in your
development."
**Class**: MUST

**Done when** the README states specifically what the AI did, what the human decided, and where
the human overruled the AI — verifiable against the committed `.claude/`, `plans/`, and the
commit history.

### R-22 · README: screenshots and/or recordings

**Source**: "including screenshots and/or screen recordings of the app in the Readme.md"
**Class**: MUST

**Done when** the README contains a screenshot grid of the four screens plus a GIF of the
send → optimistic → persist → list-updates flow, all rendering inline on GitHub.

### R-23 · Public GitHub repository

**Source**: "Use the public Github Repository for the code and share the link when submitting"
**Class**: MUST

**Done when** the repository is public and the link is shared.

### R-24 · APK committed to the repository

**Source**: "An APK file will be required which should be committed to the same repository.
(important)"
**Class**: MUST — the brief marks this one **important**

```gherkin
Scenario: A reviewer can install the app from the repository
  Given a reviewer has cloned the repository
  When they install the committed APK on an Android device
  Then the app launches and the contacts list loads
```

**Done when** `release/rift-chat-v1.0.0.apk` is committed, its SHA-256 is published in the
README, and it has been installed and smoke-tested on a device from that exact file.

### R-25 · Delivered within four days

**Source**: "The deadline for this task is four (4) days from the time you receive this email."
**Class**: MUST

**Done when** the repository is submitted within the window. Protected by the P0/P1/P2 tiering
and the hard day-3 cut line in [`delivery.md`](./delivery.md).

### R-35 · The app runs on a physical Android device from the APK

**Class**: IMPLIED

Not stated, but a submission whose APK does not install is a failed submission regardless of
code quality. Verified by installing the committed artifact, not a local debug build.

---

## Graded axes

These name no screen, but they decide the score. Each needs evidence a reviewer can find.

### R-26 · Performance · R-33 · Performance optimisation

**Source**: "performance ... will be evaluated" / "Performance optimization"
**Class**: GRADED / SHOULD

**Evidence required**: measured numbers, not adjectives — render counts before and after
memoisation, and `gfxinfo` janky-frame percentages from the release build.
**Acceptance bar**: janky frames below 5% during sustained scroll.

```gherkin
Scenario: Fetching a page does not re-render existing rows
  Given the first page of contacts is rendered
  When the next page is fetched and appended
  Then no already-visible row re-renders

Scenario: Scrolling stays smooth on a release build
  Given the release APK is installed on the test device
  When the contacts list is scrolled continuously
  Then fewer than 5% of frames are janky

Scenario: Recycled rows never show the wrong avatar
  Given the user scrolls the contacts list quickly
  When rows are recycled
  Then no row displays a previous contact's avatar
```

### R-27 · State management quality

**Source**: "state management ... will be evaluated"
**Class**: GRADED

**Evidence required**: a clean, stated boundary between server and client state, and one change
visibly propagating across screens.

```gherkin
Scenario: One state change is reflected on every screen that shows it
  Given the user blocks Alice from her profile
  When the user navigates to the Chats list and then into Alice's chat
  Then both screens reflect the blocked state without a reload
```

### R-28 · React Query depth

**Source**: "React Query (caching, mutations, infinite queries, optimistic updates)"
**Class**: GRADED

All four named capabilities must be genuinely exercised: caching (R-02, R-17), infinite
queries (R-09), mutations (R-13), optimistic updates (R-14).

### R-29 · App architecture

**Source**: "app architecture ... will be evaluated"
**Class**: GRADED

**Evidence required**: a stated structure with a one-way dependency direction, and a defensible
answer for where complexity was *not* added. See
[Architecture](../../docs/explanation/architecture.md).

### R-30 · UI/UX

**Source**: "UI/UX will be evaluated"
**Class**: GRADED

**Evidence required**: an app that feels finished — all four screen states handled, keyboard
behaviour correct, nothing that jumps or flashes.

### R-31 · Smooth transitions

**Source**: "Smooth transitions"
**Class**: SHOULD

```gherkin
Scenario: Navigating into a chat is animated
  Given the user is on the contacts list
  When the user taps a contact
  Then the chat screen animates in
  And the animation does not drop frames
```

### R-32 · Automation tests

**Source**: "Automation tests"
**Class**: SHOULD

**Done when** the risky logic is covered — pagination stop condition, the optimistic send
lifecycle including failure and retry, the outbox merge, and persistence — plus one
device-level Maestro flow. See
[Testing strategy](../../docs/explanation/testing-strategy.md).

### R-34 · Empty view placeholders

**Source**: "Empty view placeholders"
**Class**: SHOULD

```gherkin
Scenario: Every list has an empty state
  Given a list has loaded successfully with no items
  When the user views it
  Then a placeholder explains what would appear there
  And no spinner is shown
```

---

## Our additions

Not requested by the brief. Recorded separately so they are never presented as brief
requirements, and so they are the first candidates for the day-3 cut.

### O-01 · Sent messages persist locally across restarts

**Rationale**: the API does not persist writes. Without local persistence, every sent message
disappears — which would make the optimistic update meaningless and the app feel broken.
This addition is what makes R-09 and R-14 demonstrable.

```gherkin
Scenario: A sent message survives an app restart
  Given the user has sent "hello" to Alice
  When the app is force-quit and reopened
  And the user opens the conversation with Alice
  Then "hello" is visible in the thread
  And it is marked as delivered

Scenario: Threads grow with use
  Given the user has sent five messages to Alice over several sessions
  When the user opens Alice's chat
  Then all five messages are shown alongside her server posts
  And they are ordered by time
```

### O-02 · Internationalisation — en, ms, id

```gherkin
Scenario: The app opens in the device language
  Given the device language is Indonesian
  When the app is opened for the first time
  Then all interface text is shown in Indonesian

Scenario: Changing language takes effect immediately
  Given the app is showing English
  When the user selects Malay in Settings
  Then all visible text changes to Malay without a restart

Scenario: The language choice persists
  Given the user has selected Malay
  When the app is force-quit and reopened
  Then the app is still in Malay

Scenario: An unsupported device language falls back to English
  Given the device language is French
  When the app is opened
  Then all interface text is shown in English
```

### O-03 · Dark mode

```gherkin
Scenario: The app follows the system theme
  Given the device is in dark mode
  When the app is opened
  Then the app renders in its dark palette

Scenario: An explicit theme choice overrides the system
  Given the device is in light mode
  When the user selects Dark in Settings
  Then the app renders in its dark palette

Scenario: The theme is applied before the first paint
  Given the user has selected Dark
  When the app is cold-started
  Then no light-themed frame is shown before the dark theme applies
```

### O-04 · Offline handling and send retry

```gherkin
Scenario: Going offline is surfaced
  Given the app is open
  When the device loses connectivity
  Then an offline indicator is shown

Scenario: Queries pause rather than fail while offline
  Given the device is offline
  When the user opens a screen that needs fresh data
  Then no failed-request error is shown
  And the request is issued once connectivity returns

Scenario: Queued messages send on reconnect
  Given a message to Alice failed while offline
  When connectivity returns
  Then the message is sent automatically
  And it is marked as delivered
```

### O-05 · Documentation tree and decision records

Diátaxis docs, four ADRs, and the committed `.claude/` agent and skill catalog. Serves R-20 and
R-21 by making the process inspectable rather than merely described.

---

## Explicitly out of scope

Named so that their absence reads as a decision:

- **Authentication** — the API has none.
- **Real-time delivery / websockets** — the API offers no such transport.
- **Search, unread counts, typing indicators, read receipts, attachments, group chats** — not
  in the brief, and each would invent product.
- **Editing or deleting messages** — not in the brief.
- **iOS as a graded target** — the code is cross-platform and verified on the simulator, but
  the APK is the deliverable, so Android is where QA, performance measurement, and the demo
  recording happen.

## Traceability

Every task in [`delivery.md`](./delivery.md) cites the requirement ids it satisfies. Before
submission, `requirement-extractor` runs in coverage-check mode: any requirement with no task
citing it is a **CRITICAL** finding, because a dropped requirement is the one failure mode this
document exists to prevent.
