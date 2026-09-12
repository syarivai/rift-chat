---
title: 'Project structure'
description: What lives where, and the dependency direction between folders.
category: reference
---

# Project structure

```text
rift-chat/
├── app.json                  # Expo config (name, bundle ids, plugins)
├── package.json              # scripts, dependencies, jest overrides
├── eslint.config.js          # ESLint flat config
├── jest.config.js            # jest-expo preset, coverage thresholds, transforms
├── .husky/                   # git hooks: pre-commit, pre-push
├── .maestro/                 # the end-to-end UI flow
├── .github/workflows/ci.yml  # type-check, lint, format, test on every push
├── docs/                     # this documentation (Diátaxis)
├── plans/rift-chat-mvp/      # requirement.md, tech-docs.md, delivery.md
├── release/                  # the submitted APK  (committed)
└── src/
    ├── app/                  # expo-router routes (expo-router finds src/app automatically)
    │   ├── _layout.tsx       #   providers: QueryClient, i18n, theme, safe area
    │   ├── (tabs)/
    │   │   ├── _layout.tsx   #     the bottom tab bar
    │   │   ├── index.tsx     #     Chats
    │   │   └── settings.tsx  #     Settings
    │   ├── chat/[id].tsx     #   Chat thread (pushed over the tabs)
    │   └── profile/[id].tsx  #   Contact profile
    ├── core/                 # cross-cutting infrastructure
    │   ├── api/              #   base-http-client.ts (axios) · rift-api.ts · types.ts
    │   ├── store/            #   store.ts (Zustand) · storage.ts (MMKV adapter) · types.ts
    │   ├── query-keys/       #   the single query-key factory
    │   ├── theme/            #   design tokens, light/dark palettes, useTheme
    │   ├── i18n/             #   i18next setup + en/ms/id catalogs
    │   ├── format/           #   relative-time formatting
    │   ├── network/          #   NetInfo → React Query onlineManager wiring
    │   └── ui/               #   shared primitives: Avatar, Skeleton, EmptyState, ErrorState
    └── features/
        ├── chats/            # the conversation list
        │   ├── api/          #   useContactsInfinite
        │   ├── model/        #   row view-model, last-message selector
        │   └── ui/           #   ChatsScreen, ContactRow
        ├── chat/             # the message thread — the feature with real logic
        │   ├── api/          #   useMessages, useSendMessage
        │   └── ui/           #   ChatScreen, MessageBubble, Composer, BlockedBar
        ├── profile/
        │   ├── api/          #   useContact
        │   ├── model/        #   blocked-contacts slice
        │   └── ui/           #   ProfileScreen
        └── settings/
            └── ui/           #   SettingsScreen, LanguagePicker, ThemePicker
```

## Dependency direction

```text
app  →  features  →  core
```

- `core/` imports nothing from `features/`. It is the only place that touches a native module
  directly — wrapped once, in one thin module, not behind an interface with a single
  implementation.
- A feature slice imports from `core/` and from itself. **Slices do not import each other** —
  if two need the same thing, it moves to `core/`.
- `model/` holds pure logic and store slices; it imports no React components.
- Tests mock the native module (`react-native-mmkv`, NetInfo) with `jest.mock`, which is what
  Jest is for.

Only the `chat` slice has a `model/` layer with real business rules — the outbox merge,
ordering, and status lifecycle. That is deliberate; see
[Architecture](../explanation/architecture.md).

There are no barrel `index.ts` files. Import the module you mean.

## Naming conventions

- Files: `kebab-case.ts`; one primary export per file where practical.
- No barrels. Import the file directly through the `@/` alias (`@/core/query-keys/keys`).
- Tests: `*.test.ts(x)` co-located beside the unit.
- Path alias `@/*` → `src/*`. Never `../../../`.

See [Conventions](./conventions.md) for the rules as a checklist.
