import type { Slide, Block } from '@slidesmith/content-model';
import type { Theme } from '@slidesmith/themes';
import { getLayout } from '../layouts/registry';
import { distributeBlocks } from '../layouts/distributor';
import { renderTextBlock } from '../blocks/text-block';
import { renderTableBlock } from '../blocks/table-block';
import { renderCodeBlock } from '../blocks/code-block';
import { renderImageBlock } from '../blocks/image-block';
import { renderQuoteBlock } from '../blocks/quote-block';
import { renderTwoColumnBlock } from '../blocks/two-column-block';
import { zoneToInches, getSlideWidth } from '../utils/pptx';

/**
 * Build all slides into a pptxgenjs presentation.
 */
export async function buildSlides(
  slides: Slide[],
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  ratio: '16:9' | '4:3',
  pptx: any
): Promise<void> {
  const slideWidth = getSlideWidth(ratio);
  const slideHeight = 7.5;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const pptxSlide = pptx.addSlide();

    // Set background color
    const bgColor = slide.background?.type === 'color'
      ? slide.background.value
      : theme.colors.background;
    pptxSlide.background = { color: bgColor };

    // Get layout definition
    const layout = getLayout(slide.layout);

    // Distribute blocks to zones
    const assignments = distributeBlocks(layout, slide.blocks);

    // Render each zone
    for (const assignment of assignments) {
      if (assignment.blocks.length === 0) continue;

      switch (assignment.affinity) {
        case 'header':
          // Render first heading block
          for (const block of assignment.blocks) {
            if (block.type === 'text' && block.style === 'heading') {
              await renderBlock(block, assignment.zone, pptxSlide, theme, density, slideWidth, slideHeight);
            }
          }
          break;

        case 'body':
        case 'col1':
        case 'col2':
        case 'col3':
        case 'left':
        case 'right':
        case 'sections':
          // Render all blocks stacked vertically
          await renderZoneBlocks(assignment.blocks, assignment.zone, pptxSlide, theme, density, slideWidth, slideHeight);
          break;

        case 'media':
          // Render media blocks (image, two-column)
          for (const block of assignment.blocks) {
            await renderBlock(block, assignment.zone, pptxSlide, theme, density, slideWidth, slideHeight);
          }
          break;

        case 'quote':
          for (const block of assignment.blocks) {
            if (block.type === 'quote') {
              await renderBlock(block, assignment.zone, pptxSlide, theme, density, slideWidth, slideHeight);
            }
          }
          break;

        case 'attribution':
        case 'footer':
          for (const block of assignment.blocks) {
            await renderBlock(block, assignment.zone, pptxSlide, theme, density, slideWidth, slideHeight);
          }
          break;
      }
    }

    // Render speaker notes if present
    if (slide.speakerNotes) {
      pptxSlide.addNotes(slide.speakerNotes);
    }
  }
}

/**
 * Render multiple blocks stacked vertically within a zone.
 */
async function renderZoneBlocks(
  blocks: Block[],
  zone: import('../layouts/types').Zone,
  pptxSlide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number
): Promise<void> {
  const spacing = theme.spacing[density];
  const { x, y, w, h } = zoneToInches(zone, slideWidth, slideHeight);
  const blockCount = blocks.length;

  if (blockCount === 0) return;

  // Divide zone height equally among blocks
  const blockHeight = (h - (blockCount - 1) * spacing.blockGap / 72) / blockCount;

  for (let i = 0; i < blockCount; i++) {
    const block = blocks[i];
    const blockY = y + i * (blockHeight + spacing.blockGap / 72);

    // Create a sub-zone for this block
    const subZone = { ...zone, y: blockY / slideHeight, h: blockHeight / slideHeight };

    await renderBlock(block, subZone, pptxSlide, theme, density, slideWidth, slideHeight);
  }
}

/**
 * Dispatch a single block to the appropriate renderer.
 */
async function renderBlock(
  block: Block,
  zone: import('../layouts/types').Zone,
  pptxSlide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number
): Promise<void> {
  switch (block.type) {
    case 'text':
      renderTextBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight);
      break;
    case 'table':
      renderTableBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight);
      break;
    case 'code':
      await renderCodeBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight);
      break;
    case 'image':
      renderImageBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight);
      break;
    case 'quote':
      renderQuoteBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight);
      break;
    case 'two-column':
      renderTwoColumnBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight);
      break;
  }
}

export { renderZoneBlocks, renderBlock };
