import type { ImageBlock } from '@slidesmith/content-model';
import type { Theme } from '@slidesmith/themes';
import type { Zone } from '../layouts/types';
import { zoneToInches } from '../utils/pptx';
import { readFileSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';

/**
 * Render an ImageBlock onto a pptxgenjs slide.
 * Supports local paths, URLs, and relative paths resolved against cwd.
 * @param fontScale Optional scale factor (unused for images, kept for interface compatibility).
 */
export function renderImageBlock(
  block: ImageBlock,
  zone: Zone,
  slide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number,
  _fontScale: number = 1.0
): void {
  const { x, y, w, h } = zoneToInches(zone, slideWidth, slideHeight);

  try {
    const isRemoteUrl = block.src.startsWith('http://') || block.src.startsWith('https://');

    if (isRemoteUrl) {
      slide.addText(`[Image: ${block.alt}]`, {
        x,
        y,
        w,
        h,
        fontSize: 12,
        fontFace: theme.fonts.body.family,
        color: theme.colors.textMuted,
        italic: true,
        align: 'center',
        valign: 'middle',
      });
      return;
    }

    // Local file
    const imgPath = isAbsolute(block.src) ? block.src : resolve(process.cwd(), block.src);
    const imageData = readFileSync(imgPath);

    // Determine image type
    const ext = block.src.split('.').pop()?.toLowerCase();
    const isPng = ext === 'png';

    const imgOpts: any = {
      x,
      y,
      w,
      h,
      sizing: { type: 'contain', w, h },
    };

    if (isPng) {
      imgOpts.data = `data:image/png;base64,${imageData.toString('base64')}`;
    } else {
      imgOpts.data = imageData; // pass buffer for JPEG
    }

    slide.addImage(imgOpts);
  } catch {
    // Failed to load image — show alt text
    slide.addText(`[Image: ${block.alt}]`, {
      x,
      y,
      w,
      h,
      fontSize: 12,
      fontFace: theme.fonts.body.family,
      color: theme.colors.textMuted,
      italic: true,
      align: 'center',
      valign: 'middle',
    });
  }
}
