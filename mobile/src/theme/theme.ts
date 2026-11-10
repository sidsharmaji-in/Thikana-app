// GharDekho Mobile Theme Tokens (React Native / Expo)
// Modern UI/UX Pro Max Architecture: Multi-Palette Support with Midnight Indigo Luxe as Default
import { Platform } from 'react-native';

export type ThemeName = 'indigo' | 'saffron' | 'emerald' | 'light';

export const palettes = {
  // 1. Midnight Cyber-Indigo Luxe (Default)
  indigo: {
    bg: '#07090E',
    surface: '#0E1320',
    surfaceRaised: '#141C2E',
    border: '#1C2740',
    borderFocus: '#6366F1',

    primary: '#6366F1',
    primaryHover: '#4F46E5',
    onPrimary: '#FFFFFF',

    accentTrust: '#10B981',    // Emerald Green (Verified Owner, Available Bed)
    accentStudent: '#A855F7',  // Purple (Student friendly / Split deals)
    accentWarning: '#F59E0B',  // Amber (Jal timing alert)

    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    success: '#10B981',
    warning: '#F59E0B',
    danger: '#F43F5E',
    isDark: true,
  },

  // 2. Sunset Saffron Energy
  saffron: {
    bg: '#06090E',
    surface: '#0C121D',
    surfaceRaised: '#131B2B',
    border: '#27354A',
    borderFocus: '#FF6B00',

    primary: '#FF6B00',
    primaryHover: '#E05D00',
    onPrimary: '#FFFFFF',

    accentTrust: '#10B981',
    accentStudent: '#8B5CF6',
    accentWarning: '#F59E0B',

    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    isDark: true,
  },

  // 3. Nordic Emerald Oasis
  emerald: {
    bg: '#050B08',
    surface: '#0B1510',
    surfaceRaised: '#112019',
    border: '#172C22',
    borderFocus: '#10B981',

    primary: '#10B981',
    primaryHover: '#059669',
    onPrimary: '#FFFFFF',

    accentTrust: '#10B981',
    accentStudent: '#8B5CF6',
    accentWarning: '#F59E0B',

    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    isDark: true,
  },

  // 4. Studio Porcelain Light
  light: {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceRaised: '#F1F5F9',
    border: '#E2E8F0',
    borderFocus: '#4F46E5',

    primary: '#4F46E5',
    primaryHover: '#4338CA',
    onPrimary: '#FFFFFF',

    accentTrust: '#10B981',
    accentStudent: '#7C3AED',
    accentWarning: '#D97706',

    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',

    success: '#10B981',
    warning: '#D97706',
    danger: '#EF4444',
    isDark: false,
  }
};

export const palette = palettes.indigo;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 26,
  full: 9999
} as const;

export const fonts = {
  display: Platform.select({ ios: 'PlusJakartaSans-Bold', android: 'PlusJakartaSans-Bold', default: 'sans-serif' }),
  body: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  mono: Platform.select({ ios: 'JetBrainsMono-Bold', android: 'JetBrainsMono-Bold', default: 'monospace' }),
};

export const typeScale = {
  largeTitle: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const },
  title1: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  title2: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  badge: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const },
};

export const touch = {
  minTarget: 48,
  minGap: 8
};

export const motion = {
  fast: 150,
  base: 250,
  spring: { damping: 18, stiffness: 180 }
};

export function useTheme(themeName: ThemeName = 'indigo') {
  const currentPalette = palettes[themeName] || palettes.indigo;
  return { colors: currentPalette, spacing, radius, fonts, typeScale, touch, motion, isDark: currentPalette.isDark };
}
