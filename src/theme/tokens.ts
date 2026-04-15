/**
 * Design tokens — single source of truth for all visual values.
 * No raw colors, spacing, or typography values anywhere except here.
 * Phase 7 (Design System) full expansion.
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
    dimmed: 'rgba(0,0,0,0.45)',
    newIndicator: '#E8B84B', // accent — pulsing glow for newly drawn card
    faceCard: {
      classicBg: '#C8972A',
      classicText: '#FFFFFF',
    },
  },
  suit: {
    red: '#E74C3C',
    black: '#2C3E50',
  },
  overlay: {
    backdrop: 'rgba(0,0,0,0.55)',
  },
} as const;

export const spacing = {
  xxs: 2,
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
  cardCorner: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 13,
  },
  cardCenter: {
    fontSize: 22,
    fontWeight: '800' as const,
    lineHeight: 26,
  },
  cardCenterSm: {
    fontSize: 14,
    fontWeight: '800' as const,
    lineHeight: 17,
  },
  tiny: {
    fontSize: 9,
    fontWeight: '400' as const,
    lineHeight: 12,
  },
} as const;

export const cardSizes = {
  sm: { width: 40, height: 56 },
  md: { width: 52, height: 72 },
  lg: { width: 64, height: 90 },
} as const;

export const shadows = {
  card: {
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardLifted: {
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  bottomSheet: {
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
} as const;

export const zIndex = {
  card: 1,
  cardDragging: 100,
  overlay: 200,
  modal: 300,
} as const;
