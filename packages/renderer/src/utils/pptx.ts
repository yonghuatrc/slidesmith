import type { Zone } from '../layouts/types';

export const SLIDE_WIDTH_16_9 = 13.333; // inches
export const SLIDE_HEIGHT = 7.5; // inches
export const SLIDE_WIDTH_4_3 = 10; // inches

/**
 * Convert a zone (fractions of slide) to inches for pptxgenjs.
 */
export function zoneToInches(
  zone: Zone,
  slideWidth: number,
  slideHeight: number
): { x: number; y: number; w: number; h: number } {
  return {
    x: zone.x * slideWidth,
    y: zone.y * slideHeight,
    w: zone.w * slideWidth,
    h: zone.h * slideHeight,
  };
}

/**
 * Get slide width for a given aspect ratio.
 */
export function getSlideWidth(ratio: '16:9' | '4:3'): number {
  return ratio === '16:9' ? SLIDE_WIDTH_16_9 : SLIDE_WIDTH_4_3;
}
