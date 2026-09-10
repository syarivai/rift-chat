---
title: 'Run and test'
description: Day-to-day commands, building the release APK, measuring list performance, and troubleshooting.
category: how-to
---

# How to run and test

## Run the app

```bash
npm start             # Metro dev server, pick a target
npm run android       # build & run the Android dev build
npm run ios           # build & run the iOS dev build
```

`android` / `ios` run `expo run:android` / `run:ios`, which produce a **native development
build**. Expo Go cannot run this app — MMKV and Reanimated need native code that Expo Go does
not ship. `npm start` only serves JavaScript to an already-installed build.

If `android/` does not exist yet, or you changed `app.json`, regenerate it first:

```bash
npx expo prebuild -p android --clean
```

## Run tests

```bash
npm test                          # all Jest tests once
npm run test:watch                # watch mode while developing
npm run test:ci                   # coverage + thresholds (what CI runs)
npm test -- outbox                # files matching a path
npm test -- -t "rolls back"       # tests matching a name
```

## Run the guardrails locally

```bash
npm run typecheck
npm run lint          # add :fix to auto-fix
npm run format        # write; or format:check to verify
npm run check         # all four, in the CI order
```

`npm run check` is what the pre-push hook and CI both run. If it is green locally, CI will be
green. See [Guardrails](../explanation/guardrails.md).

## Run the end-to-end flow

Requires an emulator with a dev or release build installed, and the Maestro CLI:

```bash
npm run e2e
```

## Build the release APK

The APK is a required deliverable and lives at `release/rift-chat-v<version>.apk`.

```bash
# 1. Generate the native project from app.json
npx expo prebuild -p android --clean

# 2. Build the release variant
cd android && ./gradlew assembleRelease && cd ..

# 3. Copy it to release/ and record its checksum
mkdir -p release
cp android/app/build/outputs/apk/release/app-release.apk \
   release/rift-chat-v1.0.0.apk
shasum -a 256 release/rift-chat-v1.0.0.apk
```

Or in one step: `npm run apk`.

Put the SHA-256 in the README so a reviewer can verify the committed binary matches a build
they run themselves.

**Notes.** The release variant is signed with the debug keystore by default, which is fine for
a reviewer sideloading it and wrong for anything else — do not treat this APK as
distributable. Install it with `adb install -r release/rift-chat-v1.0.0.apk`. If Gradle fails
with a heap error, raise `org.gradle.jvmargs` in `android/gradle.properties`.

## Measure list performance

Performance claims in this repo are measured, not asserted. Two complementary measurements,
both described in [ADR 0003](../explanation/adr/0003-list-rendering-flatlist.md).

### Render counts (attribution)

The contact row logs a render count in development. Open the Chats tab, scroll one full page,
and read the counter. Before memoisation, fetching page two re-renders every already-mounted
row; after, it re-renders none. This tells you *what* changed.

### Frame jank (the outcome)

`gfxinfo` reads Android's own frame timings. Run it against the **release** APK — debug builds
are slow for unrelated reasons and any number you quote from one is meaningless.

```bash
PKG=dev.riftchat.app

adb shell dumpsys gfxinfo $PKG reset          # zero the counters
# scripted gesture — a human thumb is not reproducible between runs
for i in $(seq 1 15); do adb shell input swipe 540 1600 540 400 80; done
adb shell dumpsys gfxinfo $PKG | head -20     # read the summary
```

You are looking for these lines:

```text
Total frames rendered: 1187
Janky frames: 43 (3.62%)
50th percentile: 6ms   90th: 11ms   95th: 16ms   99th: 31ms
```

Record the janky-frame percentage and the 95th percentile before and after an optimisation,
on the same device with the same scripted gesture. `gfxinfo` is Android-only; on iOS use
Reanimated's `useFrameCallback` to read UI-thread frame deltas in-app.

## Troubleshooting

- **Metro cache weirdness** → `npm start -- --clear`.
- **Native module not found after adding a dependency** → rebuild the native app
  (`npm run android`), a JS reload is not enough.
- **`expo-doctor` warnings** → `npm run doctor` and follow its suggestions.
- **Jest fails with `clearMocksOnScope is not a function`** → a jest 30 package leaked in. The
  whole jest family must stay on v29 for `jest-expo` 57; the pins live in the `overrides`
  block of `package.json`. See [Tech stack](../reference/tech-stack.md).
- **ESLint crashes on load with `context.getFilename is not a function`** → ESLint 10 was
  installed. `eslint-config-expo` still depends on a plugin using an API ESLint 10 removed;
  stay on the latest 9.x.
- **`render` returns undefined in a component test** → RNTL v14's `render` is async:
  `await render(<C />)`.
- **MMKV throws on read in a test** → tests must use the in-memory storage adapter from
  `@/core/storage`, not the real MMKV instance. If you imported `react-native-mmkv` directly
  in feature code, that is the bug.
- **"The result of getSnapshot should be cached" or "Maximum update depth exceeded"** → a
  Zustand selector returning a new object every render. Wrap it with `useShallow` from
  `zustand/react/shallow`.
- **Messages disappeared after a send** → something called `invalidateQueries` on a thread
  key. Read [Message model](../explanation/message-model.md); this is rule 1 for a reason.
- **Avatars flash the wrong image while scrolling** → the `expo-image` `recyclingKey` is
  missing on the row, so a recycled view keeps the previous source until the new one decodes.

## See also

- [Commands](../reference/commands.md) — every script in one table.
- [Testing strategy](../explanation/testing-strategy.md) — what each test layer is for.
