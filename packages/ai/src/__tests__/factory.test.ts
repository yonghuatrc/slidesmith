import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProvider } from '../providers/factory';

// Mock openai module before any imports that use it
vi.mock('openai', () => {
  const validResponse = {
    slides: [
      {
        layout: 'cover',
        blocks: [
          { type: 'text', style: 'heading', content: 'Test Title', level: 1 },
        ],
      },
    ],
  };

  const mockCreate = () =>
    Promise.resolve({
      choices: [{ message: { content: JSON.stringify(validResponse) } }],
    });

  return {
    default: function () {
      return {
        chat: { completions: { create: mockCreate } },
      };
    },
  };
});

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
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('OpenAI provider throws ERR_AI_NO_API_KEY with empty key', async () => {
    const provider = createProvider({ provider: 'openai', apiKey: '' });
    await expect(provider.generateSlides('test')).rejects.toThrow('ERR_AI_NO_API_KEY');
  });

  it('Ollama provider throws on connection refused', { timeout: 30000 }, async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new Error('fetch failed: connect ECONNREFUSED 127.0.0.1:11434'),
    );

    const provider = createProvider({ provider: 'ollama' });
    await expect(provider.generateSlides('test')).rejects.toThrow('ERR_AI_PROVIDER_FAILED');
  });

  it('OpenAI provider handles valid response correctly', async () => {
    const { OpenAIProvider } = await import('../providers/openai');
    const provider = new OpenAIProvider('test-key', 'gpt-4o');
    const slides = await provider.generateSlides('test prompt');
    expect(slides).toHaveLength(1);
    expect(slides[0].layout).toBe('cover');
  });
});
