import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { extractThemeProfile } from '../reverse-eng';
import { parsePptx } from '../reverse-eng/pptx-parser';
import { extractTheme } from '../reverse-eng/theme-extractor';
import { extractLayouts } from '../reverse-eng/layout-extractor';
import { buildProfile } from '../reverse-eng/profile-builder';

const FIXTURE_DIR = resolve(__dirname, 'fixtures');
const MINIMAL_PPTX = resolve(FIXTURE_DIR, 'minimal.pptx');

describe('reverse-eng', () => {
  describe('pptx-parser', () => {
    it('opens a valid PPTX and extracts XML contents', async () => {
      const contents = await parsePptx(MINIMAL_PPTX);
      expect(contents.themeXml).toContain('<?xml');
      expect(contents.themeXml).toContain('a:theme');
      expect(contents.slideMasterXml).toContain('p:sldMaster');
      expect(contents.slideLayoutXml).toContain('p:sldLayout');
    });

    it('throws ERR_FILE_NOT_FOUND for missing file', async () => {
      await expect(parsePptx('/nonexistent/foo.pptx')).rejects.toThrow('ERR_FILE_NOT_FOUND');
    });

    it('throws ERR_INVALID_PPTX for non-ZIP file', async () => {
      await expect(parsePptx(resolve(FIXTURE_DIR, '.'))).rejects.toThrow('ERR_INVALID_PPTX');
    });

    it('throws ERR_INVALID_PPTX for empty buffer ZIP', async () => {
      // Create a minimal ZIP without PPTX structure
      const { writeFileSync } = await import('node:fs');
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      zip.file('test.txt', 'hello');
      const buf = await zip.generateAsync({ type: 'nodebuffer' });
      const tmpPath = resolve(FIXTURE_DIR, '__test_not_a_pptx.zip');
      writeFileSync(tmpPath, buf);
      try {
        await expect(parsePptx(tmpPath)).rejects.toThrow('ERR_INVALID_PPTX');
      } finally {
        const { unlinkSync } = await import('node:fs');
        try { unlinkSync(tmpPath); } catch { /* ignore */ }
      }
    });
  });

  describe('theme-extractor', () => {
    it('extracts colors and fonts from theme XML', async () => {
      const contents = await parsePptx(MINIMAL_PPTX);
      const theme = extractTheme(contents.themeXml);
      expect(theme.colors).toBeDefined();
      expect(theme.fonts).toBeDefined();
      // PPTX has default theme colors
      expect(typeof theme.colors.background).toBe('string');
      // Default themes usually have at least some fields
      expect(typeof theme.fonts.heading.family).toBe('string');
    });

    it('extracts confidence score', async () => {
      const contents = await parsePptx(MINIMAL_PPTX);
      const theme = extractTheme(contents.themeXml);
      expect(theme.confidence).toBeGreaterThanOrEqual(0);
      expect(theme.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('layout-extractor', () => {
    it('extracts layouts from layout XML', async () => {
      const contents = await parsePptx(MINIMAL_PPTX);
      const layouts = extractLayouts(contents.slideLayoutXml, contents.slideMasterXml);
      expect(layouts.length).toBeGreaterThanOrEqual(1);
      expect(layouts[0].name).toBeTruthy();
      expect(Array.isArray(layouts[0].zones)).toBe(true);
    });

    it('zones contain position data', async () => {
      const contents = await parsePptx(MINIMAL_PPTX);
      const layouts = extractLayouts(contents.slideLayoutXml, contents.slideMasterXml);
      for (const zone of layouts[0].zones) {
        expect(zone.x).toBeGreaterThanOrEqual(0);
        expect(zone.y).toBeGreaterThanOrEqual(0);
        expect(zone.w).toBeGreaterThan(0);
        expect(zone.h).toBeGreaterThan(0);
        expect(zone.x + zone.w).toBeLessThanOrEqual(1.01);
        expect(zone.y + zone.h).toBeLessThanOrEqual(1.01);
      }
    });
  });

  describe('profile-builder', () => {
    it('builds complete profile from partial data', () => {
      const profile = buildProfile({
        name: 'Test',
        colors: { background: '#FFFFFF', text: '#000000' },
        fonts: { heading: { family: 'Arial' }, body: { family: 'Calibri' }, mono: { family: 'Courier New' } },
        layouts: [{ name: 'Default', zones: [{ name: 'Title', x: 0, y: 0, w: 1, h: 0.5, type: 'title' }] }],
      });
      expect(profile.name).toBe('Test');
      expect(profile.colors.background).toBe('#FFFFFF');
      expect(profile.colors.surface).toBeTruthy(); // default filled
      expect(profile.fonts.heading.family).toBe('Arial');
      expect(profile.layouts.length).toBe(1);
      expect(profile.confidence).toBeGreaterThanOrEqual(0);
    });

    it('fills missing color fields with defaults', () => {
      const profile = buildProfile({
        colors: { background: '#000000' },
      });
      // surface should have default since it wasn't provided
      expect(profile.colors.surface).toBe('#F5F5F5');
      expect(profile.colors.background).toBe('#000000');
    });
  });

  describe('extractThemeProfile (integration)', () => {
    it('extracts a complete theme from a valid PPTX', async () => {
      const profile = await extractThemeProfile(MINIMAL_PPTX);
      expect(profile.name).toBeTruthy();
      // Check all color fields are non-empty
      for (const val of Object.values(profile.colors)) {
        expect(val).toBeTruthy();
      }
      // Check fonts
      expect(profile.fonts.heading.family).toBeTruthy();
      expect(profile.fonts.body.family).toBeTruthy();
      expect(profile.fonts.mono.family).toBeTruthy();
      // Confidence
      expect(profile.confidence).toBeGreaterThanOrEqual(0);
      expect(profile.confidence).toBeLessThanOrEqual(1);
    });

    it('extracted colors have # prefix', async () => {
      const profile = await extractThemeProfile(MINIMAL_PPTX);
      for (const val of Object.values(profile.colors)) {
        expect(val).toMatch(/^#[0-9A-F]{6}$/);
      }
    });

    it('confidence for a real PPTX is >= 0.5 (colors+fonts found, layouts depend on template)', async () => {
      const profile = await extractThemeProfile(MINIMAL_PPTX);
      // pptxgenjs generates minimal slide layouts without placeholder shapes,
      // so layout confidence is 0. But colors+fonts are all extracted → 0.5+.
      expect(profile.confidence).toBeGreaterThanOrEqual(0.5);
    });
  });
});
