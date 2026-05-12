import type { LayoutDefinition } from './types';

export const symmetricLayout: LayoutDefinition = {
  layout: 'symmetric',
  label: 'Symmetric (Text + Media)',
  zones: [
    { name: 'header', x: 0.08, y: 0.05, w: 0.84, h: 0.1 },
    { name: 'body', x: 0.05, y: 0.18, w: 0.42, h: 0.77 },
    { name: 'media', x: 0.52, y: 0.18, w: 0.43, h: 0.77 },
  ],
  affinities: {
    header: 'header',
    body: 'body',
    media: 'media',
  },
};
