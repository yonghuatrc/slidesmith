import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { Slide } from '@slidesmith/content-model';
import { validate } from '@slidesmith/content-model';
import { loadTheme } from '@slidesmith/themes';
import { renderToPptx } from '@slidesmith/renderer';
import { loadConfig } from '../config';

export interface GenerateOptions {
  provider?: string;
  model?: string;
  theme?: string;
  output?: string;
  dryRun?: boolean;
  verbose?: boolean;
  slideCount?: number;
}

const LAYOUT_TYPES = ['cover', 'hero-top', 'three-column', 'symmetric', 'waterfall', 'comparison', 'quote', 'section-divider'] as const;

type LayoutType = (typeof LAYOUT_TYPES)[number];

/**
 * Execute the generate command.
 */
export async function executeGenerate(
  prompt: string,
  options: Record<string, unknown>
): Promise<void> {
  const verbose = options.verbose as boolean | undefined ?? false;
  const dryRun = options.dryRun as boolean | undefined ?? false;

  // Load config for defaults
  const fileConfig = await loadConfig();
  const providerName = (options.provider as string) || (fileConfig.provider?.provider) || 'openai';
  const modelName = (options.model as string) || (fileConfig.provider && 'model' in fileConfig.provider ? (fileConfig.provider as Record<string, unknown>).model as string : undefined);
  const themeName = (options.theme as string) || fileConfig.theme;
  const outputPath = (options.output as string) || fileConfig.output;
  const slideCount = options.slideCount ? parseInt(options.slideCount as string, 10) : undefined;

  if (verbose) {
    console.error(`  🔧 Provider: ${providerName}`);
    console.error(`  🎨 Theme:    ${themeName}`);
    console.error(`  📄 Output:   ${outputPath}`);
    if (modelName) console.error(`  🤖 Model:    ${modelName}`);
  }

  // Suggested layouts based on prompt analysis
  const suggestedLayouts = suggestLayouts(prompt);
  if (verbose || dryRun) {
    console.error(`  📐 Suggested layouts: ${suggestedLayouts.join(', ')}`);
  }

  // Dry-run: estimate without calling AI
  if (dryRun) {
    const estimatedTokens = estimateTokens(prompt);
    const estimatedSlides = estimateSlides(prompt);

    console.log('');
    console.log('=== Dry Run ===');
    console.log(`  Prompt:     "${prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt}"`);
    console.log(`  Provider:   ${providerName}${modelName ? ` (${modelName})` : ''}`);
    console.log(`  Theme:      ${themeName}`);
    console.log(`  Est. tokens: ${estimatedTokens.toLocaleString()}`);
    console.log(`  Est. slides: ${estimatedSlides.length}`);
    console.log(`  Suggested layouts: ${suggestedLayouts.join(', ')}`);
    console.log(`  Estimated outline:`);

    for (let i = 0; i < estimatedSlides.length; i++) {
      const s = estimatedSlides[i];
      const layoutStr = s.layout.padEnd(18);
      const firstBlock = s.blocks[0];
      const title = firstBlock && firstBlock.type === 'text' ? firstBlock.content : '(slide)';
      console.log(`    ${i + 1}. [${layoutStr}] ${title}`);
    }
    return;
  }

  // Import AI provider dynamically (optional dependency)
  let createProvider: (config: any) => { generateSlides(prompt: string, options?: any): Promise<Slide[]> };
  try {
    const aiModule = await import('@slidesmith/ai');
    createProvider = aiModule.createProvider;
  } catch {
    throw new Error(
      'ERR_AI_NOT_AVAILABLE: AI module is not available. Run `pnpm install` from the SlideSmith root.'
    );
  }

  // Create provider config
  let providerConfig: Record<string, unknown>;
  if (providerName === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY || (fileConfig.provider && 'apiKey' in fileConfig.provider ? (fileConfig.provider as Record<string, unknown>).apiKey as string : '');
    providerConfig = {
      provider: 'openai',
      apiKey,
      model: modelName || 'gpt-4o',
    };
  } else if (providerName === 'ollama') {
    const baseUrl = (fileConfig.provider && 'baseUrl' in fileConfig.provider ? (fileConfig.provider as Record<string, unknown>).baseUrl as string : undefined) || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    providerConfig = {
      provider: 'ollama',
      baseUrl,
      model: modelName || 'llama3.1',
    };
  } else {
    throw new Error(`ERR_AI_UNKNOWN_PROVIDER: Unknown provider "${providerName}". Use "openai" or "ollama".`);
  }

  // Create provider
  const provider = createProvider(providerConfig);
  console.error('  🤖 Generating slides...');

  const slides = await provider.generateSlides(prompt, { slideCount });
  console.error(`  ✅ Generated ${slides.length} slides`);

  // Validate
  const validationResult = validate({ slides });
  if (!validationResult.success) {
    throw new Error(`ERR_AI_VALIDATION: Generated slides failed validation: ${validationResult.errors.message}`);
  }
  const validatedSlides = validationResult.data;

  if (verbose) {
    console.error(`  ✅ Validation passed`);
    for (let i = 0; i < validatedSlides.length; i++) {
      const s = validatedSlides[i];
      const headingCount = s.blocks.filter((b: any) => b.type === 'text' && b.style === 'heading').length;
      console.error(`     Slide ${i + 1}: ${s.layout} (${s.blocks.length} blocks, ${headingCount} headings)`);
    }
  }

  // Load theme
  const theme = loadTheme(themeName);

  // Render
  console.error('  🔧 Rendering...');
  const resolvedOutput = options.output as string || fileConfig.output;

  const result = await renderToPptx(validatedSlides, theme, {
    ratio: '16:9',
    density: 'comfortable',
    title: prompt.slice(0, 100),
    author: 'SlideSmith',
  });

  // Write output
  const outPath = resolve(process.cwd(), resolvedOutput);
  const outDir = dirname(outPath);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  await result.pptx.writeFile({ fileName: outPath });
  console.error(`  ✅ Wrote ${result.slideCount} slides to: ${outPath}`);
  console.log(outPath);
}

