import { describe, it, expect } from 'vitest';
import PptxGenJS from 'pptxgenjs';
import { createRenderer } from '../index';

describe('renderer scaffold', () => {
  it('imports pptxgenjs without error', () => {
    expect(PptxGenJS).toBeDefined();
  });

  it('creates a basic PPTX with text', async () => {
    const pptx = new PptxGenJS();
    const slide = pptx.addSlide();
    slide.addText('Hello World', { x: 1, y: 1, w: 8, h: 1, fontSize: 24 });
    const buffer = await pptx.write({ outputType: 'nodebuffer' });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('createRenderer returns marker string', () => {
    expect(createRenderer()).toBe('renderer-ready');
  });
});
