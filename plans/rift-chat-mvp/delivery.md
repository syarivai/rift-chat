---
title: 'Delivery checklist'
description: The tiered, verifiable task list for rift-chat — the plan of record for implementation.
category: how-to
---

# Delivery — rift-chat

The **plan of record**. Implements [`requirement.md`](./requirement.md) per
[`tech-docs.md`](./tech-docs.md).

## How to use this

1. Take the next unchecked task **in tier order**. Never start a P2 while a P0 or P1 is open.
2. Read its acceptance criteria *before* writing code.
3. Run its verification command and read the output.
4. Tick the box **in the same commit as the work**. Never tick on intent.

If work you are about to do is not on this list, **add it here first**. This is the plan, not a
summary written afterwards.

## Tiers

| Tier | Meaning | Cut policy |
| ---- | ------- | ---------- |
| **P0** | Required by the brief. | Never cut. A missing P0 is a failed submission. |
| **P1** | High-value polish, or our additions that are already half-built. | Cut only if a P0 is at risk. |
| **P2** | Stretch. | **Cut at the end of day 3**, recorded in the README as a decision. |

## Executors

`[AI]` — the agent can do this unaided. `[HUMAN]` — needs a person: a device, a browser, an
account, or a judgement call.

## Schedule

| Day | Phases | Gate |
| --- | ------ | ---- |
| 1 | 0 · 1 · 2 | Contacts list scrolls with real data |
| 2 | 3 · 4 · 5 | Send works, persists, and survives a restart |
| 3 | 6 · 7 · 8 → **CUT LINE** | APK built and smoke-tested on a device |
| 4 | 9 · 10 | README complete, submitted |

Building the APK on **day 3, not day 4**, is deliberate. A release build that fails is the most
likely late surprise, and discovering it with a day left is recoverable.

---

## Phase 0 — Environment and baseline

- [ ] **T-0.1** `P0` `[AI]` · R-01 — Scaffold the Expo app
  - Do: `npx create-expo-app@latest . --template blank-typescript` into the existing repo,
    keeping `docs/`, `.claude/`, `plans/`, `CLAUDE.md`, and `take-home-assessment.md`.
  - Done when: `npm start` boots Metro without error.
  - Verify: `npx expo-doctor`

- [ ] **T-0.2** `P0` `[AI]` · R-01 — Configure `app.json`
  - Do: name "Rift Chat", slug `rift-chat`, Android package `dev.riftchat.app`, version
    `1.0.0`, `usesCleartextTraffic: false`, portrait orientation.
  - Verify: `npx expo config --type public | grep -E "package|version"`

- [ ] **T-0.3** `P0` `[AI]` · R-29 — TypeScript strict + `@/` path alias
  - Do: `strict: true`, `paths: { "@/*": ["src/*"] }` in `tsconfig.json`, matching Metro and
    Jest `moduleNameMapper`.
  - Verify: `npm run typecheck`

