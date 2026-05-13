import type { Slide } from '@slidesmith/content-model';

export interface GenerateOptions {
  slideCount?: number;
  theme?: string;
  language?: string;
  temperature?: number;
  signal?: AbortSignal;
}

export interface AiProvider {
  readonly name: string;
  generateSlides(prompt: string, options?: GenerateOptions): Promise<Slide[]>;
}

export type ProviderConfig =
  | { provider: 'openai'; apiKey: string; model?: string; organization?: string }
  | { provider: 'ollama'; baseUrl?: string; model?: string }
  | { provider: 'claude'; apiKey: string; model?: string };
