import type { LayoutDefinition } from './types';

export const sectionDividerLayout: LayoutDefinition = {
  layout: 'section-divider',
  label: 'Section Divider',
  fullBleed: true,
  zones: [
    { name: 'header', x: 0.1, y: 0.4, w: 0.8, h: 0.2 },
  ],
  affinities: {
    header: 'header',
  },
};
