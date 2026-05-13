#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig } from '../config';
import { executeBuild } from './build.command';
import { executeListThemes } from './list-themes.command';
import { executePreview } from './preview.command';

const program = new Command();

program
  .name('slidesmith')
  .description('Generate presentations from markdown')
  .version('0.1.0');

program
  .command('build')
  .description('Build a PPTX presentation from a markdown file')
  .argument('<file>', 'Path to markdown file')
  .option('-t, --theme <name>', 'Theme name')
  .option('-o, --output <path>', 'Output path')
  .option('--ratio <16:9|4:3>', 'Aspect ratio')
  .option('--density <mode>', 'Content density (compact|comfortable|breathing)')
  .option('--config <path>', 'Path to config file')
  .option('--dry-run', 'Show outline without rendering')
  .option('--verbose', 'Debug output')
  .option('--title <text>', 'Presentation title')
  .option('--author <text>', 'Author name')
  .action(async (file: string, opts: Record<string, unknown>) => {
    try {
      const fileConfig = await loadConfig(opts.config as string | undefined);
      const mergedOpts = {
        theme: opts.theme as string ?? fileConfig.theme,
        output: opts.output as string ?? fileConfig.output,
        ratio: (opts.ratio as string ?? fileConfig.ratio) as '16:9' | '4:3',
        density: (opts.density as string ?? fileConfig.density) as 'compact' | 'comfortable' | 'breathing',
        embedFonts: (opts.embedFonts as boolean | undefined) ?? fileConfig.embedFonts,
        dryRun: opts.dryRun as boolean | undefined ?? false,
        verbose: opts.verbose as boolean | undefined ?? false,
        title: opts.title as string | undefined,
        author: opts.author as string | undefined,
      };

      await executeBuild(file, mergedOpts);
    } catch (err) {
      console.error(`❌ ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list-themes')
  .description('List available themes')
  .action(() => {
    executeListThemes();
  });

program
  .command('preview')
  .description('Start a preview server for a markdown file')
  .argument('<file>', 'Path to markdown file')
  .option('-p, --port <number>', 'Port number', '3000')
  .action(async (file: string, opts: Record<string, unknown>) => {
    await executePreview(file, { port: parseInt(opts.port as string, 10) });
  });

program.parse(process.argv);
