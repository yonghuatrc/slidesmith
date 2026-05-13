import type { CodeBlock } from '@slidesmith/content-model';
import type { Theme } from '@slidesmith/themes';
import type { Zone } from '../layouts/types';
import { zoneToInches } from '../utils/pptx';

/** Languages to bundle for shiki highlighting. */
const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'rust', 'go', 'java', 'cpp', 'ruby',
  'sql', 'yaml', 'json', 'html', 'css', 'bash', 'diff', 'graphql', 'markdown',
  'dockerfile', 'toml',
];

let highlighter: any = null;

async function getHighlighter(): Promise<any> {
  if (!highlighter) {
    try {
      const shiki = await import('shiki');
      highlighter = await shiki.createHighlighter({
        langs: SUPPORTED_LANGUAGES,
        themes: ['github-dark', 'github-light'],
      });
    } catch {
      // shiki not available — return null
      return null;
    }
  }
  return highlighter;
}

/**
 * Render a CodeBlock onto a pptxgenjs slide.
 * Uses shiki for syntax highlighting when available.
 * @param fontScale Optional scale factor for font sizes.
 */
export async function renderCodeBlock(
  block: CodeBlock,
  zone: Zone,
  slide: any,
  theme: Theme,
  density: 'compact' | 'comfortable' | 'breathing',
  slideWidth: number,
  slideHeight: number,
  fontScale: number = 1.0
): Promise<void> {
  const { x, y, w, h } = zoneToInches(zone, slideWidth, slideHeight);
  const fontSize = Math.max(6, Math.round(10 * fontScale));
  const lineHeight = fontSize * 1.5;
  const maxLines = Math.floor((h * 72) / lineHeight);
  const codeLines = block.code.split('\n').slice(0, maxLines);

  // Background box
  slide.addShape('rect', {
    x: x - 0.05,
    y: y - 0.05,
    w: w + 0.1,
    h: Math.min(h, (codeLines.length * lineHeight + 10) / 72),
    fill: { color: darkenColor(theme.colors.surface, 0.1) },
    rectRadius: 0.05,
  });

  let lineY = y;

  // Try syntax highlighting
  const hl = await getHighlighter();

  if (hl) {
    const lang = SUPPORTED_LANGUAGES.includes(block.language) ? block.language : 'text';
    const result = hl.codeToTokens(block.code, {
      lang,
      theme: 'github-dark',
    });

    for (const line of result.tokens) {
      if (!line || line.length === 0) {
        lineY += lineHeight / 72;
        continue;
      }

      const runs = line.map((token: any) => ({
        text: token.content,
        options: {
          fontSize,
          fontFace: theme.fonts.mono.family,
          color: token.color || theme.colors.textMuted,
        },
      }));

      slide.addText(runs, {
        x,
        y: lineY,
        w,
        h: lineHeight / 72,
        valign: 'top',
        align: 'left',
      });

      lineY += lineHeight / 72;
    }
  } else {
    // Plain rendering without highlighting
    const code = codeLines.join('\n');
    slide.addText(code, {
      x,
      y: lineY,
      w,
      h,
      fontSize,
      fontFace: theme.fonts.mono.family,
      color: theme.colors.textMuted,
      valign: 'top',
      align: 'left',
      autoFit: true,
    });
  }
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
