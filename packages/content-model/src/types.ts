export type LayoutType =
  | 'cover'
  | 'hero-top'
  | 'three-column'
  | 'symmetric'
  | 'waterfall'
  | 'comparison'
  | 'quote'
  | 'section-divider';

export interface SlideBackground {
  type: 'color' | 'image';
  value: string;
  opacity?: number;
}

export interface Slide {
  layout: LayoutType;
  blocks: Block[];
  speakerNotes?: string;
  subtitle?: string;
  footer?: string;
  background?: SlideBackground;
}

export type Block = TextBlock | TableBlock | CodeBlock | ImageBlock | QuoteBlock | TwoColumnBlock;

export interface TextBlock {
  type: 'text';
  style: 'heading' | 'body' | 'list-item';
  content: string;
  level?: 1 | 2 | 3 | 4;
  listType?: 'unordered' | 'ordered';
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface CodeBlock {
  type: 'code';
  language: string;
  code: string;
  caption?: string;
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

export interface QuoteBlock {
  type: 'quote';
  text: string;
  attribution?: string;
}

export interface TwoColumnBlock {
  type: 'two-column';
  leftHeader: string;
  leftItems: string[];
  rightHeader: string;
  rightItems: string[];
}
