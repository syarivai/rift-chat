---
name: rn-performance
description: List and render performance rules for rift-chat — FlatList tuning, memoisation, expo-image recycling — and the measurement protocol that validates them. Load before writing a list, a row component, or making any performance claim.
---

# React Native performance

The project uses **FlatList, deliberately tuned** rather than a recycler
([ADR 0003](../../../docs/explanation/adr/0003-list-rendering-flatlist.md)). That choice is only
defensible if the tuning is real and the result is measured.

## The rules

### Row components

- Declared **outside** the parent, wrapped in `React.memo`. A component defined inside render
  is a new type every render and remounts the entire list.
- **No inline arrow props.** `onPress={() => go(id)}` defeats memoisation on every row. Pass a
  stable callback and have the row call it with its own id.
- **No inline style objects or arrays** in a row. Hoist to `StyleSheet.create`; build only
  theme-dependent styles inside the component.
- Give `memo` an explicit comparator when the row takes an object prop, so a new-but-equal
  object does not re-render it.

### FlatList props

```tsx
<FlatList
  data={items}
  keyExtractor={(item) => String(item.id)}
  renderItem={renderContactRow} // stable module-level reference
  getItemLayout={(_, index) => ({ length: ROW_H, offset: ROW_H * index, index })}
  initialNumToRender={12}
  maxToRenderPerBatch={10}
  windowSize={7}
  removeClippedSubviews
  onEndReachedThreshold={0.5}
/>
```

- `keyExtractor` on a stable id — **never the array index**, and never a sent message's server
  `id`, which is always `101`.
- `getItemLayout` is exact here because row height is fixed; it removes all measurement cost
  and makes scroll-to-index instant.

### Images

`expo-image` everywhere, with a **`recyclingKey`** on any image inside a list. Without it, a
recycled row shows the previous avatar until the new one decodes — the classic flashing-wrong-
avatar bug. Set `cachePolicy="memory-disk"` and give every image an explicit width and height.

### Selectors

A Zustand selector returning a new object or array every render re-renders every subscriber.
Select the narrowest value; wrap object returns in `useShallow`.

### Everything else

Do not scatter `useMemo`/`useCallback` on principle — they cost more than they save on cheap
values. Memoise where a list row's props depend on it, or where profiling says so.

## Measurement protocol

A performance claim without a number is an assertion. Two measurements, both in
[Run and test](../../../docs/how-to/run-and-test.md#measure-list-performance).

### 1. Render counts — attribution

A dev-only counter on the contact row. Scroll one page and read it. Target: fetching page two
re-renders **zero** already-mounted rows. This tells you _what_ changed.

### 2. Frame jank — outcome

Against the **release** APK, never a debug build:

```bash
PKG=dev.riftchat.app
adb shell dumpsys gfxinfo $PKG reset
for i in $(seq 1 15); do adb shell input swipe 540 1600 540 400 80; done
adb shell dumpsys gfxinfo $PKG | head -20
```

Record `Janky frames (%)` and the 95th-percentile frame time, before and after, on the same
device with the same scripted gesture. **Acceptance bar: janky frames below 5%.** A human
thumb is not a reproducible gesture — always script it.

`gfxinfo` is Android-only. On iOS use Reanimated's `useFrameCallback` for UI-thread frame
deltas.

## Reporting

Write measured numbers into
[ADR 0003](../../../docs/explanation/adr/0003-list-rendering-flatlist.md) and the README. Never
write "optimised for performance" — write the before and after.
