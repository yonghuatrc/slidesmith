import type { ThemeProfile } from './types';

/**
 * Parse theme1.xml to extract colors and fonts.
 *
 * OOXML color scheme elements map to our theme fields:
 *   <a:dk1>       → background
 *   <a:lt1>       → text
 *   <a:dk2>       → textMuted
 *   <a:lt2>       → surface
 *   <a:accent1>   → accent
 *   <a:accent2>   → accent2
 *   <a:accent3>   → border
 *   <a:accent6>   → error
 *
 * @param themeXml - Raw XML string from ppt/theme/theme1.xml
 * @returns Partial ThemeProfile with colors and fonts filled
 */
export function extractTheme(themeXml: string): Pick<ThemeProfile, 'colors' | 'fonts'> & { confidence: number } {
  const colors = extractColors(themeXml);
  const fonts = extractFonts(themeXml);

  // Confidence: 8 color fields possible + 2 font fields possible = 10 fields
  const colorFields = Object.values(colors).filter((v) => v !== '').length;
  const fontFields = (fonts.heading.family ? 1 : 0) + (fonts.body.family ? 1 : 0);
  const totalFields = colorFields + fontFields;
  const maxFields = 10;
  const confidence = totalFields / maxFields;

  return { colors, fonts, confidence };
}

/** OOXML element name → our color field name */
const COLOR_MAP: Record<string, keyof ThemeProfile['colors']> = {
  'dk1': 'background',
  'lt1': 'text',
  'dk2': 'textMuted',
  'lt2': 'surface',
  'accent1': 'accent',
  'accent2': 'accent2',
  'accent3': 'border',
  'accent6': 'error',
};

function extractColors(themeXml: string): ThemeProfile['colors'] {
  const colors: ThemeProfile['colors'] = {
    background: '',
    surface: '',
    text: '',
    textMuted: '',
    accent: '',
    accent2: '',
    border: '',
    error: '',
  };

  // Find <a:clrScheme> block
  const clrSchemeMatch = themeXml.match(/<a:clrScheme[^>]*>([\s\S]*?)<\/a:clrScheme>/i);
  if (!clrSchemeMatch) return colors;

  const clrSchemeContent = clrSchemeMatch[1];

  // Extract each color element: <a:dk1>, <a:lt1>, etc.
  for (const [elemName, field] of Object.entries(COLOR_MAP)) {
    // Build regex to match <a:{elemName}><a:srgbClr val="XXXXXX"/> or <a:sysClr .../>
    const elemRegex = new RegExp(
      `<a:${elemName}>\\s*<a:(\\w+Clr)[^>]*/>`,
      'i'
    );
    const match = clrSchemeContent.match(elemRegex);
    if (!match) continue;

    const clrType = match[1]; // 'srgbClr' or 'sysClr'

    // Extract hex value based on color type
    let hexValue: string | undefined;

    if (clrType.toLowerCase() === 'srgbclr') {
      // <a:srgbClr val="44546A"/>
      const valMatch = match[0].match(/val="([^"]+)"/);
      if (valMatch) hexValue = valMatch[1];
    } else if (clrType.toLowerCase() === 'sysclr') {
      // <a:sysClr val="windowText" lastClr="000000"/>
      // Prefer lastClr, fallback to known sys color mappings
      const lastClrMatch = match[0].match(/lastClr="([^"]+)"/);
      if (lastClrMatch) {
        hexValue = lastClrMatch[1];
      } else {
        const valMatch = match[0].match(/val="([^"]+)"/);
        if (valMatch) {
          // Map known system colors to actual hex
          hexValue = SYS_COLOR_MAP[valMatch[1].toLowerCase()] || undefined;
        }
      }
    }

    if (hexValue && /^[0-9A-Fa-f]{6}$/.test(hexValue)) {
      colors[field] = `#${hexValue.toUpperCase()}`;
    }
  }

  return colors;
}

/** Known system color mappings (used when lastClr is not available) */
const SYS_COLOR_MAP: Record<string, string> = {
  'windowtext': '000000',
  'window': 'FFFFFF',
  'captiontext': '000000',
  'highlight': '3399FF',
  'highlighttext': 'FFFFFF',
  'buttonface': 'F0F0F0',
  'buttonshadow': 'C0C0C0',
  'graytext': '808080',
};

function extractFonts(themeXml: string): ThemeProfile['fonts'] {
  const fonts: ThemeProfile['fonts'] = {
    heading: { family: '' },
    body: { family: '' },
    mono: { family: '' },
  };

  // Find <a:fontScheme> block
  const fontSchemeMatch = themeXml.match(/<a:fontScheme[^>]*>([\s\S]*?)<\/a:fontScheme>/i);
  if (!fontSchemeMatch) return fonts;

  const fontSchemeContent = fontSchemeMatch[1];

  // Extract major font (heading) - <a:majorFont>
  const majorMatch = fontSchemeContent.match(
    /<a:majorFont>[\s\S]*?<a:latin typeface="([^"]+)"/i
  );
  if (majorMatch) {
    fonts.heading.family = majorMatch[1];
  }

  // Extract minor font (body) - <a:minorFont>
  const minorMatch = fontSchemeContent.match(
    /<a:minorFont>[\s\S]*?<a:latin typeface="([^"]+)"/i
  );
  if (minorMatch) {
    fonts.body.family = minorMatch[1];
  }

  // Try to find a mono font from the major font's east asian or other typefaces,
  // or just default to 'Courier New' if none found
  fonts.mono.family = 'Courier New';

  return fonts;
}
