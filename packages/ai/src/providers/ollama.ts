import type { Slide } from '@slidesmith/content-model';
import type { AiProvider, GenerateOptions } from './types';
import { validate } from '@slidesmith/content-model';
import { getSystemPrompt } from '../prompt/system-prompt';

export class OllamaProvider implements AiProvider {
  readonly name = 'ollama';

  constructor(
    private baseUrl = 'http://localhost:11434',
    private model = 'llama3.1',
  ) {}

  async generateSlides(prompt: string, options?: GenerateOptions): Promise<Slide[]> {
    let lastError: Error | null = null;
    const maxRetries = 4;
    const retryDelays = [1000, 2000, 4000, 8000];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const systemPrompt = getSystemPrompt();
        const userPrompt = options?.slideCount
          ? `${prompt}\n\nGenerate exactly ${options.slideCount} slides.`
          : prompt;

        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            stream: false,
            options: {
              temperature: options?.temperature ?? 0.3,
            },
            messages: [
              {
                role: 'system',
                content: `${systemPrompt}\n\nRespond ONLY with valid JSON matching this schema. No markdown, no code fences, no explanations — just the raw JSON object.`,
              },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`ERR_AI_OLLAMA_HTTP: HTTP ${response.status}: ${response.statusText}`);
        }

        const body = await response.json();
        const content: string = body?.message?.content || '';

        if (!content) {
          throw new Error('ERR_AI_EMPTY_RESPONSE: Ollama returned empty response');
        }

        // Sanitize the response
        const sanitized = sanitizeResponse(content);

        // Parse JSON
        let parsed: unknown;
        try {
          // Attempt JSON5 for lenient parsing
          const JSON5 = await import('json5');
          parsed = JSON5.default.parse(sanitized);
        } catch {
          // Fallback to standard JSON
          try {
            parsed = JSON.parse(sanitized);
          } catch {
            throw new Error(
              `ERR_AI_INVALID_JSON: Failed to parse Ollama response as JSON.\nRaw response:\n${content.slice(0, 500)}`,
            );
          }
        }

        // Handle both { slides: [...] } and direct array
        const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'slides' in (parsed as Record<string, unknown>)
          ? (parsed as Record<string, unknown>)
          : { slides: parsed };

        // Validate with Zod
        const validationResult = validate(data);
        if (!validationResult.success) {
          throw new Error(
            `ERR_AI_VALIDATION: Response failed schema validation: ${validationResult.errors.message}\nRaw response:\n${content.slice(0, 500)}`,
          );
        }

        return validationResult.data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < maxRetries) {
          const delay = retryDelays[attempt] || 8000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `ERR_AI_PROVIDER_FAILED: Ollama API error after ${maxRetries} attempts: ${lastError!.message}`,
    );
  }
}

/**
 * Sanitize Ollama response by stripping markdown fences and trailing text.
 * Ollama models often wrap JSON in markdown code blocks or add trailing commentary.
 */
function sanitizeResponse(raw: string): string {
  let cleaned = raw.trim();

  // Strip markdown code fences: ```json ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Remove trailing text after the closing top-level } or ]
  // Find the last } or ] that closes the root object/array
  let braceDepth = 0;
  let rootEnd = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{' || ch === '[') {
      if (braceDepth === 0 && rootEnd === -1) {
        rootEnd = i; // mark start
      }
      braceDepth++;
    } else if (ch === '}' || ch === ']') {
      braceDepth--;
      if (braceDepth === 0) {
        rootEnd = i;
        break;
      }
    }
  }

  if (rootEnd >= 0) {
    cleaned = cleaned.slice(0, rootEnd + 1);
  }

  // Remove any remaining whitespace-only lines at the edges
  cleaned = cleaned.trim();

  return cleaned;
}
