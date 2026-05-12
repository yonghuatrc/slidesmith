import { describe, it, expect } from 'vitest';
import { validate, validateSlide } from '../validator';

describe('validate', () => {
  it('accepts a valid ContentModel with multiple slides', () => {
    const input = {
      slides: [
        {
          layout: 'cover',
          blocks: [
            { type: 'text', style: 'heading', content: 'Title', level: 1 },
          ],
          subtitle: 'Subtitle',
        },
        {
          layout: 'hero-top',
          blocks: [
            { type: 'text', style: 'body', content: 'Some body text' },
            { type: 'text', style: 'list-item', content: 'Item 1', listType: 'unordered' },
          ],
        },
      ],
    };
    const result = validate(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
    }
  });

  it('accepts a slide with all block types', () => {
    const input = {
      slides: [{
        layout: 'comparison',
        blocks: [
          { type: 'text', style: 'heading', content: 'Header', level: 1 },
          { type: 'table', headers: ['A', 'B'], rows: [['1', '2']] },
          { type: 'code', language: 'ts', code: 'const x = 1;' },
          { type: 'image', src: 'img.png', alt: 'test' },
          { type: 'quote', text: 'Quote text', attribution: 'Author' },
          { type: 'two-column', leftHeader: 'Left', leftItems: ['a'], rightHeader: 'Right', rightItems: ['b'] },
        ],
      }],
    };
    const result = validate(input);
    expect(result.success).toBe(true);
  });

  it('rejects invalid layout type', () => {
    const input = { slides: [{ layout: 'invalid-layout', blocks: [] }] };
    const result = validate(input);
    expect(result.success).toBe(false);
  });

  it('accepts empty slides array', () => {
    const result = validate({ slides: [] });
    expect(result.success).toBe(true);
  });

  it('rejects TextBlock with empty content', () => {
    const input = {
      slides: [{
        layout: 'cover',
        blocks: [{ type: 'text', style: 'body', content: '' }],
      }],
    };
    const result = validate(input);
    expect(result.success).toBe(false);
  });

  it('rejects QuoteBlock with empty text', () => {
    const result = validate({
      slides: [{
        layout: 'quote',
        blocks: [{ type: 'quote', text: '' }],
      }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects ImageBlock with empty src', () => {
    const result = validate({
      slides: [{
        layout: 'hero-top',
        blocks: [{ type: 'image', src: '', alt: 'test' }],
      }],
    });
    expect(result.success).toBe(false);
  });
});

describe('validateSlide', () => {
  it('accepts a single valid slide', () => {
    const result = validateSlide({
      layout: 'section-divider',
      blocks: [{ type: 'text', style: 'heading', content: 'Section', level: 1 }],
      background: { type: 'color', value: '#333' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid slide', () => {
    const result = validateSlide({ layout: 'unknown', blocks: [] });
    expect(result.success).toBe(false);
  });
});
