---
title: 'ADR 0003 — List rendering: FlatList, tuned'
description: Why FlatList was chosen over FlashList, and the measurement protocol that validates it.
category: explanation
---

# ADR 0003 — List rendering: FlatList, tuned

**Status:** Accepted · 2026-09-10

## Context

Two lists carry the app: the contacts list on the Chats tab and the message thread. The brief
lists performance optimisation as a nice-to-have, and list scrolling is where performance is
visible.

The sizes are known and small. `GET /api/users` reports **`total: 60`**, fetched 20 per page.
Threads hold two or three server posts plus whatever the user has sent. Rows are homogeneous:
a fixed-height row with an avatar, a name, a preview line, and a timestamp.

## Options

### FlatList, tuned

| + | − |
| - | - |
| Built in — no dependency, no native module, nothing to justify | Requires deliberate work to be fast: memoised rows, `getItemLayout`, tuned window props |
| Windowing is entirely adequate at 60 homogeneous rows | Would not scale gracefully to thousands of heterogeneous rows |
| `getItemLayout` is exact here, since row height is fixed — removing all measurement cost | Scroll performance degrades if a row's props change identity every render |
| Every RN reviewer knows its failure modes and can verify the tuning | |

### FlashList v2

| + | − |
| - | - |
| Recycles views rather than mounting and unmounting — a real win at scale | The win is at hundreds-to-thousands of rows; at 60 there is little to recover |
| v2 needs no `estimatedItemSize` and handles inverted lists well | Another native dependency requiring the New Architecture |
| Handles heterogeneous row heights better than `getItemLayout` can | Choosing it here would be **unmeasured** — the honest reason would be that it signals performance work, not that it was needed |
| Good inverted-list ergonomics for chat threads | Its own recycling pitfalls (stale state in recycled cells) to learn and avoid |

## Decision

**FlatList, deliberately tuned.**

At 60 rows paged 20 at a time, FlatList's windowing is sufficient, and adding a native
dependency whose benefit cannot be measured is the weaker engineering call. The defensible
position is not "we used the fast library" — it is "we measured, the built-in was sufficient,
here is the data."

That position is only earned if the tuning is actually done:

- Row components memoised with an explicit comparator, declared outside the parent.
- No inline arrow props and no inline style objects passed to a row.
- Stable `keyExtractor` on the contact id (never the array index, and never the server's `id`,
  which is always `101` for sent messages).
- `getItemLayout` supplied — row height is fixed, so measurement is unnecessary.
- `initialNumToRender`, `maxToRenderPerBatch`, and `windowSize` tuned to the page size.
- `expo-image` with a `recyclingKey`, so a recycled row never shows the previous avatar.

## Verification

The claim is validated by measurement, not asserted. Two measurements, both in
[Run and test](../../how-to/run-and-test.md#measure-list-performance):

1. **Render counts** — a development-only counter on the contact row, read before and after
   memoisation. Fetching page two should re-render zero already-mounted rows.
2. **Frame jank** — `adb shell dumpsys gfxinfo` against the **release** APK with a scripted
   `adb shell input swipe` gesture, recording janky-frame percentage and the 95th-percentile
   frame time.

Both numbers are recorded in this ADR and in the README when the measurement runs. The
acceptance bar: **janky frames below 5%** during a sustained scroll on the test device.

## Consequences

- One fewer dependency, and no New Architecture constraint from this decision.
- The tuning is load-bearing rather than optional; `rn-code-checker` verifies it.
- The README carries measured numbers rather than a performance claim.

## Revisit if

The measurement misses the acceptance bar after tuning, or the data set grows past a few
hundred rows, or rows become heterogeneous in height. Any of those flips the calculation toward
FlashList.
