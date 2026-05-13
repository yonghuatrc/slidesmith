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
import type { Zone } from '../layouts/types';

/**
 * Overflow tracking state for renderZoneBlocks.
 */
export interface OverflowState {
  /** Whether overflow was detected in the zone. */
  overflowed: boolean;
  /** Blocks that couldn't fit (for breathing mode). */
  overflowBlocks: Block[];
  /** Warning messages about truncation (for comfortable mode). */
  warnings: string[];
}

/**
 * Build all slides into a pptxgenjs presentation.
 * Handles overflow according to density mode:
 *   compact    — scale down fonts progressively
 *   comfortable — truncate content at zone boundary with warning
 *   breathing   — split overflow into new slides
 */
export async function buildSlides(
  slides: Slide[],
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  ratio: '16:9' | '4:3',
  pptx: any
): Promise<number> {
  const slideWidth = getSlideWidth(ratio);
  const slideHeight = 7.5;
  let totalSlides = 0;

  for (let i = 0; i < slides.length; i++) {
    totalSlides += await renderSlideWithOverflow(
      slides[i], theme, density, pptx, slideWidth, slideHeight
    );
  }

  return totalSlides;
}

/**
 * Render a single slide, handling overflow according to density mode.
 * Returns number of slides actually rendered (1 + possible overflow splits).
 */
