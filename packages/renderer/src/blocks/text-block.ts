import type { TextBlock } from '@slidesmith/content-model';
import type { Theme } from '@slidesmith/themes';
import type { Zone } from '../layouts/types';
import { zoneToInches } from '../utils/pptx';

/**
 * Render a TextBlock onto a pptxgenjs slide.
 */
export function renderTextBlock(
  block: TextBlock,
  zone: Zone,
  slide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number
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
        fontSize = 36;
        align = 'center';
        break;
      case 2:
        fontSize = 28;
        align = 'left';
        break;
      case 3:
        fontSize = 22;
        align = 'left';
        break;
      default:
        fontSize = 18;
        align = 'left';
    }
  } else if (block.style === 'list-item') {
    fontFace = theme.fonts.body.family;
    fontSize = theme.fonts.body.size || 14;
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
    fontSize = theme.fonts.body.size || 14;
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
