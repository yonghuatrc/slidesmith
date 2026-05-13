import type { Slide } from '@slidesmith/content-model';
import type { AiProvider, GenerateOptions } from './types';

export class OpenAIProvider implements AiProvider {
  readonly name = 'openai';

  constructor(
    private apiKey: string,
    private model = 'gpt-4o',
  ) {}

  async generateSlides(prompt: string, options?: GenerateOptions): Promise<Slide[]> {
    // TODO: Sprint 3 — implement actual OpenAI API call
    throw new Error('ERR_AI_NOT_IMPLEMENTED: OpenAI provider not yet implemented');
  }
}
