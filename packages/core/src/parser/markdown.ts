import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type {
  Root,
  Heading,
  Paragraph,
  List,
  ListItem,
  Code,
  Table,
  Image,
  Blockquote,
  ThematicBreak,
  TableRow,
  TableCell,
} from 'mdast';
import type { Slide, Block, TextBlock, CodeBlock, ImageBlock, QuoteBlock, LayoutType } from '@slidesmith/content-model';
import { extractNoteLine } from './speaker-notes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedSlides {
  slides: Slide[];
}

// ---------------------------------------------------------------------------
// Tree walking helpers
// ---------------------------------------------------------------------------

/** Recursively extract plain text from an MDAST node. */
function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as Record<string, unknown>;
  if (typeof n.value === 'string') return n.value as string;
  if (Array.isArray(n.children)) {
    return (n.children as unknown[]).map(extractText).join('');
  }
  return '';
}

function isThematicBreak(node: unknown): node is ThematicBreak {
  return (node as Record<string, unknown>)?.type === 'thematicBreak';
}

function isHeading(node: unknown, depth?: number): node is Heading {
  const h = node as Heading | undefined;
  if (!h || h.type !== 'heading') return false;
  return depth === undefined || h.depth === depth;
}

/** Check if a node is an image. */
function isImageNode(node: unknown): node is Image {
  return (node as Record<string, unknown>)?.type === 'image';
}

/** Check if a paragraph contains only image nodes. */
function paragraphContainsOnlyImages(node: Paragraph): Image[] {
  if (!node.children) return [];
  const images: Image[] = [];
  const nonWhitespace: unknown[] = node.children.filter((c) => {
    const t = extractText(c).trim();
    return t.length > 0 || isImageNode(c);
  });
  for (const child of nonWhitespace) {
    if (isImageNode(child)) {
      images.push(child);
    } else {
      // Has non-image content, treat as mixed paragraph
      return [];
    }
  }
  return images;
}

// ---------------------------------------------------------------------------
// MDAST → Block converters
// ---------------------------------------------------------------------------

function headingToBlocks(node: Heading): TextBlock[] {
  const content = extractText(node).trim();
  if (!content) return [];
  return [
    {
      type: 'text',
      style: 'heading',
      content,
      level: Math.min(node.depth, 4) as 1 | 2 | 3 | 4,
    },
  ];
}

function paragraphToBlocks(
  node: Paragraph,
  parentListType?: 'unordered' | 'ordered'
): (TextBlock | ImageBlock)[] {
  const text = extractText(node).trim();

  // Check for NOTE: directive
  const note = extractNoteLine(text);
  if (note !== null) {
    return []; // NOTE lines produce no blocks — caller handles speakerNotes
  }

  // Check for image-only paragraphs
  const images = paragraphContainsOnlyImages(node);
  if (images.length > 0) {
    return images.map((img) => ({
      type: 'image' as const,
      src: img.url,
      alt: img.alt || '',
    }));
  }

  if (parentListType) {
    return [{ type: 'text', style: 'list-item', content: text, listType: parentListType }];
  }

  return [{ type: 'text', style: 'body', content: text }];
}

function listToBlocks(node: List): TextBlock[] {
  const items: TextBlock[] = [];
  const listType: 'unordered' | 'ordered' = node.ordered ? 'ordered' : 'unordered';

  for (const item of node.children as ListItem[]) {
    if (!item.children) continue;
    for (const child of item.children) {
      if (child.type === 'paragraph') {
        const blocks = paragraphToBlocks(child as Paragraph, listType);
        items.push(...(blocks as TextBlock[]));
      } else if (child.type === 'list') {
        const nested = listToBlocks(child as List);
        items.push(...nested);
      } else {
        const text = extractText(child).trim();
        if (text) {
          items.push({ type: 'text', style: 'list-item', content: text, listType });
        }
      }
    }
  }

  return items;
}

function codeToBlocks(node: Code): CodeBlock[] {
  return [
    {
      type: 'code',
      language: node.lang || 'text',
      code: node.value,
    },
  ];
}

function tableToBlocks(node: Table): import('@slidesmith/content-model').TableBlock[] {
  const rows = node.children as TableRow[];
  if (rows.length === 0) return [];

  const headerRow = rows[0];
  const headers = (headerRow.children as TableCell[]).map((cell) => extractText(cell).trim());

  const dataRows = rows.slice(1).map((row) =>
    (row.children as TableCell[]).map((cell) => extractText(cell).trim())
  );

  return [
    {
      type: 'table',
      headers,
      rows: dataRows,
    },
  ];
}

