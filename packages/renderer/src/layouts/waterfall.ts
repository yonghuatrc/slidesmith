import type { LayoutDefinition } from './types';

export const waterfallLayout: LayoutDefinition = {
  layout: 'waterfall',
  label: 'Waterfall (Vertical Sections)',
  zones: [
    { name: 'header', x: 0.08, y: 0.05, w: 0.84, h: 0.1 },
    { name: 'sections', x: 0.08, y: 0.18, w: 0.84, h: 0.77 },
  ],
  affinities: {
    header: 'header',
    sections: 'sections',
  },
};
