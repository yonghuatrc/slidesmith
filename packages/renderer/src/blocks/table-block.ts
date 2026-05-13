import type { TableBlock } from '@slidesmith/content-model';
import type { Theme } from '@slidesmith/themes';
import type { Zone } from '../layouts/types';
import { zoneToInches } from '../utils/pptx';
import { lightenColor } from '../utils/color';

/**
 * Render a TableBlock onto a pptxgenjs slide.
 * @param fontScale Optional scale factor for font sizes.
 */
export function renderTableBlock(
  block: TableBlock,
  zone: Zone,
  slide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number,
  fontScale: number = 1.0
): void {
  const { x, y, w, h } = zoneToInches(zone, slideWidth, slideHeight);

  const headerFontSize = Math.max(8, Math.round(12 * fontScale));
  const dataFontSize = Math.max(8, Math.round(11 * fontScale));

  // Build table rows
  const headerRow = block.headers.map((header) => ({
    text: header,
    options: {
      fontSize: headerFontSize,
      fontFace: theme.fonts.body.family,
      color: '#FFFFFF',
      bold: true,
      fill: { color: theme.colors.accent },
      align: 'center' as const,
      valign: 'middle' as const,
    },
  }));

  const dataRows = block.rows.map((row, rowIndex) =>
    row.map((cell, _colIndex) => ({
      text: cell,
      options: {
        fontSize: dataFontSize,
        fontFace: theme.fonts.body.family,
        color: theme.colors.text,
        fill: {
          color: rowIndex % 2 === 0 ? theme.colors.surface : lightenColor(theme.colors.surface, 0.05),
        },
        align: 'left' as const,
        valign: 'middle' as const,
        margin: [4, 6, 4, 6],
      },
    }))
  );

  const allRows = [headerRow, ...dataRows];

  // Column widths
  const colW = block.headers.map(() => w / block.headers.length);

  slide.addTable(allRows, {
    x,
    y,
    w,
    h,
    colW,
    margin: [0, 0, 0, 0],
    border: { type: 'solid', pt: 0.5, color: theme.colors.border },
    autoPage: false,
  });
}
