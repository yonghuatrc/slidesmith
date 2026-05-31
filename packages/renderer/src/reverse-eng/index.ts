import { parsePptx } from './pptx-parser';
import { extractTheme } from './theme-extractor';
import { extractLayouts } from './layout-extractor';
import { buildProfile } from './profile-builder';
import type { ThemeProfile } from './types';

/**
 * Extract a theme profile from a .pptx template file.
 *
 * Reads the PPTX, parses its internal XML (theme, slide master, layouts),
 * and produces a ThemeProfile with colors, fonts, and layout zones.
 *
 * @param pptxPath - Path to a .pptx file
 * @returns Complete ThemeProfile
 * @throws ERR_FILE_NOT_FOUND if the file doesn't exist
 * @throws ERR_INVALID_PPTX if the file is not a valid PPTX
 */
export async function extractThemeProfile(pptxPath: string): Promise<ThemeProfile> {
  // Step 1: Parse the PPTX → extract XML strings
  const contents = await parsePptx(pptxPath);

  // Step 2: Extract theme (colors + fonts)
  const themeData = extractTheme(contents.themeXml);

  // Step 3: Extract layouts (zones)
  const layouts = extractLayouts(contents.slideLayoutXml, contents.slideMasterXml);

  // Step 4: Build complete profile
  const profile = buildProfile({
    name: extractPresentationName(pptxPath),
    colors: themeData.colors,
    fonts: themeData.fonts,
    layouts,
    colorConfidence: themeData.confidence,
    fontConfidence: themeData.confidence,
  });

  return profile;
}

/**
 * Extract a presentable name from the file path.
 */
function extractPresentationName(filePath: string): string {
  const basename = filePath.split(/[/\\]/).pop() || 'template.pptx';
  return basename.replace(/\.pptx$/i, '');
}

export type { ThemeProfile } from './types';
export type { ExtractedLayout, ExtractedZone } from './types';
