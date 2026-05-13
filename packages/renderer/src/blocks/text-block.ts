import type { TextBlock } from '@slidesmith/content-model';
import type { Theme } from '@slidesmith/themes';
import type { Zone } from '../layouts/types';
import { zoneToInches } from '../utils/pptx';

/**
 * Render a TextBlock onto a pptxgenjs slide.
 * @param fontScale Optional scale factor for font sizes (used by compact overflow handling).
 */
export function renderTextBlock(
  block: TextBlock,
  zone: Zone,
  slide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number,
  fontScale: number = 1.0
): void {
  const { x, y, w, h } = zoneToInches(zone, slideWidth, slideHeight);
  const spacing = theme.spacing[density];

  let fontSize: number;
  let fontFace: string;
  let bold: boolean;
  let color: string;
  let align: 'left' | 'center';

  if (block.style === 'heading') {
    fontFace = theme.fonts.heading.family;
    bold = true;
    color = theme.colors.accent;

    switch (block.level) {
      case 1:
        fontSize = Math.max(14, Math.round(36 * fontScale));
        align = 'center';
        break;
      case 2:
        fontSize = Math.max(12, Math.round(28 * fontScale));
        align = 'left';
        break;
      case 3:
        fontSize = Math.max(10, Math.round(22 * fontScale));
        align = 'left';
        break;
      default:
        fontSize = Math.max(9, Math.round(18 * fontScale));
        align = 'left';
    }
  } else if (block.style === 'list-item') {
    fontFace = theme.fonts.body.family;
    fontSize = Math.max(8, Math.round((theme.fonts.body.size || 14) * fontScale));
    bold = false;
    color = theme.colors.text;
    align = 'left';

    const bullet = block.listType === 'ordered' ? '1. ' : '• ';
    slide.addText(bullet + block.content, {
      x,
      y,
      w,
      h: h * 0.15,
      fontSize,
      fontFace,
      color,
      bold,
      align,
      valign: 'top',
      paraSpaceAfter: spacing.paragraphGap / 2,
    });
    return;
  } else {
    fontFace = theme.fonts.body.family;
    fontSize = Math.max(8, Math.round((theme.fonts.body.size || 14) * fontScale));
    bold = false;
    color = theme.colors.text;
    align = 'left';
  }

  slide.addText(block.content, {
    x,
    y,
    w,
    h,
    fontSize,
    fontFace,
    color,
    bold,
    align,
    valign: 'top',
    paraSpaceAfter: spacing.paragraphGap,
    autoFit: true,
  });
}
