import type { ThemeProfile, ExtractedLayout } from './types';

/** Default fallback colors for missing fields */
const DEFAULT_COLORS: ThemeProfile['colors'] = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textMuted: '#666666',
  accent: '#2196F3',
  accent2: '#4CAF50',
  border: '#E0E0E0',
  error: '#D32F2F',
};

/** Default fallback fonts */
const DEFAULT_FONTS: ThemeProfile['fonts'] = {
  heading: { family: 'Arial', weight: 700 },
  body: { family: 'Arial', weight: 400, size: 14 },
  mono: { family: 'Courier New' },
};

/**
 * Build a complete ThemeProfile from extracted partial data.
 *
 * Merges colors, fonts, and layouts. Applies defaults for missing fields.
 * Calculates a weighted confidence score.
 *
 * @param partial - Partial extracted data
 * @returns Complete ThemeProfile
 */
export function buildProfile(
  partial: {
    name?: string;
    colors?: Partial<ThemeProfile['colors']>;
    fonts?: Partial<ThemeProfile['fonts']>;
    layouts?: ExtractedLayout[];
    colorConfidence?: number;
    fontConfidence?: number;
  }
): ThemeProfile {
  // Merge colors with defaults
  const colors: ThemeProfile['colors'] = {
    ...DEFAULT_COLORS,
    ...(partial.colors || {}),
  };

  // Ensure all color fields are filled
  for (const key of Object.keys(DEFAULT_COLORS) as (keyof ThemeProfile['colors'])[]) {
    if (!colors[key]) {
      colors[key] = DEFAULT_COLORS[key];
    }
  }

  // Merge fonts with defaults
  const fonts: ThemeProfile['fonts'] = {
    heading: { ...DEFAULT_FONTS.heading, ...(partial.fonts?.heading || {}) },
    body: { ...DEFAULT_FONTS.body, ...(partial.fonts?.body || {}) },
    mono: { ...DEFAULT_FONTS.mono, ...(partial.fonts?.mono || {}) },
  };

  if (!fonts.heading.family) fonts.heading.family = DEFAULT_FONTS.heading.family;
  if (!fonts.body.family) fonts.body.family = DEFAULT_FONTS.body.family;
  if (!fonts.mono.family) fonts.mono.family = DEFAULT_FONTS.mono.family;

  const layouts = partial.layouts || [];

  // Weighted confidence: colors 40%, fonts 20%, layouts 40%
  const colorConfidence = partial.colorConfidence ?? 0;
  const fontScore = partial.fontConfidence ?? 0;
  const layoutConfidence = layouts.length > 0 ? Math.min(1, layouts[0].zones.length / 4) : 0;

  const confidence = Math.round(
    (colorConfidence * 0.4 + fontScore * 0.2 + layoutConfidence * 0.4) * 100
  ) / 100;

  return {
    name: partial.name || 'Extracted Theme',
    colors,
    fonts,
    layouts,
    confidence: Math.min(1, Math.max(0, confidence)),
  };
}
