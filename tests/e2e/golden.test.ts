import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CLI = resolve(import.meta.dirname, '../../packages/core/src/cli/index.ts');
const FIXTURES = resolve(import.meta.dirname, '../fixtures');
const OUTPUT = '/tmp/slidesmith-golden-test.pptx';

describe('golden test', () => {
  beforeAll(() => {
    execSync(`npx tsx ${CLI} build ${FIXTURES}/basic-deck.md -o ${OUTPUT}`, {
      cwd: resolve(import.meta.dirname, '../..'),
      timeout: 30000,
    });
  });

  it('produces a valid PPTX file', () => {
    expect(existsSync(OUTPUT)).toBe(true);
    const buffer = readFileSync(OUTPUT);
    expect(buffer.length).toBeGreaterThan(0);

    // PPTX is a ZIP file — check magic bytes
    expect(buffer[0]).toBe(0x50); // P
    expect(buffer[1]).toBe(0x4b); // K
    expect(buffer[2]).toBe(0x03); // 0x0304 = ZIP
    expect(buffer[3]).toBe(0x04);
  });

  it('contains required PPTX internal files', () => {
    const listing = execSync(`unzip -l ${OUTPUT}`, { encoding: 'utf-8' });

    expect(listing).toContain('[Content_Types].xml');
    expect(listing).toContain('ppt/presentation.xml');
    expect(listing).toContain('ppt/slides/slide1.xml');
    expect(listing).toContain('ppt/slides/slide2.xml');
    expect(listing).toContain('ppt/slides/slide3.xml');
    expect(listing).toContain('ppt/slides/slide4.xml');
    expect(listing).toContain('ppt/slides/slide5.xml');
    expect(listing).toContain('ppt/theme/theme1.xml');
  });

  it('renders exactly 5 slides from basic-deck.md', () => {
    const output = execSync(`unzip -p ${OUTPUT} ppt/presentation.xml`, { encoding: 'utf-8' });
    const slideCount = (output.match(/<p:sldId/g) || []).length;
    expect(slideCount).toBe(5);
  });

  it('applies correct theme colors in XML', () => {
    const theme = execSync(`unzip -p ${OUTPUT} ppt/theme/theme1.xml`, { encoding: 'utf-8' });
    expect(theme).toContain('0D1117'); // dark-tech background
    expect(theme).toContain('58A6FF'); // dark-tech accent
  });
});
