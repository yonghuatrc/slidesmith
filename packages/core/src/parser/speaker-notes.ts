const NOTE_RE = /^NOTE:\s*(.*)$/i;

/**
 * Tests whether a text line is a NOTE: directive.
 * If so, returns the note text. Otherwise returns null.
 */
export function extractNoteLine(text: string): string | null {
  const match = text.trim().match(NOTE_RE);
  return match ? match[1].trim() : null;
}

/**
 * Removes NOTE: lines from an array of text lines,
 * returning { cleanedLines, notes }.
 */
export function extractNotesFromLines(lines: string[]): {
  cleanedLines: string[];
  notes: string[];
} {
  const cleanedLines: string[] = [];
  const notes: string[] = [];

  for (const line of lines) {
    const note = extractNoteLine(line);
    if (note !== null) {
      notes.push(note);
    } else {
      cleanedLines.push(line);
    }
  }

  return { cleanedLines, notes };
}
