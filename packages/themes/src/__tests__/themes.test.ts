import { describe, it, expect } from 'vitest';
import { loadTheme, listThemes, getAllThemes } from '../loader';

describe('themes', () => {
  const themeNames = ['dark-tech', 'blue-white', 'warm-earth', 'minimal-clean', 'high-contrast'];

  it('all 5 themes load without error', () => {
    for (const name of themeNames) {
      expect(() => loadTheme(name)).not.toThrow();
    }
  });

  it('each theme has all 8 color fields', () => {
    for (const name of themeNames) {
      const theme = loadTheme(name);
      const colors = theme.colors;
      expect(colors.background).toBeDefined();
      expect(colors.surface).toBeDefined();
      expect(colors.text).toBeDefined();
      expect(colors.textMuted).toBeDefined();
      expect(colors.accent).toBeDefined();
      expect(colors.accent2).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.error).toBeDefined();
    }
  });

  it('each theme has all 3 font configurations', () => {
    for (const name of themeNames) {
      const theme = loadTheme(name);
      expect(theme.fonts.heading.family).toBeTruthy();
      expect(theme.fonts.body.family).toBeTruthy();
      expect(theme.fonts.mono.family).toBeTruthy();
    }
  });

  it('each theme has all 3 density modes', () => {
    for (const name of themeNames) {
      const theme = loadTheme(name);
      expect(theme.spacing.compact).toBeDefined();
      expect(theme.spacing.comfortable).toBeDefined();
      expect(theme.spacing.breathing).toBeDefined();
    }
  });

  it("loadTheme('nonexistent') throws", () => {
    expect(() => loadTheme('nonexistent')).toThrow('ERR_THEME_NOT_FOUND');
  });

  it('listThemes returns all 5 themes', () => {
    const themes = listThemes();
    expect(themes).toHaveLength(5);
    expect(themes.map((t) => t.name)).toEqual(themeNames);
  });

  it('getAllThemes returns 5 entries', () => {
    expect(getAllThemes().size).toBe(5);
  });
});
