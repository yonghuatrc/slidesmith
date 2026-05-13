import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { loadTheme } from '@slidesmith/themes';
import { parseMarkdown } from '../parser/markdown';
import { renderToPptx, dryRun } from '@slidesmith/renderer';

export interface BuildOptions {
  theme: string;
  output: string;
  ratio: '16:9' | '4:3';
  density: 'compact' | 'comfortable' | 'breathing';
  dryRun?: boolean;
  verbose?: boolean;
  title?: string;
  author?: string;
}

/**
 * Execute the build command.
 */
export async function executeBuild(
  inputFile: string,
  options: BuildOptions
): Promise<void> {
  // Validate input file
  const mdPath = resolve(process.cwd(), inputFile);
  if (!existsSync(mdPath)) {
    throw new Error(`ERR_FILE_NOT_FOUND: Input file not found: ${mdPath}`);
  }

  // Read markdown
  const md = readFileSync(mdPath, 'utf-8');
  if (options.verbose) {
    console.log(`📄 Input: ${mdPath}`);
    console.log(`📏 Size: ${md.length} chars`);
  }

  // Parse markdown
  const parsed = parseMarkdown(md);
  if (parsed.slides.length === 0) {
    throw new Error('ERR_PARSER_EMPTY_INPUT: No slides found in markdown file. Use `---` or `##` to separate slides.');
  }
  if (options.verbose) {
    console.log(`📊 Slides: ${parsed.slides.length}`);
  }

  // Load theme
  const theme = loadTheme(options.theme);
  if (options.verbose) {
    console.log(`🎨 Theme: ${theme.name}`);
  }

  // Dry run
  if (options.dryRun) {
    const stats = dryRun(parsed.slides);
    console.log('\n=== Dry Run ===');
    console.log(`Slides: ${stats.slideCount}`);
    stats.layouts.forEach((layout, i) => {
      console.log(`  ${i + 1}. ${layout} (${stats.blockCounts[i]} blocks)`);
    });
    return;
  }

  // Render
  if (options.verbose) {
    console.log(`🔧 Rendering (${options.ratio}, ${options.density})...`);
  }

  const result = await renderToPptx(parsed.slides, theme, {
    ratio: options.ratio,
    density: options.density,
    title: options.title || 'SlideSmith Presentation',
    author: options.author || 'SlideSmith',
  });

  // Write output
  const outPath = resolve(process.cwd(), options.output);
  const outDir = dirname(outPath);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  await result.pptx.writeFile({ fileName: outPath });
  console.log(`✅ Wrote ${result.slideCount} slides to: ${outPath}`);
}
