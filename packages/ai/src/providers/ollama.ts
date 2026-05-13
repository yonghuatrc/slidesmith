import type { Slide } from '@slidesmith/content-model';
import type { AiProvider, GenerateOptions } from './types';

export class OllamaProvider implements AiProvider {
  readonly name = 'ollama';

  constructor(
    private baseUrl = 'http://localhost:11434',
    private model = 'llama3.1',
  ) {}

  async generateSlides(prompt: string, options?: GenerateOptions): Promise<Slide[]> {
    // TODO: Sprint 3 — implement actual Ollama API call with sanitization + 4 retries
    throw new Error('ERR_AI_NOT_IMPLEMENTED: Ollama provider not yet implemented');
  }
}