async function renderSlideWithOverflow(
  slide: Slide,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  pptx: any,
  slideWidth: number,
  slideHeight: number
): Promise<number> {
  let slidesRendered = 0;
  let currentBlocks = [...slide.blocks];
  let overflowCount = 0;

  // Keep rendering slides while we have blocks (for breathing mode splits)
  while (currentBlocks.length > 0) {
    const pptxSlide = pptx.addSlide();
    slidesRendered++;

    // Set background color
    const bgColor = slide.background?.type === 'color'
      ? slide.background.value
      : theme.colors.background;
    pptxSlide.background = { color: bgColor };

    // Get layout definition
    const layout = getLayout(slide.layout);

    // Create a working copy with current blocks
    const workingSlide: Slide = {
      ...slide,
      blocks: currentBlocks,
    };

    // Distribute blocks to zones
    const assignments = distributeBlocks(layout, workingSlide.blocks);

    // Track overflow state across all zones
    let slideOverflowed = false;
    const fontScale = 1.0;

    // Render each zone
    for (const assignment of assignments) {
      if (assignment.blocks.length === 0) continue;

      let zoneOverflow: OverflowState | undefined;

      switch (assignment.affinity) {
        case 'header':
          for (const block of assignment.blocks) {
            if (block.type === 'text' && block.style === 'heading') {
              await renderBlock(block, assignment.zone, pptxSlide, theme, density, slideWidth, slideHeight, fontScale);
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
          zoneOverflow = await renderZoneBlocks(
            assignment.blocks, assignment.zone, pptxSlide, theme, density,
            slideWidth, slideHeight, fontScale
          );
          break;

        case 'media':
          for (const block of assignment.blocks) {
            const { y, w, h } = zoneToInches(assignment.zone, slideWidth, slideHeight);
            const renderedH = estimateBlockHeight(block, theme, density, w, h, fontScale);
            if (density === 'comfortable' && y + renderedH > y + h) {
              console.warn(`[overflow] Content truncated in ${assignment.zone.name} (${slide.layout})`);
              zoneOverflow = { overflowed: true, overflowBlocks: [block], warnings: [] };
              break;
            }
            await renderBlock(block, assignment.zone, pptxSlide, theme, density, slideWidth, slideHeight, fontScale);
          }
          break;

        case 'quote':
          for (const block of assignment.blocks) {
            if (block.type === 'quote') {
              await renderBlock(block, assignment.zone, pptxSlide, theme, density, slideWidth, slideHeight, fontScale);
            }
          }
          break;

        case 'attribution':
        case 'footer':
          for (const block of assignment.blocks) {
            await renderBlock(block, assignment.zone, pptxSlide, theme, density, slideWidth, slideHeight, fontScale);
          }
          break;
      }

      if (zoneOverflow?.overflowed) {
        slideOverflowed = true;
      }
    }

    // Handle overflow based on density
    if (slideOverflowed) {
      if (density === 'compact' && fontScale > 0.6) {
        // Re-render with smaller fonts — but we already rendered. Instead,
        // for compact mode we apply font scaling progressively per-block.
        // This is handled inline in renderZoneBlocks.
      }

      if (density === 'breathing' && overflowCount === 0) {
        // Split remaining content into a new slide
        currentBlocks = currentBlocks.slice(Math.ceil(currentBlocks.length / 2));
        overflowCount++;
        continue;
      }
    }

    break; // Exit loop — no more splits needed
  }

  // Render speaker notes on the first slide
  if (slide.speakerNotes && slidesRendered > 0) {
    const firstSlide = pptx.slides?.[pptx.slides.length - slidesRendered];
    if (firstSlide) {
      firstSlide.addNotes(slide.speakerNotes);
    }
  }

  return slidesRendered;
}

/**
 * Render multiple blocks stacked vertically within a zone,
 * with overflow detection and handling.
 */
async function renderZoneBlocks(
  blocks: Block[],
  zone: Zone,
  pptxSlide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number,
  fontScale: number = 1.0
): Promise<OverflowState | undefined> {
  const spacing = theme.spacing[density];
  const { x, y, w, h } = zoneToInches(zone, slideWidth, slideHeight);
  const blockCount = blocks.length;

  if (blockCount === 0) return;

  const overflowState: OverflowState = {
    overflowed: false,
    overflowBlocks: [],
    warnings: [],
  };

  // Track the Y position as we render blocks
  let currentY = y;
  let scale = fontScale;

  // Divide zone height equally among blocks
  const gap = spacing.blockGap / 72;
  const baseBlockHeight = (h - (blockCount - 1) * gap) / blockCount;

  for (let i = 0; i < blockCount; i++) {
    const block = blocks[i];
    const blockHeight = baseBlockHeight * scale;
    const blockY = currentY;

    // Check if this block would overflow the zone
    const blockBottom = blockY + blockHeight;
    const zoneBottom = y + h;

    if (density === 'comfortable' && blockBottom > zoneBottom) {
      console.warn(
        `[overflow] Block ${i} exceeds zone "${zone.name}" boundary. Truncating.`
      );
      overflowState.overflowed = true;
      overflowState.warnings.push(`Truncated block ${i} in zone "${zone.name}"`);
      break;
    }

    // For breathing mode: if this block doesn't fit, collect remaining as overflow
    if (density === 'breathing' && blockBottom > zoneBottom) {
      overflowState.overflowed = true;
      overflowState.overflowBlocks = blocks.slice(i);
      break;
    }

    // Create a sub-zone for this block
    const subZone: Zone = {
      ...zone,
      y: blockY / slideHeight,
      h: blockHeight / slideHeight,
    };

    await renderBlock(block, subZone, pptxSlide, theme, density, slideWidth, slideHeight, scale);

    // Advance Y position
    currentY = blockY + blockHeight + gap;

    // For compact mode: reduce font scale for subsequent blocks
    if (density === 'compact' && scale > 0.6) {
      scale = Math.max(0.6, scale - 0.1);
    }
  }

  return overflowState;
}

/**
 * Estimate the height of a block for overflow calculations.
 */
function estimateBlockHeight(
  block: Block,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  zoneWidth: number,
  zoneHeight: number,
  fontScale: number
): number {
  const baseFontSize = (theme.fonts.body.size || 14) * fontScale;
  const lineHeight = baseFontSize / 72; // Convert pt to inches

  switch (block.type) {
    case 'text': {
      if (block.style === 'heading') {
        const headingSize = (block.level === 1 ? 36 : block.level === 2 ? 28 : 22) * fontScale;
        return headingSize / 72 + 0.1;
      }
      // Estimate lines based on word wrap
      const charsPerLine = Math.floor((zoneWidth * 72) / (baseFontSize * 0.6));
      const lines = Math.ceil(block.content.length / Math.max(charsPerLine, 1));
      return Math.min(lines * lineHeight + 0.1, zoneHeight);
    }

    case 'table': {
      const rowCount = block.rows.length + 1; // +1 for header
      return rowCount * 0.3 * fontScale;
    }

    case 'code': {
      const codeLines = block.code.split('\n').length;
      return codeLines * 0.15 * fontScale;
    }

    case 'quote':
      return zoneHeight * 0.6;

    case 'image':
      return zoneHeight * 0.6;

    case 'two-column':
      return zoneHeight * 0.5;

    default:
      return zoneHeight / 2;
  }
}

/**
 * Dispatch a single block to the appropriate renderer.
 * Accepts optional fontScale for compact mode overflow handling.
 */
async function renderBlock(
  block: Block,
  zone: Zone,
  pptxSlide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number,
  fontScale: number = 1.0
): Promise<void> {
  switch (block.type) {
    case 'text':
      renderTextBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight, fontScale);
      break;
    case 'table':
      renderTableBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight, fontScale);
      break;
    case 'code':
      await renderCodeBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight, fontScale);
      break;
    case 'image':
      renderImageBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight, fontScale);
      break;
    case 'quote':
      renderQuoteBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight, fontScale);
      break;
    case 'two-column':
      renderTwoColumnBlock(block, zone, pptxSlide, theme, density, slideWidth, slideHeight, fontScale);
      break;
  }
}

export { renderZoneBlocks, renderBlock };
