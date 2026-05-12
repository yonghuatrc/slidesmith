import { z } from 'zod';

export const providerConfigSchema = z.discriminatedUnion('provider', [
  z.object({ provider: z.literal('openai'), apiKey: z.string(), model: z.string().optional(), organization: z.string().optional() }),
  z.object({ provider: z.literal('ollama'), baseUrl: z.string().optional(), model: z.string().optional() }),
]);

export const slidesmithConfigSchema = z.object({
  theme: z.string().default('dark-tech'),
  ratio: z.enum(['16:9', '4:3']).default('16:9'),
  density: z.enum(['compact', 'comfortable', 'breathing']).default('comfortable'),
  output: z.string().default('output/deck.pptx'),
  embedFonts: z.boolean().default(true),
  provider: providerConfigSchema.optional(),
});

export type SlidesmithConfig = z.infer<typeof slidesmithConfigSchema>;
