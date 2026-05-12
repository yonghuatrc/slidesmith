import type { LayoutDefinition } from './types';

export const coverLayout: LayoutDefinition = {
  layout: 'cover',
  label: 'Cover Slide',
  fullBleed: true,
  zones: [
    { name: 'header', x: 0.1, y: 0.3, w: 0.8, h: 0.15 },
    { name: 'body', x: 0.15, y: 0.5, w: 0.7, h: 0.3 },
    { name: 'footer', x: 0.1, y: 0.85, w: 0.8, h: 0.1 },
  ],
  affinities: {
    header: 'header',
    body: 'body',
    footer: 'footer',
  },
};
