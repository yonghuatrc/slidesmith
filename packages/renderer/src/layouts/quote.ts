import type { LayoutDefinition } from './types';

export const quoteLayout: LayoutDefinition = {
  layout: 'quote',
  label: 'Pull Quote',
  zones: [
    { name: 'quote', x: 0.1, y: 0.15, w: 0.8, h: 0.5 },
    { name: 'attribution', x: 0.1, y: 0.65, w: 0.8, h: 0.2 },
  ],
  affinities: {
    quote: 'quote',
    attribution: 'attribution',
  },
};
