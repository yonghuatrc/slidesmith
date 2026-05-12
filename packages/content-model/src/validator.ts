import { z } from 'zod';
import type { Slide, Block } from './types';

const layoutTypeSchema = z.enum([
  'cover', 'hero-top', 'three-column', 'symmetric',
  'waterfall', 'comparison', 'quote', 'section-divider',
]);

const slideBackgroundSchema = z.object({
  type: z.enum(['color', 'image']),
  value: z.string().min(1),
  opacity: z.number().min(0).max(1).optional(),
});

const textBlockSchema = z.object({
  type: z.literal('text'),
  style: z.enum(['heading', 'body', 'list-item']),
  content: z.string().min(1),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  listType: z.enum(['unordered', 'ordered']).optional(),
});

const tableBlockSchema = z.object({
  type: z.literal('table'),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  caption: z.string().optional(),
});

const codeBlockSchema = z.object({
  type: z.literal('code'),
  language: z.string(),
  code: z.string(),
  caption: z.string().optional(),
});

const imageBlockSchema = z.object({
  type: z.literal('image'),
  src: z.string().min(1),
  alt: z.string(),
  caption: z.string().optional(),
});

const quoteBlockSchema = z.object({
  type: z.literal('quote'),
  text: z.string().min(1),
  attribution: z.string().optional(),
});

const twoColumnBlockSchema = z.object({
  type: z.literal('two-column'),
  leftHeader: z.string(),
  leftItems: z.array(z.string()),
  rightHeader: z.string(),
  rightItems: z.array(z.string()),
});

const blockSchema: z.ZodType<Block> = z.discriminatedUnion('type', [
  textBlockSchema,
  tableBlockSchema,
  codeBlockSchema,
  imageBlockSchema,
  quoteBlockSchema,
  twoColumnBlockSchema,
]);

const slideSchema: z.ZodType<Slide> = z.object({
  layout: layoutTypeSchema,
  blocks: z.array(blockSchema),
  speakerNotes: z.string().optional(),
  subtitle: z.string().optional(),
  footer: z.string().optional(),
  background: slideBackgroundSchema.optional(),
});

const contentModelSchema = z.object({
  slides: z.array(slideSchema),
});

export type ValidationResult =
  | { success: true; data: Slide[] }
  | { success: false; errors: z.ZodError };

export function validate(input: unknown): ValidationResult {
  const result = contentModelSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data.slides };
  }
  return { success: false, errors: result.error };
}

export function validateSlide(input: unknown): ValidationResult {
  const result = slideSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: [result.data] };
  }
  return { success: false, errors: result.error };
}