- [ ] **T-0.4** `P0` `[AI]` — Install the runtime dependencies
  - Do: `npx expo install expo-router expo-image expo-constants expo-localization
    react-native-reanimated react-native-worklets react-native-safe-area-context
    react-native-screens react-native-gesture-handler @react-native-community/netinfo
    react-native-mmkv` then `npm i @tanstack/react-query zustand i18next react-i18next`.
  - Done when: `npx expo-doctor` reports no version mismatches.
  - Verify: `npx expo install --check && npx expo-doctor && npm run typecheck`
  - **Never `npm install` a native or `expo-*` package.** Expo SDK 57 pins compatible versions;
    npm's `latest` is ahead of several, and `react-native-gesture-handler` is a whole major
    ahead (npm 3.2.x vs the SDK's 2.32.x). `expo install` resolves the right one.

- [ ] **T-0.5** `P0` `[AI]` — Install and pin the tooling
  - Do: `npm i -D jest jest-expo @testing-library/react-native msw eslint eslint-config-expo
    prettier eslint-config-prettier husky lint-staged @types/jest @types/node`.
    **Three pins are mandatory**, each verified against the actual dependency graph — see
    [Tech stack](../../docs/reference/tech-stack.md#version-pins-that-matter):
    **jest 29** (`jest-expo@57` depends on the 29 family), **ESLint 9.x**
    (`eslint-plugin-react` peers cap at `^9.7`), and **TypeScript 6.x**
    (`@typescript-eslint/parser@8` requires `<6.1.0`, so TS 7 breaks linting outright).
  - Done when: jest reports 29.x, ESLint 9.x, TypeScript 6.x.
  - Verify: `npx jest --version && npx eslint --version && npx tsc --version`

- [ ] **T-0.6** `P0` `[AI]` — npm scripts
  - Do: add every script in [Commands](../../docs/reference/commands.md), including
    `check` and `apk`.
  - Verify: `npm run check` (may fail on no tests — that is fine here)

- [ ] **T-0.7** `P0` `[AI]` — Guardrails
  - Do: ESLint flat config extending `eslint-config-expo` + `eslint-config-prettier`;
    Prettier config; `husky` pre-commit running lint-staged and pre-push running
    `npm run check`.
  - Done when: a deliberately misformatted staged file is auto-fixed on commit.
  - Verify: `npm run lint && npm run format:check`

- [ ] **T-0.8** `P0` `[AI]` · R-32 — Jest configuration
  - Do: `jest-expo` preset; `setupFilesAfterEnv` calling
    `require('react-native-reanimated').setUpTests()`; coverage scoped to
    `src/features/*/model` and `src/core`. **No MMKV mock** — `react-native-mmkv` ships its
    own Jest mock, so writing one would be re-solving a solved problem.
  - Done when: one trivial passing test runs.
  - Verify: `npm test`

- [ ] **T-0.9** `P0` `[AI]` · R-31 — Prove Reanimated works before it is needed
  - Do: render one trivial animated view.
  - Done when: it animates on device without a worklets error.
  - Verify: `npm run android`, observe
  - Why now: Reanimated 4 + worklets misconfiguration is a classic late blocker.

- [ ] **T-0.10** `P0` `[HUMAN]` · R-23 — Create the public GitHub repository
  - Do: `gh repo create rift-chat --public --source . --push`
  - Verify: `gh repo view --json visibility,url`

- [ ] **T-0.11** `P1` `[AI]` — Record the resolved versions
  - Do: after install, reconcile [Tech stack](../../docs/reference/tech-stack.md) against what
    actually landed in `package.json`. The doc is written from Expo's SDK 57 manifest; if a
    resolved version differs, the doc is what gets corrected.
  - Verify: `npx expo install --check` reports no drift

- [ ] **T-0.12** `P1` `[AI]` · R-25 — CI workflow
  - Do: `.github/workflows/ci.yml` — Node 24, `npm ci`, then `npm run check`.
  - Verify: `gh run list --limit 1` shows a green run

### Phase 0 gate

`npm run check` green · app boots on a device · repo public and pushed · CI green.
**Do not start Phase 1 until this passes.** Everything downstream assumes this baseline.

---

## Phase 1 — Core infrastructure

- [ ] **T-1.1** `P0` `[AI]` · R-05 — API client and wire types
  - Do: `core/api` — `fetchJson` (URL builder, JSON header, throws on non-2xx and on a shape
    that fails a narrow runtime check) plus `Envelope<T>`, `Contact`, `Post` mirroring
    [api-contract.md](../../docs/reference/api-contract.md).
  - Done when: types match the documented shapes exactly.
  - Verify: `npm run typecheck`

- [ ] **T-1.2** `P0` `[AI]` · R-02 R-28 — Query key factory
  - Do: `core/query-keys` with `contacts.list/detail` and `messages.thread`, `as const`.
  - Verify: `npm run typecheck`

- [ ] **T-1.3** `P0` `[AI]` · R-02 — QueryClient and provider
  - Do: `staleTime: 60_000`, `retry: 2`, `refetchOnWindowFocus: false`; mounted in
    `app/_layout.tsx`.
  - Verify: `npm run typecheck`

- [ ] **T-1.4** `P0` `[AI]` · R-03 R-27 — Zustand store with MMKV persistence
  - Do: `core/store` — `outbox`, `blocked`, `prefs` slices behind `persist` with
    `createJSONStorage` over an MMKV adapter. **MMKV v4 API**: `createMMKV()` (a factory, not
    `new MMKV()`), and `remove()` rather than `delete()` for `removeItem`.
  - Acceptance: R-18 *"The blocked state survives a restart"*.
  - Verify: `npm test -- store`

- [ ] **T-1.5** `P0` `[AI]` · R-30 — Design tokens and theming
  - Do: `core/theme` — semantic colour tokens with light and dark maps, spacing, radius, and
    type scales; `useTheme()`; resolution order explicit → OS → light.
  - Done when: every token key exists in both palettes.
  - Verify: `npm run typecheck`

- [ ] **T-1.6** `P1` `[AI]` · O-02 — i18n bootstrap
  - Do: `core/i18n` — i18next + react-i18next, device locale via `expo-localization`,
    `en`/`ms`/`id` catalogs, `en` fallback.
  - Acceptance: O-02 *"The app opens in the device language"*, *"...falls back to English"*.
  - Verify: `npm test -- i18n`

- [ ] **T-1.7** `P0` `[AI]` · R-34 — Shared UI primitives
  - Do: `core/ui` — `Screen`, `Avatar` (expo-image, `recyclingKey`, placeholder on error),
    `Skeleton`, `EmptyState`, `ErrorState` (with retry).
  - Verify: `npm test -- core/ui`

- [ ] **T-1.8** `P0` `[AI]` · R-06 — Navigation shell
  - Do: `app/(tabs)/_layout.tsx` with Chats and Settings; `chat/[id]` and `profile/[id]` routes
    pushing over the group; route params validated.
  - Acceptance: R-06 *"Both tabs are reachable"*.
  - Verify: `npm run android`, tap both tabs

- [ ] **T-1.9** `P0` `[AI]` · R-32 — MSW handlers
  - Do: `src/test/msw` reproducing the real shapes **including the quirks** — `POST` returns
    `id: 101` and does not mutate the collection.
  - Done when: a handler-backed test can assert the collection is unchanged after a POST.
  - Verify: `npm test -- msw`

### Phase 1 gate

`npm run check` green · both tabs render · store persists across a reload.

---

## Phase 2 — Chats tab

- [ ] **T-2.1** `P0` `[AI]` · R-07 R-09 R-28 — `useContactsInfinite`
  - Do: `useInfiniteQuery` over `GET /api/users`, 20 per page, `getNextPageParam` returning
    `undefined` when `offset + limit >= total`.
  - Acceptance: R-09 *"Scrolling loads the next page"*, *"The list stops at the end of the
    data"*, *"Pagination does not duplicate rows"*.
  - Verify: `npm test -- contacts`

- [ ] **T-2.2** `P0` `[AI]` · R-08 — `ContactRow`
  - Do: memoised, declared outside the parent, fixed height, avatar + name + preview +
    timestamp; no inline arrow props or style objects.
  - Verify: `npm test -- contact-row`

- [ ] **T-2.3** `P0` `[AI]` · R-08 O-01 — Last-message selector
  - Do: read the contact's outbox tail; real message + relative timestamp if present,
    otherwise the empty-state string and no timestamp.
  - Acceptance: R-08 *"A contact with no history shows an honest empty state"*, *"A contact
    with history shows the real last message"*.
  - Verify: `npm test -- last-message`

- [ ] **T-2.4** `P0` `[AI]` · R-07 R-09 R-33 — Chats screen
  - Do: `FlatList` with `keyExtractor`, `getItemLayout`, tuned window props,
    `onEndReached` guarded by `hasNextPage && !isFetchingNextPage`, footer spinner,
    pull-to-refresh.
  - Verify: `npm test -- chats-screen`

- [ ] **T-2.5** `P0` `[AI]` · R-34 R-30 — Chats screen states
  - Do: skeleton on first load, empty state, error state with a working retry.
  - Acceptance: R-07 *"The list shows a skeleton before data arrives"*, *"A failed load offers
    a retry"*.
  - Verify: `npm test -- chats-screen`

- [ ] **T-2.6** `P0` `[AI]` · R-10 — Navigate to the chat
  - Acceptance: R-10 *"Opening a conversation"*.
  - Verify: `npm run android`, tap a row

### Phase 2 gate

60 contacts load across three pages and stop · every screen state renders · `npm run check`
green.

---

## Phase 3 — Chat screen and the outbox

The core of the assignment. Test-first throughout — this is the one place with real logic.

- [ ] **T-3.1** `P0` `[AI]` · R-14 O-01 — Outbox types and reducer
  - Do: `OutboxMessage` discriminated union; `enqueue`, `markSent`, `markFailed`, `retry`;
    illegal transitions (`sent → sending`, `sent → failed`) rejected.
  - Done when: tests cover every legal and illegal transition.
  - Verify: `npm test -- outbox`

- [ ] **T-3.2** `P0` `[AI]` · R-11 O-01 — `mergeThread` (pure)
  - Do: map posts to incoming and outbox to outgoing, sort by `createdAt` ascending with a
    stable tiebreaker.
  - Done when: a test proves the order is identical across repeated calls with equal timestamps.
  - Verify: `npm test -- merge-thread`

- [ ] **T-3.3** `P0` `[AI]` · R-11 R-28 — `useThread`
  - Do: `useInfiniteQuery` over `GET /api/posts?userId=N`, merged with the contact's outbox.
  - Acceptance: R-11 *"A contact's messages are shown"*, *"Only this contact's messages
    appear"*.
  - Verify: `npm test -- use-thread`

- [ ] **T-3.4** `P0` `[AI]` · R-13 R-14 — `useSendMessage`
  - Do: `onMutate` enqueues (durable before the request leaves), `onSuccess` marks sent from
    the response `createdAt`, `onError` marks failed. **No `invalidateQueries`. No rollback.
    The response `id` is discarded.**
    Signature note (v5.90+): the `onMutate` return arrives as the **third** argument
    (`onMutateResult`). Do not copy the docs' canonical optimistic recipe — it uses
    `cancelQueries`/`setQueryData`/`invalidateQueries`, none of which apply here.
  - Acceptance: R-14 *"The message appears before the request resolves"*, *"A successful send
    is marked delivered"*, *"A failed send is kept, not discarded"*, *"Sending does not destroy
    earlier messages"*.
  - Verify: `npm test -- send-message`
  - **This is the highest-risk task in the plan.** Re-read
    [state-boundaries](../../.claude/skills/state-boundaries/SKILL.md) before starting.

- [ ] **T-3.5** `P0` `[AI]` · R-14 — Retry a failed message
  - Acceptance: R-14 *"Retrying a failed message"*.
  - Verify: `npm test -- send-message`

- [ ] **T-3.6** `P0` `[AI]` · R-30 — `MessageBubble`
  - Do: incoming and outgoing variants; status affordance — pending, delivered, failed with a
    tappable retry. Failure indicated by icon *and* colour, never colour alone.
  - Verify: `npm test -- message-bubble`

- [ ] **T-3.7** `P0` `[AI]` · R-12 — `Composer`
  - Do: input pinned to the bottom, send disabled on whitespace-only, clears on send, keyboard
    stays open, trimmed and length-capped before enqueue.
  - Acceptance: R-12 *"The input clears after sending"*, *"An empty message cannot be sent"*.
  - Verify: `npm test -- composer`

- [ ] **T-3.8** `P0` `[AI]` · R-12 R-30 — Keyboard handling
  - Acceptance: R-12 *"The keyboard does not cover the input"*.
  - Verify: `npm run android`, focus the input on a full thread

- [ ] **T-3.9** `P0` `[AI]` · R-11 R-34 — Chat screen states
  - Do: skeleton, empty conversation placeholder, error with retry; auto-scroll to newest on
    send.
  - Acceptance: R-11 *"A conversation with no history shows an empty state"*.
  - Verify: `npm test -- chat-screen`

- [ ] **T-3.10** `P0` `[AI]` · R-15 — Header navigates to the profile
  - Acceptance: R-15 *"Opening a contact profile from the chat header"*.
  - Verify: `npm run android`, tap the header

- [ ] **T-3.11** `P0` `[HUMAN]` · O-01 — Verify persistence on a device
  - Do: send messages, force-quit, reopen.
  - Acceptance: O-01 *"A sent message survives an app restart"*.
  - Verify: manual, on device — an emulator restart is not the same test

### Phase 3 gate

Send works · the message persists across a force-quit · a failed send stays with a working
retry · sending repeatedly never removes an earlier message · `npm run check` green.

---

## Phase 4 — Profile and blocking

- [ ] **T-4.1** `P0` `[AI]` · R-16 R-17 R-28 — `useContact` seeded from the list cache
  - Do: `useQuery` with `initialData` from the contacts list cache **and**
    `initialDataUpdatedAt` — without the timestamp the seed counts as fresh and the background
    refetch never runs.
  - Acceptance: R-17 *"The profile opens without a spinner"*, *"The profile is refreshed in the
    background"*.
  - Verify: `npm test -- use-contact`

- [ ] **T-4.2** `P0` `[AI]` · R-16 — Profile screen
  - Do: name, avatar, phone; avatar failure degrades to a placeholder.
  - Acceptance: R-16 *"The profile shows the contact's details"*, *"A missing avatar degrades
    gracefully"*.
  - Verify: `npm test -- profile-screen`

- [ ] **T-4.3** `P0` `[AI]` · R-18 R-27 — Block/unblock toggle
  - Do: toggle the `blocked` slice; the control reflects state immediately.
  - Acceptance: R-18 *"Blocking a contact"*, *"The blocked state survives a restart"*.
  - Verify: `npm test -- blocked`

- [ ] **T-4.4** `P0` `[AI]` · R-18 R-27 — Blocked state across screens
  - Do: chat composer replaced by an unblock bar with history still visible; a blocked
    indicator on the Chats row.
  - Acceptance: R-18 *"Blocked history remains readable"*, *"Unblocking restores sending"*;
    R-27 *"One state change is reflected on every screen that shows it"*.
  - Verify: `npm test -- blocked`

### Phase 4 gate

Blocking from the profile changes the chat and the list without a reload, and survives a
restart.

---

## Phase 5 — Settings

- [ ] **T-5.1** `P0` `[AI]` · R-19 — Settings screen
  - Do: developer name and app version read from `expo-constants`.
  - Acceptance: R-19 *"Settings shows the developer name and app version"*, *"The version is
    not hardcoded"*.
  - Verify: `npm test -- settings`

- [ ] **T-5.2** `P1` `[AI]` · O-02 — Language picker
  - Do: System / English / Malay / Indonesian, persisted.
  - Acceptance: O-02 *"Changing language takes effect immediately"*, *"The language choice
    persists"*.
  - Verify: `npm test -- settings`

- [ ] **T-5.3** `P1` `[AI]` · O-03 — Theme picker
  - Do: System / Light / Dark, persisted.
  - Acceptance: O-03 *"An explicit theme choice overrides the system"*.
  - Verify: `npm test -- settings`

### Phase 5 gate

All four screens complete. **Every P0 feature requirement is now satisfied** — the rest of the
plan is quality, evidence, and submission.

---

## Phase 6 — Polish

- [ ] **T-6.1** `P1` `[AI]` · O-02 — i18n sweep
  - Do: every user-facing string moved to a key present in all three catalogs.
  - Done when: the key-parity check reports nothing missing.
  - Verify: `npm run lint && node scripts/check-i18n-parity.js`

- [ ] **T-6.2** `P1` `[AI]` · O-03 R-30 — Dark mode sweep
  - Do: no raw hex outside `core/theme`; hairlines, dividers and disabled states verified in
    dark.
  - Acceptance: O-03 *"The theme is applied before the first paint"*.
  - Verify: `grep -rnE "#[0-9a-fA-F]{3,8}" src/ --include=*.tsx | grep -v core/theme` (empty)

- [ ] **T-6.3** `P1` `[AI]` · R-30 — Accessibility pass
  - Do: `accessibilityLabel` and `accessibilityRole` on every touchable; 44×44 minimum targets;
    WCAG AA contrast in both themes.
  - Verify: `npm test` (queries resolve by role), then a manual screen-reader spot check

- [ ] **T-6.4** `P2` `[AI]` · R-31 — Screen transitions
  - Do: Reanimated transitions for list → chat → profile.
  - Acceptance: R-31 *"Navigating into a chat is animated"*.
  - Verify: `npm run android`, observe

- [ ] **T-6.5** `P2` `[AI]` · R-31 — Message send animation
  - Do: outgoing bubbles animate in.
  - Verify: `npm run android`, observe

### Phase 6 gate

All three locales and both themes render correctly on a device.

---

## Phase 7 — Offline

- [ ] **T-7.1** `P1` `[AI]` · O-04 — NetInfo → `onlineManager`
  - Acceptance: O-04 *"Queries pause rather than fail while offline"*.
  - Verify: `npm test -- network`

- [ ] **T-7.2** `P1` `[AI]` · O-04 — Offline banner
  - Acceptance: O-04 *"Going offline is surfaced"*.
  - Verify: `npm run android` with airplane mode

- [ ] **T-7.3** `P2` `[AI]` · O-04 — Flush the outbox on reconnect
  - Do: retry failed messages in order when connectivity returns.
  - Acceptance: O-04 *"Queued messages send on reconnect"*.
  - Verify: `npm test -- reconnect`

### Phase 7 gate

Airplane mode produces a banner, a failed send with retry, and no crash.

---

## Phase 8 — Testing

- [ ] **T-8.1** `P1` `[AI]` · R-32 — Close unit coverage gaps
  - Do: merge stability, every status transition, relative-time formatting in all three locales.
  - Verify: `npm run test:ci`

- [ ] **T-8.2** `P1` `[AI]` · R-32 — Close integration coverage gaps
  - Do: pagination stop condition, optimistic lifecycle including failure and retry, store
    rehydration.
  - Verify: `npm run test:ci`

- [ ] **T-8.3** `P1` `[AI]` · R-32 R-14 — The regression test that matters most
  - Do: assert that sending a message issues **no** refetch of the thread key, and that ten
    consecutive sends leave ten distinct messages.
  - Acceptance: R-14 *"Sending does not destroy earlier messages"*.
  - Verify: `npm test -- no-invalidate`
  - Why it exists: this is the one bug that would silently destroy user data and still look
    fine in a demo.

- [ ] **T-8.4** `P2` `[AI]` · R-32 — Maestro flow
  - Do: launch → scroll → open chat → send → restart → message persists → block.
  - Verify: `npm run e2e`

### Phase 8 gate

`npm run test:ci` green, coverage thresholds met.

---

## ⛔ CUT LINE — end of day 3

Stop and reassess. `[HUMAN]` decision.

- [ ] **T-CUT.1** `P0` `[AI]` — Run `delivery-tracker` and get an honest status by tier
- [ ] **T-CUT.2** `P0` `[HUMAN]` — Cut every unfinished P2 and record it in the README as a
      deliberate decision, not an omission
- [ ] **T-CUT.3** `P0` `[HUMAN]` · R-24 R-35 — **Build the APK and install it on a real
      device.** A release build that fails is the most likely late surprise; there is a day left
      to fix it.
  - Verify: `npm run apk` then `adb install -r release/rift-chat-v1.0.0.apk`, launch, load
    contacts, send a message

---

## Phase 9 — Performance evidence

- [ ] **T-9.1** `P1` `[AI]` · R-26 R-33 — Render-count instrumentation
  - Do: a `__DEV__`-guarded counter on `ContactRow`.
  - Acceptance: R-26 *"Fetching a page does not re-render existing rows"*.
  - Verify: `npm run android`, scroll one page, read the counter

- [ ] **T-9.2** `P1` `[AI]` · R-33 — Apply and measure the tuning
  - Do: memoisation, `getItemLayout`, window props, `recyclingKey`. Record render counts before
    and after.
  - Acceptance: R-26 *"Recycled rows never show the wrong avatar"*.
  - Verify: render counter reads zero re-renders on page fetch

- [ ] **T-9.3** `P1` `[HUMAN]` · R-26 — `gfxinfo` capture on the release build
  - Do: the scripted `adb input swipe` protocol from
    [Run and test](../../docs/how-to/run-and-test.md#measure-list-performance).
  - Acceptance: R-26 *"Scrolling stays smooth on a release build"* — **under 5% janky frames**.
  - Verify: `adb shell dumpsys gfxinfo dev.riftchat.app | head -20`
  - If the bar is missed after genuine tuning, that is
    [ADR 0003](../../docs/explanation/adr/0003-list-rendering-flatlist.md)'s named trigger to
    reconsider FlashList. Escalate rather than quietly lowering the bar.

- [ ] **T-9.4** `P1` `[AI]` · R-26 — Record the numbers
  - Do: before/after table into ADR 0003; headline numbers into the README.
  - Verify: `grep -A5 "## Verification" docs/explanation/adr/0003-list-rendering-flatlist.md`

### Phase 9 gate

Measured numbers exist. No performance adjective appears anywhere without a number beside it.

---

## Phase 10 — Release and submission

- [ ] **T-10.1** `P0` `[HUMAN]` · R-22 — Capture screenshots
  - Do: 4–6 PNGs — Chats, Chat with a sent message, Profile, Settings, plus dark mode and a
    non-English locale. Compress into `docs/assets/`.
  - Verify: files exist and are under ~300 KB each

- [ ] **T-10.2** `P0` `[HUMAN]` · R-22 — Record the demo GIF
  - Do: send → optimistic → persist → back to list → row updated. GIF, not MP4 — GitHub
    autoplays GIFs inline.
  - Verify: renders inline in a GitHub preview

- [ ] **T-10.3** `P0` `[AI]` · R-24 — Build and commit the final APK
  - Do: `npm run apk`, copy to `release/rift-chat-v1.0.0.apk`, record the SHA-256.
  - Verify: `shasum -a 256 release/rift-chat-v1.0.0.apk`

- [ ] **T-10.4** `P0` `[HUMAN]` · R-24 R-35 — Smoke-test the committed APK
  - Do: install **that exact file** on a device; launch, scroll, send, block, restart.
  - Acceptance: R-24 *"A reviewer can install the app from the repository"*.
  - Verify: manual, on device

- [ ] **T-10.5** `P0` `[AI]` · R-20 R-21 R-22 — Write the README
  - Do: run `readme-maker`. Must contain: demo assets, quick start, "the interesting part" (the
    API stores nothing and what that forced), architecture overview, the ADR table, measured
    performance numbers, testing summary, **the AI-usage section**, and what was cut and why.
  - Verify: every one of R-20, R-21, R-22, R-24 has a visible section

- [ ] **T-10.6** `P0` `[AI]` — Requirement coverage check
  - Do: run `requirement-extractor` in coverage mode.
  - Done when: every R-id is cited by at least one completed task, or is explicitly recorded as
    cut.
  - Verify: report shows zero uncovered MUST requirements

- [ ] **T-10.7** `P0` `[AI]` — Full quality pass
  - Do: run `rn-code-checker`, `rn-ui-checker`, `docs-maintainer` (check mode),
    `api-contract-verifier`, and `qa-tester`. Fix every HIGH-confidence CRITICAL and HIGH
    finding.
  - Verify: `npm run check` green, reports clean

- [ ] **T-10.8** `P0` `[AI]` — Move the plan to done
  - Do: tick every completed task; record cuts; final commit.
  - Verify: `delivery-tracker` reports no discrepancies

- [ ] **T-10.9** `P0` `[HUMAN]` · R-23 R-25 — Submit
  - Do: push, confirm the repository is public and the README renders, share the link.
  - Verify: open the repository URL in a logged-out browser

### Phase 10 gate

Public repository · README renders with images · APK installs from a fresh clone · every MUST
requirement covered.

---

## Satisfied outside the task list

Two requirements carry no task. Recorded here so the coverage check reports them as handled
rather than dropped:

| Id | Status |
| -- | ------ |
| **R-04** · UI library (optional) | **Declined deliberately.** A hand-built token layer is used instead — see [Design tokens](../../docs/reference/design-tokens.md) and [requirement.md](./requirement.md#r-04--ui-library). Declining an optional item is a decision, not an omission. |
| **O-05** · Documentation and decision records | **Already delivered** in commits `31cae3c` and `3f60a7d`, before implementation began. Maintained thereafter by `docs-maintainer`. |

## Progress

| Phase | P0 | P1 | P2 | Done |
| ----- | -- | -- | -- | ---- |
| 0 · Environment | 10 | 2 | 0 | 0/12 |
| 1 · Core | 8 | 1 | 0 | 0/9 |
| 2 · Chats | 6 | 0 | 0 | 0/6 |
| 3 · Chat & outbox | 11 | 0 | 0 | 0/11 |
| 4 · Profile | 4 | 0 | 0 | 0/4 |
| 5 · Settings | 1 | 2 | 0 | 0/3 |
| 6 · Polish | 0 | 3 | 2 | 0/5 |
| 7 · Offline | 0 | 2 | 1 | 0/3 |
| 8 · Testing | 0 | 3 | 1 | 0/4 |
| Cut line | 3 | 0 | 0 | 0/3 |
| 9 · Performance | 0 | 4 | 0 | 0/4 |
| 10 · Release | 9 | 0 | 0 | 0/9 |
| **Total** | **52** | **17** | **4** | **0/73** |

Update this table whenever a phase completes. `delivery-tracker` verifies it independently —
a table that disagrees with the checkboxes is itself a finding.
