---
title: 'Commands'
description: Every npm script and the ad-hoc commands worth remembering.
category: reference
---

# Commands

## Development

| Command | What it does |
| ------- | ------------ |
| `npm start` | Metro dev server |
| `npm run android` | Build and run the Android development build |
| `npm run ios` | Build and run the iOS development build |
| `npm run prebuild` | Regenerate `android/` and `ios/` from `app.json` (`--clean`) |
| `npm run doctor` | `expo-doctor` — dependency and config health check |

## Quality gates

| Command | What it does |
| ------- | ------------ |
| `npm run typecheck` | `tsc --noEmit`, strict mode |
| `npm run lint` | `eslint .` |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run format` | Prettier, writing changes |
| `npm run format:check` | Prettier, verifying only |
| `npm run check` | All four in CI order — **run before every push** |

## Tests

| Command | What it does |
| ------- | ------------ |
| `npm test` | Jest, once |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:ci` | Jest with coverage and thresholds |
| `npm test -- outbox` | Only files matching a path fragment |
| `npm test -- -t "rolls back"` | Only tests whose name matches |
| `npm run e2e` | The Maestro flow against an installed build |

## Release

| Command | What it does |
| ------- | ------------ |
| `npm run apk` | Prebuild, assemble the release APK, copy it to `release/` |
| `shasum -a 256 release/*.apk` | Checksum for the README |
| `adb install -r release/rift-chat-v1.0.0.apk` | Sideload onto a device |

## Measurement

```bash
PKG=dev.riftchat.app
adb shell dumpsys gfxinfo $PKG reset
for i in $(seq 1 15); do adb shell input swipe 540 1600 540 400 80; done
adb shell dumpsys gfxinfo $PKG | head -20
```

Full protocol: [Run and test](../how-to/run-and-test.md#measure-list-performance).

## Adding dependencies

```bash
npx expo install <native-or-expo-package>   # resolves the SDK-compatible version
npm install -D <js-only-dev-dependency>
```

Never `npm install` a native or `expo-*` package directly — it will resolve a version that does
not match the installed SDK.
