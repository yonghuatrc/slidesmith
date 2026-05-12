import type { Block } from '@slidesmith/content-model';
import type { LayoutDefinition, ZoneAssignment, ZoneAffinity } from './types';

/** Affinities that match specific block types. */
const SPECIFIC_AFFINITIES = new Set<ZoneAffinity>(['header', 'media', 'quote', 'attribution', 'footer']);

/**
 * Given a layout definition and a list of blocks,
 * distribute blocks into zones based on zone affinity rules.
 *
 * Algorithm:
 * 1. Specific affinities (header, media, quote, attribution, footer)
 *    are matched first by block type.
 * 2. Generic affinities (body, col1..col3, left, right, sections)
 *    receive remaining blocks by round-robin order.
 */
export function distributeBlocks(
  layout: LayoutDefinition,
  blocks: Block[]
): ZoneAssignment[] {
  // Initialize empty assignments for each zone
  const assignments: Map<string, ZoneAssignment> = new Map();
  for (const zone of layout.zones) {
    assignments.set(zone.name, {
      zone,
      affinity: layout.affinities[zone.name] || 'body',
      blocks: [],
    });
  }

  const remaining: Block[] = [...blocks];

  // Phase 1: assign by specific type affinity
  const unmatched: Block[] = [];

  for (const block of remaining) {
    let assigned = false;

    for (const zone of layout.zones) {
      const affinity = layout.affinities[zone.name] || 'body';
      if (!SPECIFIC_AFFINITIES.has(affinity)) continue;
      if (matchesAffinity(block, affinity)) {
        assignments.get(zone.name)!.blocks.push(block);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      unmatched.push(block);
    }
  }

  // Phase 2: assign remaining blocks to generic zones (body, col*, left, right, sections)
  const genericZones = layout.zones.filter((z) => !SPECIFIC_AFFINITIES.has(layout.affinities[z.name] || 'body'));

  if (genericZones.length === 0) {
    // Fallback: put everything in the first zone
    if (layout.zones.length > 0) {
      assignments.get(layout.zones[0].name)!.blocks.push(...unmatched);
    }
    return Array.from(assignments.values());
  }

  // Round-robin through generic zones
  let zoneIndex = 0;
  for (const block of unmatched) {
    const zone = genericZones[zoneIndex % genericZones.length];
    assignments.get(zone.name)!.blocks.push(block);
    zoneIndex++;
  }

  return Array.from(assignments.values());
}

function matchesAffinity(block: Block, affinity: ZoneAffinity): boolean {
  switch (affinity) {
    case 'header':
      return block.type === 'text' && block.style === 'heading';
    case 'body':
      return true;
    case 'media':
      return block.type === 'image' || block.type === 'two-column';
    case 'quote':
      return block.type === 'quote';
    case 'attribution':
      return block.type === 'text' && block.style === 'body';
    case 'footer':
      return block.type === 'text' && block.style === 'body';
    default:
      return true;
  }
}
