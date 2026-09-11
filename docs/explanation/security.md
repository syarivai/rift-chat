---
title: 'Security posture'
description: What the threat model actually is, what was checked against OWASP MASVS, and the findings.
category: explanation
---

# Security posture

## The threat model, honestly

This app has **no authentication, no user accounts, and no secrets**. It reads a public,
unauthenticated API and stores what the user types on their own device. That removes most of
the OWASP Mobile Top 10 by construction rather than by effort — and saying so is more useful
than implying defences that aren't being tested.

What remains genuinely relevant: what ships inside the bundle, what is written to disk, what
reaches logs, and what arrives from outside the app.

## Checked against OWASP MASVS

| Category                                    | Status                                                                                                                                                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M1 Improper credential usage**            | No credentials exist. `.env` is gitignored; only `.env.example` is committed, with a placeholder.                                                                                                                                                    |
| **M2 Inadequate supply chain**              | `npm audit` run; see findings below. Native and `expo-*` packages installed via `expo install` so versions match the SDK.                                                                                                                            |
| **M3 Insecure authentication**              | Not applicable — no auth.                                                                                                                                                                                                                            |
| **M4 Insufficient input/output validation** | Every API response shape is validated at the boundary in `core/api` and throws on mismatch. Route params (`chat/[id]`) arrive from outside the app and are validated before use. Message bodies are trimmed and length-capped, and rendered as text. |
| **M5 Insecure communication**               | HTTPS only. `usesCleartextTraffic: false` on Android. No TLS validation is disabled anywhere.                                                                                                                                                        |
| **M6 Inadequate privacy controls**          | The API returns real-shaped PII (names, emails, phones). No user object, message body, or API response is logged — verified by grep: there is no `console.*` in `src/`.                                                                              |
| **M7 Insufficient binary protection**       | Release builds minify. The submitted APK is signed with a debug keystore and is a **review artifact, not a distributable build** — stated plainly in the README rather than hidden.                                                                  |
| **M8 Security misconfiguration**            | No debug menus or dev-only affordances reachable in release; dev-only code is `__DEV__`-guarded.                                                                                                                                                     |
| **M9 Insecure data storage**                | MMKV is **not** an encrypted store, and nothing sensitive is put in it: the outbox, a list of blocked ids, and two preferences. That is a constraint to preserve, not an accident.                                                                   |
| **M10 Insufficient cryptography**           | No cryptography is used, because nothing here warrants it. `newId()` is `Math.random`-based and is an identifier, never a security token.                                                                                                            |

## `EXPO_PUBLIC_` is not a secret store

`EXPO_PUBLIC_API_BASE_URL` is **inlined into the JavaScript bundle at build time**. Anyone who
installs the app can read it. That is fine for a public API base URL, which is configuration,
not a secret — and it is exactly why a real credential must never be put there. Anything
genuinely secret belongs behind a server you control, or in the platform keystore.

## Dependency findings

`npm audit --omit=dev` reports **13 moderate, 0 high, 0 critical**, all transitive through
Expo's own toolchain (`@expo/cli`, `@expo/metro-config`, `expo-router`) and rooted in two
packages:

- `decode-uri-component` — denial of service via exponential decoding, reached through
  `query-string`.
- `uuid` — missing buffer bounds check in v3/v5/v6 when a buffer is supplied.

**Not fixed, deliberately.** Both are build-time and Expo-internal; neither is reachable from
app code. `npm audit fix --force` would move Expo off its SDK-pinned versions, which is a
larger and more likely break than the risk it removes. The upgrade path is an Expo SDK release
that bumps them.

## RASP

Runtime application self-protection — root/jailbreak detection, debugger detection, tamper
checks — is **deliberately absent**. RASP protects assets on a hostile device; this app holds
no asset worth protecting and grants no privilege. Adding it would be security theatre that
costs a native dependency and breaks the reviewer's ability to run the app on an emulator.

The condition that would change this: any feature that authenticates a user, holds a token, or
unlocks paid functionality.

## See also

- The `app-security` skill — the rules applied while writing code.
- [Tech stack](../reference/tech-stack.md) — version pinning policy.
