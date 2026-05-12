import type { QuoteBlock } from '@slidesmith/content-model';
import type { Theme } from '@slidesmith/themes';
import type { Zone } from '../layouts/types';
import { zoneToInches } from '../utils/pptx';

/**
 * Render a QuoteBlock onto a pptxgenjs slide.
 */
export function renderQuoteBlock(
  block: QuoteBlock,
  zone: Zone,
  slide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number
): void {
  const { x, y, w, h } = zoneToInches(zone, slideWidth, slideHeight);

  // Opening quote mark
  slide.addText('"', {
    x,
    y: y - 0.2,
    w: 0.5,
    h: 0.5,
    fontSize: 48,
    fontFace: theme.fonts.heading.family,
    color: theme.colors.accent,
    bold: true,
    align: 'left',
    valign: 'top',
  });

  // Quote text
  slide.addText(block.text, {
    x: x + 0.3,
    y,
    w: w - 0.3,
    h,
    fontSize: 24,
    fontFace: theme.fonts.heading.family,
    color: theme.colors.text,
    italic: true,
    align: 'left',
    valign: 'top',
    lineSpacing: 32,
    autoFit: true,
  });

  // Attribution
  if (block.attribution) {
    const attrY = y + h * 0.8;
    slide.addText(`— ${block.attribution}`, {
      x: x + 0.3,
      y: attrY,
      w: w - 0.3,
      h: 0.3,
      fontSize: 14,
      fontFace: theme.fonts.body.family,
      color: theme.colors.textMuted,
      italic: false,
      align: 'right',
      valign: 'top',
    });
  }
}
