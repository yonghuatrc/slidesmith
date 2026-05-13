import type { AiProvider } from './types';
import type { ProviderConfig } from './types';
import { OpenAIProvider } from './openai';
import { OllamaProvider } from './ollama';

export function createProvider(config: ProviderConfig): AiProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config.apiKey, config.model);
    case 'ollama':
      return new OllamaProvider(config.baseUrl, config.model);
    case 'claude':
      throw new Error('ERR_AI_NOT_AVAILABLE: Claude provider is planned for Phase 2');
    default:
      throw new Error(`ERR_AI_UNKNOWN_PROVIDER: Unknown provider: ${(config as ProviderConfig).provider}`);
  }
}
