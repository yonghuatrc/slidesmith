import type { ExtractedLayout, ExtractedZone } from './types';

/** Standard 16:9 slide dimensions in EMU */
const SLIDE_W_EMU = 12192000;
const SLIDE_H_EMU = 6858000;

/** Map OOXML placeholder types to our zone types */
const TYPE_MAP: Record<string, 'title' | 'body' | 'image' | 'footer'> = {
  title: 'title',
  ctrTitle: 'title',
  body: 'body',
  txt: 'body',
  pic: 'image',
  image: 'image',
  ftr: 'footer',
  sldNum: 'footer',
};

/**
 * Parse slide layout XML and master slide to extract zone positions.
 *
 * In OOXML, slide layouts have `<p:sp>` elements with `<p:ph>` placeholder
 * markers. Positions are in EMU (English Metric Units).
 *
 * @param layoutXml - Raw XML from ppt/slideLayouts/slideLayout1.xml
 * @param masterXml - Raw XML from ppt/slideMasters/slideMaster1.xml
 * @returns Array of extracted zone objects
 */
export function extractLayouts(
  layoutXml: string,
  _masterXml: string
): ExtractedLayout[] {
  const zones = extractZonesFromLayout(layoutXml);

  return [
    {
      name: extractLayoutName(layoutXml),
      zones,
    },
  ];
}

/**
 * Extract zones from layout XML by finding placeholder shapes.
 */
function extractZonesFromLayout(xml: string): ExtractedZone[] {
  const zones: ExtractedZone[] = [];

  // Find all shape elements <p:sp> that contain placeholders
  const shapeRegex = /<p:sp>([\s\S]*?)<\/p:sp>/gi;
  let shapeMatch: RegExpExecArray | null;

  while ((shapeMatch = shapeRegex.exec(xml)) !== null) {
    const shapeContent = shapeMatch[1];

    // Check for placeholder
    const phMatch = shapeContent.match(/<p:ph[^>]*type="([^"]+)"/i);
    if (!phMatch) continue;

    const phType = phMatch[1].toLowerCase();
    const zoneType = TYPE_MAP[phType];

    // Skip unknown placeholder types
    if (!zoneType) continue;

    // Extract position and size
    const x = extractEmu(shapeContent, /<a:off[^>]*x="([^"]+)"/i);
    const y = extractEmu(shapeContent, /<a:off[^>]*y="([^"]+)"/i);
    const w = extractEmu(shapeContent, /<a:ext[^>]*cx="([^"]+)"/i);
    const h = extractEmu(shapeContent, /<a:ext[^>]*cy="([^"]+)"/i);

    if (x === undefined || y === undefined || w === undefined || h === undefined) {
      continue; // Skip malformed shapes
    }

    // Get a human-readable name
    const name = extractShapeName(shapeContent) || phType;

    zones.push({
      name,
      x: x / SLIDE_W_EMU,
      y: y / SLIDE_H_EMU,
      w: w / SLIDE_W_EMU,
      h: h / SLIDE_H_EMU,
      type: zoneType,
    });
  }

  return zones;
}

/**
 * Extract an EMU integer value from an XML attribute.
 */
function extractEmu(xml: string, regex: RegExp): number | undefined {
  const match = xml.match(regex);
  if (!match) return undefined;
  const val = parseInt(match[1], 10);
  return isNaN(val) ? undefined : val;
}

/**
 * Extract a human-readable name from a shape's <p:nvSpPr> block.
 */
function extractShapeName(shapeContent: string): string | undefined {
  const match = shapeContent.match(/<a:t>([^<]*)<\/a:t>/i);
  return match ? match[1].trim() || undefined : undefined;
}

/**
 * Extract the layout name from the XML.
 */
function extractLayoutName(xml: string): string {
  const match = xml.match(/<p:sldLayout[^>]*>(?:[\s\S]*?)<p:cSld[^>]*>[\s\S]*?name="([^"]+)"/i);
  if (match) return match[1];

  // Fallback: try the type attribute
  const typeMatch = xml.match(/<p:sldLayout[^>]*type="([^"]+)"/i);
  if (typeMatch) return typeMatch[1];

  return 'Slide Layout';
}
