import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../parser/markdown';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FIXTURES_DIR = resolve(import.meta.dirname, '../../../../tests/fixtures');

function fixture(name: string): string {
  return readFileSync(resolve(FIXTURES_DIR, name), 'utf-8');
}

describe('parseMarkdown', () => {
  describe('basic coverage', () => {
    it('parses an empty string into no slides', () => {
      const result = parseMarkdown('');
      expect(result.slides).toHaveLength(0);
    });

    it('parses a single heading into one slide', () => {
      const result = parseMarkdown('# Hello World');
      expect(result.slides).toHaveLength(1);
      expect(result.slides[0].layout).toBe('cover');
    });

    it('handles only whitespace', () => {
      const result = parseMarkdown('   \n\n  ');
      expect(result.slides).toHaveLength(0);
    });
  });

  describe('slide segmentation', () => {
    it('splits slides on --- separator', () => {
      const md = `# Slide 1\n\nContent 1\n\n---\n\n# Slide 2\n\nContent 2`;
      const result = parseMarkdown(md);
      expect(result.slides).toHaveLength(2);
    });

    it('uses ## as implicit boundary when no --- present', () => {
      const md = `# Title\n\nIntro text\n\n## Section 1\n\nSection 1 content\n\n## Section 2\n\nSection 2 content`;
      const result = parseMarkdown(md);
      expect(result.slides).toHaveLength(3);
      expect(result.slides[0].layout).toBe('cover');
    });

    it('does not use ## as boundary when --- is present', () => {
      const md = `# Title\n\n---\n\n## Section 1\n\nContent\n\n---\n\n## Section 2\n\nContent`;
      const result = parseMarkdown(md);
      expect(result.slides).toHaveLength(3);
    });
  });

  describe('block conversion', () => {
    it('converts headings to TextBlocks', () => {
      const result = parseMarkdown('## Section Title');
      expect(result.slides[0].blocks[0]).toMatchObject({
        type: 'text',
        style: 'heading',
        level: 2,
        content: 'Section Title',
      });
    });

    it('converts paragraphs to TextBlocks', () => {
      const result = parseMarkdown('A simple paragraph.');
      expect(result.slides[0].blocks[0]).toMatchObject({
        type: 'text',
        style: 'body',
        content: 'A simple paragraph.',
      });
    });

    it('converts unordered lists to list-item blocks', () => {
      const md = `- Item 1\n- Item 2\n- Item 3`;
      const result = parseMarkdown(md);
      const items = result.slides[0].blocks.filter(
        (b) => b.type === 'text' && b.style === 'list-item'
      );
      expect(items).toHaveLength(3);
      expect(items[0]).toMatchObject({
        type: 'text',
        style: 'list-item',
        listType: 'unordered',
      });
    });

    it('converts ordered lists to list-item blocks', () => {
      const md = `1. First\n2. Second`;
      const result = parseMarkdown(md);
      const items = result.slides[0].blocks.filter(
        (b) => b.type === 'text' && b.style === 'list-item'
      );
      expect(items).toHaveLength(2);
      expect(items[0].listType).toBe('ordered');
    });

    it('converts code blocks to CodeBlocks', () => {
      const md = '```ts\nconst x: number = 1;\n```';
      const result = parseMarkdown(md);
      const codeBlock = result.slides[0].blocks[0];
      expect(codeBlock).toMatchObject({
        type: 'code',
        language: 'ts',
      });
      expect(codeBlock.type === 'code' && codeBlock.code).toContain('const x');
    });

    it('converts GFM tables to TableBlocks', () => {
      const md = `| H1 | H2 |\n|----|----|\n| A  | B  |\n| C  | D  |`;
      const result = parseMarkdown(md);
      const table = result.slides[0].blocks[0];
      expect(table).toMatchObject({
        type: 'table',
        headers: ['H1', 'H2'],
      });
      if (table.type === 'table') {
        expect(table.rows).toHaveLength(2);
        expect(table.rows[0]).toEqual(['A', 'B']);
      }
    });

    it('converts blockquotes to QuoteBlocks', () => {
      const md = '> This is a quote.\n> It continues.';
      const result = parseMarkdown(md);
      const quote = result.slides[0].blocks[0];
      expect(quote).toMatchObject({
        type: 'quote',
        text: 'This is a quote.\nIt continues.',
      });
    });

    it('converts images to ImageBlocks', () => {
      const md = '![Alt text](https://example.com/img.png)';
      const result = parseMarkdown(md);
      const block = result.slides[0].blocks[0];
      expect(block).toMatchObject({
        type: 'image',
        src: 'https://example.com/img.png',
        alt: 'Alt text',
      });
    });
  });

  describe('speaker notes', () => {
    it('extracts NOTE: lines as speaker notes', () => {
      const md = `## Slide\n\nSome content\n\nNOTE: This is a note.`;
      const result = parseMarkdown(md);
      expect(result.slides[0].speakerNotes).toBe('This is a note.');
    });

    it('does not include NOTE: lines as blocks', () => {
      const md = `## Slide\n\nNOTE: Hidden note\n\nVisible content`;
      const result = parseMarkdown(md);
      const texts = result.slides[0].blocks.map((b) => (b.type === 'text' ? b.content : ''));
      expect(texts).not.toContain('NOTE: Hidden note');
      expect(texts).toContain('Visible content');
    });

    it('accumulates multiple NOTE: lines', () => {
      const md = `## Slide\n\nNOTE: First note\n\nContent\n\nNOTE: Second note`;
      const result = parseMarkdown(md);
      expect(result.slides[0].speakerNotes).toBe('First note\nSecond note');
    });
  });

  describe('layout detection', () => {
    it('first slide is cover when it starts with h1', () => {
      const result = parseMarkdown('# Title\n\nSubtitle');
      expect(result.slides[0].layout).toBe('cover');
    });

    it('non-first slide with single h1 is section-divider', () => {
      const md = `# Title\n\n---\n\n# Section Break`;
      const result = parseMarkdown(md);
      expect(result.slides[1].layout).toBe('section-divider');
    });

    it('slide with single quote uses quote layout', () => {
      const md = `# Title\n\n---\n\n> A profound thought.`;
      const result = parseMarkdown(md);
      expect(result.slides[1].layout).toBe('quote');
    });
  });
});

