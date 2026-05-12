import { z } from 'zod';
import type { Theme, ThemeInfo } from './types';
import darkTech from '../dark-tech/theme.json';
import blueWhite from '../blue-white/theme.json';
import warmEarth from '../warm-earth/theme.json';
import minimalClean from '../minimal-clean/theme.json';
import highContrast from '../high-contrast/theme.json';

const spacingSchema = z.object({
  slidePadding: z.number(),
  blockGap: z.number(),
  paragraphGap: z.number(),
  sectionGap: z.number(),
});

const themeSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string(),
  colors: z.object({
    background: z.string(),
    surface: z.string(),
    text: z.string(),
    textMuted: z.string(),
    accent: z.string(),
    accent2: z.string(),
    border: z.string(),
    error: z.string(),
  }),
  fonts: z.object({
    heading: z.object({ family: z.string(), weight: z.number(), weights: z.record(z.number()).optional() }),
    body: z.object({ family: z.string(), weight: z.number(), size: z.number().optional() }),
    mono: z.object({ family: z.string(), weight: z.number() }),
  }),
  spacing: z.object({
    compact: spacingSchema,
    comfortable: spacingSchema,
    breathing: spacingSchema,
  }),
  radii: z.object({
    small: z.number(),
    medium: z.number(),
    large: z.number(),
    full: z.number(),
  }),
  shadows: z.object({
    subtle: z.object({ offsetX: z.number(), offsetY: z.number(), blur: z.number(), color: z.string() }),
    medium: z.object({ offsetX: z.number(), offsetY: z.number(), blur: z.number(), color: z.string() }),
  }),
  layouts: z.array(z.string()),
});

const themeMap: Record<string, Theme> = {
  'dark-tech': darkTech as Theme,
  'blue-white': blueWhite as Theme,
  'warm-earth': warmEarth as Theme,
  'minimal-clean': minimalClean as Theme,
  'high-contrast': highContrast as Theme,
};

export function loadTheme(name: string): Theme {
  const raw = themeMap[name];
  if (!raw) {
    throw new Error(`ERR_THEME_NOT_FOUND: Theme "${name}" not found. Available: ${Object.keys(themeMap).join(', ')}`);
  }
  const result = themeSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`ERR_THEME_VALIDATION: Invalid theme "${name}": ${result.error.message}`);
  }
  return result.data;
}

export function listThemes(): ThemeInfo[] {
  return Object.values(themeMap).map((t) => ({
    name: t.name,
    description: t.description,
  }));
}

export function getAllThemes(): Map<string, Theme> {
  return new Map(Object.entries(themeMap));
}
