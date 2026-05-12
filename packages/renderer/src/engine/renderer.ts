import PptxGenJS from 'pptxgenjs';
import type { Slide } from '@slidesmith/content-model';
import type { Theme } from '@slidesmith/themes';
import { buildSlides } from './slide-builder';

export interface RenderOptions {
  ratio: '16:9' | '4:3';
  density: 'compact' | 'comfortable' | 'breathing';
  title?: string;
  author?: string;
}

export interface RenderResult {
  /** The pptxgenjs instance (call .write({ outputType: 'nodebuffer' }) or .writeFile()). */
  pptx: any;
  /** Number of slides rendered. */
  slideCount: number;
}

/**
 * Render a deck of Slides into a pptxgenjs presentation.
 */
export async function renderToPptx(
  slides: Slide[],
  theme: Theme,
  options: RenderOptions
): Promise<RenderResult> {
  const pptx = new PptxGenJS();
  pptx.layout = options.ratio === '16:9' ? 'LAYOUT_WIDE' : 'LAYOUT_4x3';

  if (options.title) pptx.title = options.title;
  if (options.author) pptx.author = options.author;

  await buildSlides(slides, theme, options.density, options.ratio, pptx);

  return {
    pptx,
    slideCount: slides.length,
  };
}

export interface DryRunResult {
  slideCount: number;
  layouts: string[];
  blockCounts: number[];
}

/**
 * Dry-run: return slide statistics without rendering.
 */
export function dryRun(slides: Slide[]): DryRunResult {
  return {
    slideCount: slides.length,
    layouts: slides.map((s) => s.layout),
    blockCounts: slides.map((s) => s.blocks.length),
  };
}
