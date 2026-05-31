import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { extractThemeProfile, renderToPptx } from '@slidesmith/renderer';
import type { ThemeProfile } from '@slidesmith/renderer';
import { loadTheme } from '@slidesmith/themes';
import type { Theme } from '@slidesmith/themes';
import { parseMarkdown } from '../parser/markdown';

export interface ExpandOptions {
  content?: string;
  output?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

/**
 * Build a temporary Theme from an extracted ThemeProfile, merging
 * with defaults from a base built-in theme.
 */
function profileToTheme(profile: ThemeProfile, baseThemeName?: string): Theme {
  const base = loadTheme(baseThemeName || 'minimal-clean');

  return {
    ...base,
    name: profile.name,
    description: `Auto-extracted from "${profile.name}"`,
    colors: {
      ...base.colors,
      background: profile.colors.background || base.colors.background,
      surface: profile.colors.surface || base.colors.surface,
      text: profile.colors.text || base.colors.text,
      textMuted: profile.colors.textMuted || base.colors.textMuted,
      accent: profile.colors.accent || base.colors.accent,
      accent2: profile.colors.accent2 || base.colors.accent2,
      border: profile.colors.border || base.colors.border,
      error: profile.colors.error || base.colors.error,
    },
    fonts: {
      heading: {
        ...base.fonts.heading,
        family: profile.fonts.heading.family || base.fonts.heading.family,
        weight: profile.fonts.heading.weight || base.fonts.heading.weight,
      },
      body: {
        ...base.fonts.body,
        family: profile.fonts.body.family || base.fonts.body.family,
        weight: profile.fonts.body.weight || base.fonts.body.weight,
        size: profile.fonts.body.size || base.fonts.body.size,
      },
      mono: {
        ...base.fonts.mono,
        family: profile.fonts.mono.family || base.fonts.mono.family,
      },
    },
  };
}

/**
 * Execute the expand command.
 *
 * 1. Extract theme from template.pptx
 * 2. Parse content.md into ContentModel
 * 3. Build a temporary Theme from the extracted profile
 * 4. Render ContentModel with extracted Theme
 * 5. Write output.pptx
 */
export async function executeExpand(
  template: string,
  options: ExpandOptions
): Promise<void> {
  const verbose = options.verbose || false;

  // Resolve paths
  const tmplPath = resolve(process.cwd(), template);
  if (!existsSync(tmplPath)) {
    throw new Error(`ERR_FILE_NOT_FOUND: Template file not found: ${tmplPath}`);
  }

  // Step 1: Extract theme from template
  if (verbose) console.log(`🔍 Extracting theme from: ${tmplPath}`);
  const profile = await extractThemeProfile(tmplPath);

  if (verbose) {
    console.log(`\n📋 Extracted Theme Profile:`);
    console.log(`   Name: ${profile.name}`);
    console.log(`   Confidence: ${(profile.confidence * 100).toFixed(0)}%`);
    console.log(`   Colors:`);
    for (const [key, val] of Object.entries(profile.colors)) {
      console.log(`     ${key}: ${val}`);
    }
    console.log(`   Fonts:`);
    console.log(`     heading: ${profile.fonts.heading.family}`);
    console.log(`     body: ${profile.fonts.body.family}`);
    console.log(`     mono: ${profile.fonts.mono.family}`);
    if (profile.layouts.length > 0) {
      console.log(`   Layouts:`);
      for (const layout of profile.layouts) {
        console.log(`     ${layout.name} (${layout.zones.length} zones)`);
        for (const zone of layout.zones) {
          console.log(`       ${zone.name} [${zone.type || 'unknown'}] @ (${(zone.x * 100).toFixed(0)}%, ${(zone.y * 100).toFixed(0)}%) ${(zone.w * 100).toFixed(0)}% x ${(zone.h * 100).toFixed(0)}%`);
        }
      }
    }
  }

  // Dry run: just show the profile
  if (options.dryRun) {
    console.log(`\n✅ Dry-run complete. Confidence: ${(profile.confidence * 100).toFixed(0)}%`);
    return;
  }

  // Step 2: Parse content (if provided)
  if (!options.content) {
    console.log(`\n⚠️  No content file provided. Use -c <markdown-file> to render slides.`);
    console.log(`   Extracted profile can be inspected from the output above.`);
    return;
  }

  const mdPath = resolve(process.cwd(), options.content);
  if (!existsSync(mdPath)) {
    throw new Error(`ERR_FILE_NOT_FOUND: Content file not found: ${mdPath}`);
  }

  const md = readFileSync(mdPath, 'utf-8');
  if (verbose) console.log(`\n📄 Parsing content: ${mdPath}`);

  const parsed = parseMarkdown(md);
  if (parsed.slides.length === 0) {
    throw new Error('ERR_PARSER_EMPTY_INPUT: No slides found in markdown file.');
  }

  if (verbose) {
    console.log(`   Slides: ${parsed.slides.length}`);
  }

  // Step 3: Build theme from profile (merge with 'minimal-clean' as base layout scaffold)
  const theme = profileToTheme(profile);
  if (verbose) {
    console.log(`🎨 Built theme: ${theme.name}`);
  }

  // Step 4 & 5: Render and write
  const result = await renderToPptx(parsed.slides, theme, {
    ratio: '16:9',
    density: 'comfortable',
    title: profile.name,
    author: 'SlideSmith (Magic Wand)',
  });

  // Write output
  const outPath = options.output
    ? resolve(process.cwd(), options.output)
    : resolve(process.cwd(), `${profile.name}.pptx`);
  const outDir = dirname(outPath);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  await result.pptx.writeFile({ fileName: outPath });
  console.log(`✅ Wrote ${result.slideCount} slides to: ${outPath}`);
  console.log(`   Using theme extracted from: ${template}`);
}