function imageToBlocks(node: Image): ImageBlock[] {
  return [
    {
      type: 'image',
      src: node.url,
      alt: node.alt || '',
    },
  ];
}

function blockquoteToBlocks(node: Blockquote): QuoteBlock[] {
  const children = node.children as Array<Paragraph | Heading>;
  let text = '';
  let attribution = '';

  for (const child of children) {
    const content = extractText(child).trim();
    if (!content) continue;

    if (child.type === 'paragraph') {
      if (content.startsWith('—') || content.startsWith('-')) {
        attribution = content.replace(/^[—-]\s*/, '');
      } else {
        text += (text ? '\n' : '') + content;
      }
    } else if (child.type === 'heading') {
      attribution = content;
    }
  }

  if (!text) return [];
  return [{ type: 'quote', text, attribution: attribution || undefined }];
}

// ---------------------------------------------------------------------------
// Node dispatcher
// ---------------------------------------------------------------------------

function convertNode(node: unknown): Block[] {
  const n = node as Record<string, unknown>;
  switch (n.type) {
    case 'heading':
      return headingToBlocks(node as Heading);
    case 'paragraph':
      return paragraphToBlocks(node as Paragraph);
    case 'list':
      return listToBlocks(node as List);
    case 'code':
      return codeToBlocks(node as Code);
    case 'table':
      return tableToBlocks(node as Table);
    case 'image':
      return imageToBlocks(node as Image);
    case 'blockquote':
      return blockquoteToBlocks(node as Blockquote);
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parses a markdown string into an array of Slide objects.
 */
export function parseMarkdown(md: string): ParsedSlides {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md) as Root;

  const topLevel = tree.children;

  // Determine if the deck uses explicit --- separators
  const hasExplicitSeparators = topLevel.some(isThematicBreak);

  // Split top-level children into slide groups
  const slideGroups: Array<unknown[]> = [];
  let currentGroup: unknown[] = [];

  for (const node of topLevel) {
    if (isThematicBreak(node)) {
      slideGroups.push(currentGroup);
      currentGroup = [];
      continue;
    }

    if (!hasExplicitSeparators && isHeading(node, 2) && currentGroup.length > 0) {
      slideGroups.push(currentGroup);
      currentGroup = [node];
      continue;
    }

    currentGroup.push(node);
  }

  // Push the last group if it has content or nothing has been pushed
  if (currentGroup.length > 0) {
    slideGroups.push(currentGroup);
  }

  // Filter out groups that produce no blocks
  const slides: Slide[] = [];

  for (let i = 0; i < slideGroups.length; i++) {
    const group = slideGroups[i];

    // Convert all nodes to blocks, capturing speaker notes
    const blocks: Block[] = [];
    let speakerNotes: string | undefined;

    for (const node of group) {
      const converted = convertNode(node);

      // Handle NOTE lines that were filtered in paragraphToBlocks
      // but still need to set speakerNotes
      if ((node as Record<string, unknown>).type === 'paragraph') {
        const text = extractText(node as Paragraph).trim();
        const note = extractNoteLine(text);
        if (note !== null) {
          speakerNotes = speakerNotes ? speakerNotes + '\n' + note : note;
          continue; // don't add any block for NOTE paragraphs
        }
      }

      // Also handle NOTE in the converted blocks (re-check body paragraphs)
      for (const block of converted) {
        if (block.type === 'text' && block.style === 'body') {
          const note = extractNoteLine(block.content);
          if (note !== null) {
            speakerNotes = speakerNotes ? speakerNotes + '\n' + note : note;
            continue;
          }
        }
        blocks.push(block);
      }
    }

    // Skip empty slides (all whitespace, only thematic breaks, etc.)
    if (blocks.length === 0 && !speakerNotes) continue;

    // Determine layout
    let layout: LayoutType = 'hero-top';

    if (i === 0 && blocks.length > 0 && blocks[0].type === 'text' && blocks[0].style === 'heading' && blocks[0].level === 1) {
      layout = 'cover';
    } else if (i > 0 && blocks.length === 1 && blocks[0].type === 'text' && blocks[0].style === 'heading' && blocks[0].level === 1) {
      layout = 'section-divider';
    } else if (blocks.length === 1 && blocks[0].type === 'quote') {
      layout = 'quote';
    }

    slides.push({
      layout,
      blocks,
      ...(speakerNotes ? { speakerNotes } : {}),
    });
  }

  return { slides };
}
