#!/usr/bin/env node

import { Command } from 'commander';
import { executeBuild } from './build.command';

const program = new Command();

program
  .name('slidesmith')
  .description('Generate presentations from markdown')
  .version('0.1.0');

program
  .command('build')
  .description('Build a PPTX presentation from a markdown file')
  .argument('<file>', 'Path to markdown file')
  .option('-t, --theme <name>', 'Theme name', 'dark-tech')
  .option('-o, --output <path>', 'Output path', 'output/deck.pptx')
  .option('--ratio <16:9|4:3>', 'Aspect ratio', '16:9')
  .option('--density <mode>', 'Content density (compact|comfortable|breathing)', 'comfortable')
  .option('--dry-run', 'Show outline without rendering', false)
  .option('--verbose', 'Debug output', false)
  .option('--title <text>', 'Presentation title')
  .option('--author <text>', 'Author name')
  .action(async (file: string, opts: Record<string, unknown>) => {
    try {
      await executeBuild(file, {
        theme: opts.theme,
        output: opts.output,
        ratio: opts.ratio as '16:9' | '4:3',
        density: opts.density as 'compact' | 'comfortable' | 'breathing',
        dryRun: opts.dryRun,
        verbose: opts.verbose,
        title: opts.title,
        author: opts.author,
      });
    } catch (err) {
      console.error(`❌ ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
