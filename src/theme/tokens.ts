/**
 * Design token stub for Phase 2 (Game Setup Screen).
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
