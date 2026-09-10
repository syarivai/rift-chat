---
name: app-security
description: Mobile application security baseline for rift-chat — secret hygiene, transport, local storage, logging and PII, deep links, dependency and release hardening. Load before adding a dependency, storing data, handling input, or preparing a build.
---

# App security

A mobile app ships its JavaScript bundle to the user's device. Anything in the bundle is
readable by anyone who installs the app. That single fact drives most of what follows.

Scope note: this app has no authentication and talks to one public, unauthenticated API, so
several categories below are preventive rather than active. They are here because the habits
matter more than this app's threat model, and because a reviewer will look.

## Secrets

- **Nothing secret goes in the bundle.** Not in `app.json`, not in `.env` files read at build
  time, not in `Constants.expoConfig.extra`. `EXPO_PUBLIC_*` variables are inlined into the
  bundle by design — treat them as published.
- No API keys, tokens, passwords, or private URLs in source, config, or committed fixtures.
- `.env` is gitignored; only `.env.example` with placeholder values is committed.
- If this app ever needs a credential, it belongs in the platform keystore
  (Keychain / Android Keystore) behind a `core/` port — never in MMKV, never in JS memory
  longer than needed.

## Transport

- **HTTPS only.** No cleartext HTTP, no exceptions for "just the dev API".
- Do not disable TLS validation, even temporarily. A commented-out `NSAllowsArbitraryLoads` has
  a way of becoming an uncommented one.
- Android release builds set `usesCleartextTraffic: false`.
- Never log a full request or response body in a release build.

## Local storage

- MMKV is **not** a secure store. It is unencrypted by default and readable on a rooted or
  jailbroken device. It holds the outbox, blocked ids, and preferences — all non-sensitive
  by design, and that is a constraint to preserve, not an accident.
- Do not persist anything you would not be comfortable seeing in a device backup.
- Clearing app data must fully clear the outbox and preferences; no orphan storage instances.

## Logging and PII

- The API returns real-shaped personal data: names, emails, phone numbers, addresses. Do not
  log user objects, message bodies, or full API responses.
- Strip or guard `console.*` in release builds.
- Crash and error reports must carry a `Failure` kind and a code path, never message content.
- Screenshots and recordings for the README show fixture data only — check for anything that
  looks like a real phone number before committing an image.

## Input handling

- Message bodies are user input. Render them as text; never through anything that interprets
  markup.
- Trim and length-cap the composer input before it reaches the outbox or the network.
- Treat every API response as untrusted: validate the shape at the boundary in `core/api` and
  return a `Failure` rather than letting a malformed payload propagate as `undefined` into the
  UI.

## Deep links and navigation

- expo-router exposes routes to the OS. Route params (`chat/[id]`) arrive from outside the app
  and must be validated — a non-numeric or out-of-range id renders a not-found state, never a
  crash or an unfiltered request.
- Do not register a URL scheme the app does not need.

## Dependencies

- Every new dependency is a supply-chain decision. Prefer the platform, then Expo's own
  packages, then a well-maintained third party — and record the reasoning if it is not obvious.
- `npm audit` runs in CI; a high-severity advisory in a runtime dependency blocks the build.
- Install native and `expo-*` packages with `npx expo install` so versions match the SDK.
- No `postinstall` scripts from packages you have not read.

## Release hardening

- Release builds enable minification; the debug keystore is acceptable **only** because this
  APK is a review artifact, and the README says so explicitly.
- No debug menus, dev-only render counters, or test hooks reachable in a release build — guard
  them with `__DEV__`.
- Publish the APK's SHA-256 so a reviewer can verify the binary matches a build they run.

## Review checklist

Before any commit that adds a dependency, stores data, handles input, or changes a build:

- [ ] No secret, key, or token in source or config
- [ ] No PII or message content in any log
- [ ] Nothing sensitive written to MMKV
- [ ] Route params validated before use
- [ ] New dependency justified, installed the right way, audit clean
- [ ] Dev-only code guarded by `__DEV__`
