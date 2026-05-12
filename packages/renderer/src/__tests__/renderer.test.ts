import { describe, it, expect } from 'vitest';
import PptxGenJS from 'pptxgenjs';
import { dryRun } from '../index';
import type { Slide } from '@slidesmith/content-model';

describe('renderer scaffold', () => {
  it('imports pptxgenjs without error', () => {
    expect(PptxGenJS).toBeDefined();
  });

  it('creates a basic PPTX with text', async () => {
    const pptx = new PptxGenJS();
    const slide = pptx.addSlide();
    slide.addText('Hello World', { x: 1, y: 1, w: 8, h: 1, fontSize: 24 });
    const result = (await pptx.write({ outputType: 'nodebuffer' })) as Uint8Array;
    expect(result).toBeTruthy();
    expect(result.byteLength || (result as any).length).toBeGreaterThan(0);
  });

  it('dryRun returns slide statistics', () => {
    const slides: Slide[] = [
      { layout: 'cover', blocks: [{ type: 'text', style: 'heading', content: 'Title', level: 1 }] },
      { layout: 'hero-top', blocks: [{ type: 'text', style: 'body', content: 'Body' }] },
    ];
    const result = dryRun(slides);
    expect(result.slideCount).toBe(2);
    expect(result.layouts).toEqual(['cover', 'hero-top']);
    expect(result.blockCounts).toEqual([1, 1]);
  });

  it('dryRun handles empty slides', () => {
    expect(dryRun([]).slideCount).toBe(0);
  });
});
