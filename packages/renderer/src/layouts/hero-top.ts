import type { LayoutDefinition } from './types';

export const heroTopLayout: LayoutDefinition = {
  layout: 'hero-top',
  label: 'Hero Top',
  zones: [
    { name: 'header', x: 0.08, y: 0.05, w: 0.84, h: 0.15 },
    { name: 'body', x: 0.08, y: 0.22, w: 0.84, h: 0.73 },
  ],
  affinities: {
    header: 'header',
    body: 'body',
  },
};
