/**
 * Design tokens — Phase 2 (Game Setup Screen) + Phase 3 (Game Board Screen).
 * Phase 7 (Design System) will expand this with a full token set.
 * All components MUST reference these tokens — no raw style values anywhere.
 */

export const colors = {
  background: '#0F1923',
  surface: '#1A2632',
  border: '#2C3E50',
  accent: '#E8B84B',
  error: '#E74C3C',
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    placeholder: '#64748B',
  },
  card: {
    face: '#FFFFFF',
    back: '#1E3A5F',
    selected: '#E8B84B',
    joker: '#8B5CF6',
  },
  suit: {
    red: '#E74C3C',
    black: '#1A2632',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const typography = {
  heading: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
} as const;

export const cardSizes = {
  sm: { width: 40, height: 56 },
  md: { width: 52, height: 72 },
  lg: { width: 64, height: 90 },
} as const;

export const shadows = {
  card: {
    elevation: {
      // Android
      elevation: 6,
      // iOS
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  },
} as const;