/**
 * Estimate token count from prompt (rough: chars / 4).
 */
function estimateTokens(input: string): number {
  return Math.ceil(input.length / 4);
}

/**
 * Estimate slide structure from prompt using basic NLP heuristics.
 */
function estimateSlides(prompt: string): Slide[] {
  const sentences = prompt.split(/[.?!\n]+/).filter((s) => s.trim().length > 0);
  const estimated: Slide[] = [];

  // First slide is always cover
  estimated.push({
    layout: 'cover',
    blocks: [{ type: 'text', style: 'heading', content: prompt.split('\n')[0].trim(), level: 1 }],
  });

  if (sentences.length <= 2) {
    // Very short prompt — just add a single content slide
    estimated.push({
      layout: 'symmetric',
      blocks: [{ type: 'text', style: 'body', content: prompt.trim() }],
    });
    return estimated;
  }

  // Create section slides from sentence groups
  const sectionSize = Math.max(2, Math.ceil(sentences.length / 4));
  const layoutCycle: LayoutType[] = ['hero-top', 'symmetric', 'three-column', 'waterfall'];

  for (let i = 0; i < sentences.length; i += sectionSize) {
    const group = sentences.slice(i, i + sectionSize);
    const firstSentence = group[0].trim();

    if (estimated.length === 0) {
      estimated.push({
        layout: 'cover',
        blocks: [{ type: 'text', style: 'heading', content: firstSentence, level: 1 }],
      });
    } else {
      const layoutIdx = Math.min(estimated.length - 1, layoutCycle.length - 1);
      estimated.push({
        layout: layoutCycle[layoutIdx],
        blocks: [
          { type: 'text', style: 'heading', content: firstSentence, level: 2 },
          ...group.slice(1).map((s) => ({
            type: 'text' as const,
            style: 'list-item' as const,
            content: s.trim(),
            listType: 'unordered' as const,
          })),
        ],
      });
    }
  }

  return estimated;
}

/**
 * Suggest layouts based on prompt content analysis.
 */
function suggestLayouts(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const suggested: LayoutType[] = ['cover']; // Always suggest cover

  const keywordMaps: Array<{ keywords: string[]; layout: LayoutType }> = [
    { keywords: ['compar', 'vs ', 'versus', 'alternative', 'pros and cons'], layout: 'comparison' },
    { keywords: ['three', 'column', 'feature', 'pillar', 'approach'], layout: 'three-column' },
    { keywords: ['two', 'pair', 'side by side', 'symmetr'], layout: 'symmetric' },
    { keywords: ['step', 'process', 'flow', 'pipeline', 'timeline', 'progress'], layout: 'waterfall' },
    { keywords: ['quote', 'testimonial', 'saying', 'remark'], layout: 'quote' },
    { keywords: ['section', 'part', 'chapter', 'phase'], layout: 'section-divider' },
    { keywords: ['hero', 'big', 'main', 'overview', 'introduction', 'welcome'], layout: 'hero-top' },
  ];

  for (const { keywords, layout } of keywordMaps) {
    if (keywords.some((k) => lower.includes(k)) && !suggested.includes(layout)) {
      suggested.push(layout);
    }
  }

  // Always include the full set in the suggestion
  return [...new Set(suggested)];
}
