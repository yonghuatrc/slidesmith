export { renderToPptx, dryRun } from './engine/renderer';
export type { RenderOptions, RenderResult, DryRunResult } from './engine/renderer';
export { getLayout, getAllLayouts } from './layouts/registry';
export { distributeBlocks } from './layouts/distributor';
export type { LayoutDefinition, Zone, ZoneAssignment, ZoneAffinity } from './layouts/types';
