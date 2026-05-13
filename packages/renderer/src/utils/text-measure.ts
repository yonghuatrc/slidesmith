/**
 * Text measurement utility.
 *
 * Uses node-canvas if available. Falls back to character-count heuristic
 * for environments where canvas native bindings are unavailable (e.g., WSL).
 */

const LINE_HEIGHT_MULTIPLIER = 1.4;

let canvasModule: ReturnType<typeof require> | null = null;

try {
  canvasModule = require('canvas');
} catch {
  // canvas not available — use fallback
}

/**
 * Measure the height of text given font specs and max width.
 * Returns estimated height in inches.
 */
export function measureTextHeight(
  text: string,
  fontFamily: string,
  fontSize: number,
  maxWidth: number
): number {
  if (canvasModule) {
    try {
      const ctx = canvasModule.createCanvas(1, 1).getContext('2d');
      ctx.font = `${fontSize}pt "${fontFamily}"`;
      const metrics = ctx.measureText(text);
      const lineHeight = fontSize * LINE_HEIGHT_MULTIPLIER;
      if (metrics.width <= maxWidth * 72) {
        return lineHeight / 72; // single line
      }
      // Estimate wrapped lines
      const charWidth = metrics.width / text.length;
      const charsPerLine = Math.floor((maxWidth * 72) / charWidth);
      const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
      return (lines * lineHeight) / 72;
    } catch {
      // fallback on error
    }
  }

  // Fallback: character-count heuristic
  const charWidth = fontSize * 0.5; // rough: each char is ~0.5pt wide
  const charsPerLine = Math.max(1, Math.floor((maxWidth * 72) / charWidth));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  const lineHeight = fontSize * LINE_HEIGHT_MULTIPLIER;
  return (lines * lineHeight) / 72;
}

/**
 * Estimate the number of lines for wrapped text.
 */
export function estimateLines(text: string, fontSize: number, maxWidth: number): number {
  const charWidth = fontSize * 0.5;
  const charsPerLine = Math.max(1, Math.floor((maxWidth * 72) / charWidth));
  return Math.max(1, Math.ceil(text.length / charsPerLine));
}
