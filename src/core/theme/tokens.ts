/**
 * The design language. There is no UI library — every colour, space, radius and type size in
 * the app comes from here. A raw hex value in a component is a bug: it will not respond to
 * the theme. See docs/reference/design-tokens.md.
 *
 * Colours are named for their ROLE, not their appearance, which is what lets one component
 * serve both themes with no conditional.
 */

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, bubble: 18, full: 999 } as const;

export const typography = {
  title: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  label: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '400' },
  micro: { fontSize: 11, fontWeight: '500' },
} as const;

export type ColorTokens = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  onAccent: string;
  bubbleIn: string;
  onBubbleIn: string;
  bubbleOut: string;
  onBubbleOut: string;
  danger: string;
  success: string;
};

export const lightColors: ColorTokens = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F3F5',
  border: '#E3E6EA',
  text: '#11181C',
  textMuted: '#687076',
  accent: '#146C43',
  onAccent: '#FFFFFF',
  bubbleIn: '#F1F3F5',
  onBubbleIn: '#11181C',
  bubbleOut: '#146C43',
  onBubbleOut: '#FFFFFF',
  danger: '#B42318',
  success: '#146C43',
};

export const darkColors: ColorTokens = {
  bg: '#0F1418',
  surface: '#161C21',
  surfaceMuted: '#1F262C',
  border: '#2A333A',
  text: '#ECEDEE',
  textMuted: '#9BA1A6',
  accent: '#4ADE80',
  onAccent: '#0F1418',
  bubbleIn: '#1F262C',
  onBubbleIn: '#ECEDEE',
  bubbleOut: '#2F6F4E',
  onBubbleOut: '#ECEDEE',
  danger: '#F97066',
  success: '#4ADE80',
};

export type Theme = {
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  scheme: 'light' | 'dark';
};
