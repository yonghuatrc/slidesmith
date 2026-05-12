import { describe, it, expect } from 'vitest';
import { getLayout, getAllLayouts } from '../layouts/registry';
import { distributeBlocks } from '../layouts/distributor';
import type { Block } from '@slidesmith/content-model';

describe('Layout Registry', () => {
  it('registers all 8 layouts', () => {
    const layouts = getAllLayouts();
    expect(layouts).toHaveLength(8);
  });

  it('resolves each layout type', () => {
    const types = ['cover', 'hero-top', 'three-column', 'symmetric', 'waterfall', 'comparison', 'quote', 'section-divider'] as const;
    for (const t of types) {
      expect(() => getLayout(t)).not.toThrow();
      expect(getLayout(t).zones.length).toBeGreaterThan(0);
    }
  });

  it('getLayout throws for unknown layout', () => {
    expect(() => getLayout('unknown' as any)).toThrow('ERR_LAYOUT_NOT_FOUND');
  });

  it('each layout has valid zone positions', () => {
    for (const layout of getAllLayouts()) {
      for (const zone of layout.zones) {
        expect(zone.x).toBeGreaterThanOrEqual(0);
        expect(zone.y).toBeGreaterThanOrEqual(0);
        expect(zone.w).toBeGreaterThan(0);
        expect(zone.h).toBeGreaterThan(0);
        expect(zone.x + zone.w).toBeLessThanOrEqual(1);
        expect(zone.y + zone.h).toBeLessThanOrEqual(1);
      }
    }
  });

  it('each layout has affinity for every zone', () => {
    for (const layout of getAllLayouts()) {
      for (const zone of layout.zones) {
        expect(layout.affinities[zone.name]).toBeDefined();
      }
    }
  });
});

describe('Distributor', () => {
  it('assigns heading to header zone in hero-top', () => {
    const layout = getLayout('hero-top');
    const blocks: Block[] = [
      { type: 'text', style: 'heading', content: 'Title', level: 1 },
      { type: 'text', style: 'body', content: 'Body text' },
    ];
    const result = distributeBlocks(layout, blocks);
    const header = result.find((a) => a.affinity === 'header');
    const body = result.find((a) => a.affinity === 'body');
    expect(header?.blocks).toHaveLength(1);
    expect(header?.blocks[0].type).toBe('text');
    expect(body?.blocks).toHaveLength(1);
  });

  it('assigns image to media zone in symmetric layout', () => {
    const layout = getLayout('symmetric');
    const blocks: Block[] = [
      { type: 'text', style: 'heading', content: 'Title', level: 1 },
      { type: 'image', src: 'img.png', alt: 'test' },
    ];
    const result = distributeBlocks(layout, blocks);
    const media = result.find((a) => a.affinity === 'media');
    expect(media?.blocks).toHaveLength(1);
    expect(media?.blocks[0].type).toBe('image');
  });

  it('assigns quote to quote zone in quote layout', () => {
    const layout = getLayout('quote');
    const blocks: Block[] = [
      { type: 'quote', text: 'The quote', attribution: 'Author' },
    ];
    const result = distributeBlocks(layout, blocks);
    const quote = result.find((a) => a.affinity === 'quote');
    expect(quote?.blocks).toHaveLength(1);
  });

  it('unmatched blocks fall through to body zone', () => {
    const layout = getLayout('hero-top');
    const blocks: Block[] = [
      { type: 'table', headers: ['A'], rows: [['1']] },
    ];
    const result = distributeBlocks(layout, blocks);
    const body = result.find((a) => a.affinity === 'body');
    expect(body?.blocks).toHaveLength(1);
    expect(body?.blocks[0].type).toBe('table');
  });

  it('returns zone assignments for all zones', () => {
    const layout = getLayout('three-column');
    const blocks: Block[] = [
      { type: 'text', style: 'heading', content: 'H', level: 1 },
      { type: 'text', style: 'body', content: 'A' },
      { type: 'text', style: 'body', content: 'B' },
      { type: 'text', style: 'body', content: 'C' },
    ];
    const result = distributeBlocks(layout, blocks);
    expect(result).toHaveLength(4); // header, col1, col2, col3
  });

  it('handles empty blocks', () => {
    const layout = getLayout('cover');
    const result = distributeBlocks(layout, []);
    expect(result.length).toBeGreaterThan(0);
    for (const a of result) {
      expect(a.blocks).toHaveLength(0);
    }
  });
});
