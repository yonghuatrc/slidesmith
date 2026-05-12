import type { Block, LayoutType } from '@slidesmith/content-model';

/** A named rectangular zone within a slide layout. */
export interface Zone {
  name: string;
  x: number; // fraction 0-1 (left edge)
  y: number; // fraction 0-1 (top edge)
  w: number; // fraction 0-1 (width)
  h: number; // fraction 0-1 (height)
}

/** The kind of content a zone accepts. */
export type ZoneAffinity = 'header' | 'body' | 'media' | 'quote' | 'attribution' | 'sections' | 'col1' | 'col2' | 'col3' | 'left' | 'right' | 'footer';

/** Describes a single layout variant. */
export interface LayoutDefinition {
  /** Layout type identifier matching ContentModel. */
  layout: LayoutType;
  /** Human-readable label. */
  label: string;
  /** Ordered zones from top-left to bottom-right. */
  zones: Zone[];
  /** Mapping from zone names to their content affinities. */
  affinities: Record<string, ZoneAffinity>;
  /** If true, background fills the entire slide. */
  fullBleed?: boolean;
}

/** Result of distributing blocks into zones. */
export interface ZoneAssignment {
  zone: Zone;
  affinity: ZoneAffinity;
  blocks: Block[];
}
