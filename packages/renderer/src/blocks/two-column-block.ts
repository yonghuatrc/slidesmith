import type { TwoColumnBlock } from '@slidesmith/content-model';
import type { Theme } from '@slidesmith/themes';
import type { Zone } from '../layouts/types';
import { zoneToInches } from '../utils/pptx';

/**
 * Render a TwoColumnBlock onto a pptxgenjs slide.
 */
export function renderTwoColumnBlock(
  block: TwoColumnBlock,
  zone: Zone,
  slide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number
): void {
  const { x, y, w, h } = zoneToInches(zone, slideWidth, slideHeight);
  const colWidth = (w - 0.2) / 2;
  const spacing = theme.spacing[density];

  // Left column header
  slide.addText(block.leftHeader, {
    x,
    y,
    w: colWidth,
    h: 0.4,
    fontSize: 16,
    fontFace: theme.fonts.heading.family,
    color: theme.colors.accent,
    bold: true,
    align: 'left',
    valign: 'top',
  });

  // Left column items
  const leftItems = block.leftItems.join('\n');
  slide.addText(leftItems, {
    x,
    y: y + 0.45,
    w: colWidth,
    h: h - 0.45,
    fontSize: 12,
    fontFace: theme.fonts.body.family,
    color: theme.colors.text,
    align: 'left',
    valign: 'top',
    paraSpaceAfter: spacing.paragraphGap,
  });

  // Vertical divider
  const dividerX = x + colWidth + 0.1;
  slide.addShape('rect', {
    x: dividerX,
    y,
    w: 0.01,
    h,
    fill: { color: theme.colors.border },
  });

  // Right column header
  slide.addText(block.rightHeader, {
    x: dividerX + 0.15,
    y,
    w: colWidth,
    h: 0.4,
    fontSize: 16,
    fontFace: theme.fonts.heading.family,
    color: theme.colors.accent,
    bold: true,
    align: 'left',
    valign: 'top',
  });

  // Right column items
  const rightItems = block.rightItems.join('\n');
  slide.addText(rightItems, {
    x: dividerX + 0.15,
    y: y + 0.45,
    w: colWidth,
    h: h - 0.45,
    fontSize: 12,
    fontFace: theme.fonts.body.family,
    color: theme.colors.text,
    align: 'left',
    valign: 'top',
    paraSpaceAfter: spacing.paragraphGap,
  });
}
