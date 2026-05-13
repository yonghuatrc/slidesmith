import type { Slide } from '@slidesmith/content-model';
import type { AiProvider, GenerateOptions } from './types';
import { validate } from '@slidesmith/content-model';
import { getSystemPrompt } from '../prompt/system-prompt';
import { CONTENT_MODEL_JSON_SCHEMA } from '../schema/content-model-schema';

export class OpenAIProvider implements AiProvider {
  readonly name = 'openai';

  constructor(
    private apiKey: string,
    private model = 'gpt-4o',
    private organization?: string,
  ) {}

  async generateSlides(prompt: string, options?: GenerateOptions): Promise<Slide[]> {
    if (!this.apiKey || this.apiKey === '') {
      throw new Error('ERR_AI_NO_API_KEY: OpenAI API key is required. Set OPENAI_API_KEY or pass apiKey in config.');
    }

    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { default: OpenAI } = await import('openai');

        const client = new OpenAI({
          apiKey: this.apiKey,
          organization: this.organization,
        });

        const systemPrompt = getSystemPrompt();
        const userPrompt = options?.slideCount
          ? `${prompt}\n\nGenerate exactly ${options.slideCount} slides.`
          : prompt;

        const response = await client.chat.completions.create({
          model: this.model,
          temperature: options?.temperature ?? 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('ERR_AI_EMPTY_RESPONSE: OpenAI returned empty response');
        }

        // Parse JSON
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          throw new Error('ERR_AI_INVALID_JSON: Failed to parse OpenAI response as JSON');
        }

        // Handle both { slides: [...] } and direct array
        const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'slides' in (parsed as Record<string, unknown>)
          ? (parsed as Record<string, unknown>)
          : { slides: parsed };

        // Validate with Zod
        const validationResult = validate(data);
        if (!validationResult.success) {
          throw new Error(`ERR_AI_VALIDATION: Response failed schema validation: ${validationResult.errors.message}`);
        }

        return validationResult.data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't retry on validation errors — the model output won't change
        if (lastError.message.startsWith('ERR_AI_VALIDATION')) {
          throw lastError;
        }

        if (attempt < maxRetries) {
          // Wait 1s before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    throw new Error(`ERR_AI_PROVIDER_FAILED: OpenAI API error after ${maxRetries + 1} attempts: ${lastError!.message}`);
  }
}
