import type { LayoutDefinition } from './types';

export const comparisonLayout: LayoutDefinition = {
  layout: 'comparison',
  label: 'Comparison (Side-by-Side)',
  zones: [
    { name: 'header', x: 0.08, y: 0.05, w: 0.84, h: 0.12 },
    { name: 'left', x: 0.05, y: 0.2, w: 0.42, h: 0.75 },
    { name: 'right', x: 0.53, y: 0.2, w: 0.42, h: 0.75 },
  ],
  affinities: {
    header: 'header',
    left: 'left',
    right: 'right',
  },
};
