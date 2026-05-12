import type { LayoutType } from '@slidesmith/content-model';
import type { LayoutDefinition } from './types';
import { coverLayout } from './cover';
import { heroTopLayout } from './hero-top';
import { threeColumnLayout } from './three-column';
import { symmetricLayout } from './symmetric';
import { waterfallLayout } from './waterfall';
import { comparisonLayout } from './comparison';
import { quoteLayout } from './quote';
import { sectionDividerLayout } from './section-divider';

const layoutMap: Record<string, LayoutDefinition> = {
  cover: coverLayout,
  'hero-top': heroTopLayout,
  'three-column': threeColumnLayout,
  symmetric: symmetricLayout,
  waterfall: waterfallLayout,
  comparison: comparisonLayout,
  quote: quoteLayout,
  'section-divider': sectionDividerLayout,
};

/**
 * Returns the layout definition for a given layout type.
 * Throws if the layout is not registered.
 */
export function getLayout(type: LayoutType): LayoutDefinition {
  const layout = layoutMap[type];
  if (!layout) {
    throw new Error(`ERR_LAYOUT_NOT_FOUND: Layout "${type}" not found. Available: ${Object.keys(layoutMap).join(', ')}`);
  }
  return layout;
}

/** Returns all registered layout definitions. */
export function getAllLayouts(): LayoutDefinition[] {
  return Object.values(layoutMap);
}