describe('fixture: basic-deck', () => {
  it('parses the basic deck correctly', () => {
    const md = fixture('basic-deck.md');
    const result = parseMarkdown(md);
    // Cover + 4 content slides
    expect(result.slides.length).toBeGreaterThanOrEqual(5);
    // First slide is cover
    expect(result.slides[0].layout).toBe('cover');
    // Has code block
    const codeBlocks = result.slides.flatMap((s) => s.blocks.filter((b) => b.type === 'code'));
    expect(codeBlocks.length).toBeGreaterThanOrEqual(1);
    // Has table
    const tables = result.slides.flatMap((s) => s.blocks.filter((b) => b.type === 'table'));
    expect(tables.length).toBeGreaterThanOrEqual(1);
  });
});

describe('fixture: complex-deck', () => {
  it('parses the complex deck correctly', () => {
    const md = fixture('complex-deck.md');
    const result = parseMarkdown(md);
    // Multiple slides
    expect(result.slides.length).toBeGreaterThanOrEqual(3);
    // Has speaker notes
    const slidesWithNotes = result.slides.filter((s) => s.speakerNotes);
    expect(slidesWithNotes.length).toBeGreaterThanOrEqual(1);
  });
});

describe('fixture: code-heavy', () => {
  it('parses code-heavy deck with multiple language blocks', () => {
    const md = fixture('code-heavy.md');
    const result = parseMarkdown(md);
    const codeBlocks = result.slides.flatMap((s) => s.blocks.filter((b) => b.type === 'code'));
    expect(codeBlocks.length).toBeGreaterThanOrEqual(4);
    const langs = codeBlocks.map((b) => (b.type === 'code' ? b.language : ''));
    expect(langs).toContain('typescript');
    expect(langs).toContain('python');
    expect(langs).toContain('rust');
    expect(langs).toContain('sql');
  });
});
