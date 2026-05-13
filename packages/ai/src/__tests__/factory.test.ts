import { describe, it, expect } from 'vitest';
import { createProvider } from '../providers/factory';

describe('createProvider', () => {
  it('creates an OpenAI provider', () => {
    const provider = createProvider({ provider: 'openai', apiKey: 'test-key' });
    expect(provider.name).toBe('openai');
  });

  it('creates an Ollama provider', () => {
    const provider = createProvider({ provider: 'ollama' });
    expect(provider.name).toBe('ollama');
  });

  it('throws for Claude (Phase 2)', () => {
    expect(() => createProvider({ provider: 'claude', apiKey: 'test' })).toThrow('ERR_AI_NOT_AVAILABLE');
  });

  it('throws for unknown provider', () => {
    expect(() => createProvider({ provider: 'unknown' } as never)).toThrow('ERR_AI_UNKNOWN_PROVIDER');
  });
});

describe('provider interface', () => {
  it('OpenAI provider throws ERR_AI_NOT_IMPLEMENTED', async () => {
    const provider = createProvider({ provider: 'openai', apiKey: 'test' });
    await expect(provider.generateSlides('test')).rejects.toThrow('ERR_AI_NOT_IMPLEMENTED');
  });

  it('Ollama provider throws ERR_AI_NOT_IMPLEMENTED', async () => {
    const provider = createProvider({ provider: 'ollama' });
    await expect(provider.generateSlides('test')).rejects.toThrow('ERR_AI_NOT_IMPLEMENTED');
  });
});
