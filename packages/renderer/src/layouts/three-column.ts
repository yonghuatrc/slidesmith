import type { LayoutDefinition } from './types';

export const threeColumnLayout: LayoutDefinition = {
  layout: 'three-column',
  label: 'Three Column',
  zones: [
    { name: 'header', x: 0.08, y: 0.05, w: 0.84, h: 0.12 },
    { name: 'col1', x: 0.05, y: 0.2, w: 0.28, h: 0.75 },
    { name: 'col2', x: 0.36, y: 0.2, w: 0.28, h: 0.75 },
    { name: 'col3', x: 0.67, y: 0.2, w: 0.28, h: 0.75 },
  ],
  affinities: {
    header: 'header',
    col1: 'col1',
    col2: 'col2',
    col3: 'col3',
  },
};
