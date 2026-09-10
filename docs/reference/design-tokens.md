---
title: 'Design tokens'
description: The colour, spacing, radius, and type scales, and how dark mode resolves.
category: reference
---

# Design tokens

There is no UI library. The visual language is a small token set in `@/core/theme`, and
**every** style value in the app comes from it. A raw hex code or a magic number in a component
is a bug — it will not respond to the theme.

## Why tokens rather than a component library

A chat app lives or dies on the details of its own surfaces — bubble shapes, list density,
composer behaviour. Material or a similar kit gives you working components quickly and then
fights you on every one of those details, and the result looks like every other take-home. A
token layer is a few dozen lines and buys complete control plus dark mode by construction. The
tradeoff, honestly stated, is that everything must be built by hand.

## Semantic colours

Tokens are named for their **role**, not their appearance, which is what lets one component
serve both themes without a conditional:

| Token | Role |
| ----- | ---- |
| `bg` | Screen background |
| `surface` | Cards, rows, the composer bar |
| `surfaceMuted` | Skeletons, pressed states, dividers' backdrop |
| `border` | Hairlines and separators |
| `text` | Primary text |
| `textMuted` | Timestamps, secondary labels, empty-state copy |
| `accent` | Brand colour: active tab, send button, focus rings |
| `onAccent` | Text and icons on top of `accent` |
| `bubbleIn` / `onBubbleIn` | Incoming message bubble and its text |
| `bubbleOut` / `onBubbleOut` | Outgoing message bubble and its text |
| `danger` | Failed sends, destructive actions, block state |
| `success` | Delivered ticks |

Light and dark are two maps over the same keys. A component reads `theme.colors.text` and is
correct in both.

## Spacing

A 4-point scale. Nothing between the steps:

`xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32`

## Radius

`sm 8 · md 12 · lg 16 · bubble 18 · full 999`

## Typography

| Token | Size / weight | Used for |
| ----- | ------------- | -------- |
| `title` | 20 / 600 | Screen and header titles |
| `body` | 16 / 400 | Message text, primary content |
| `label` | 15 / 600 | Contact names, buttons |
| `caption` | 13 / 400 | Timestamps, last-message preview |
| `micro` | 11 / 500 | Status text under a bubble |

Sizes respect the OS font-scale setting; nothing is locked to a fixed pixel height that would
clip at large text sizes.

## Resolving the theme

Resolution order: the user's explicit choice in Settings, then the OS `useColorScheme()`, then
light. The choice persists in MMKV, so the app opens in the right theme with no flash — MMKV
reads synchronously, which is precisely why it was chosen (see
[ADR 0002](../explanation/adr/0002-storage-mmkv.md)).

Components consume tokens through `useTheme()`. Styles that depend on the theme are built
inside the component from tokens; styles that do not are hoisted to a module-level
`StyleSheet.create` so they are not rebuilt on every render — which matters inside a list row.

## Contrast

Every text-on-background pairing meets WCAG AA (4.5:1 for body text, 3:1 for large text) in
both themes. When adding or changing a colour, check the pairing before committing — the
`rn-ui-checker` agent verifies this.
