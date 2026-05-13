import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig } from '../config/index';
import { DEFAULT_CONFIG } from '../config/defaults';

const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

const mockFsPromises = vi.hoisted(() => ({
  readFile: vi.fn(),
}));

vi.mock('node:fs', () => mockFs);
vi.mock('node:fs/promises', () => mockFsPromises);

describe('loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns DEFAULT_CONFIG when no config file exists', async () => {
    mockFs.existsSync.mockReturnValue(false);
    const config = await loadConfig('/nonexistent/path.yaml');
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('returns defaults when config file has partial values', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFsPromises.readFile.mockResolvedValue('theme: blue-white\n');
    const config = await loadConfig('/path/config.yaml');
    expect(config.theme).toBe('blue-white');
    expect(config.ratio).toBe('16:9');
    expect(config.density).toBe('comfortable');
  });

  it('rejects invalid ratio value', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFsPromises.readFile.mockResolvedValue('ratio: 5:4\n');
    await expect(loadConfig('/path/config.yaml')).rejects.toThrow();
  });

  it('CLI overrides win over file config when merged', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFsPromises.readFile.mockResolvedValue('theme: dark-tech\nratio: 4:3\n');
    const fileConfig = await loadConfig('/path/config.yaml');
    // Simulate the merge logic from cli/index.ts
    const cliTheme = 'blue-white';
    const merged = {
      theme: cliTheme ?? fileConfig.theme,
      output: fileConfig.output,
      ratio: fileConfig.ratio,
      density: fileConfig.density,
      embedFonts: fileConfig.embedFonts,
    };
    expect(merged.theme).toBe('blue-white');
    expect(merged.ratio).toBe('4:3');
    expect(merged.density).toBe('comfortable');
    expect(merged.embedFonts).toBe(true);
  });

  it('file config with partial values falls back to defaults', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFsPromises.readFile.mockResolvedValue('output: custom/path.pptx\n');
    const config = await loadConfig('/path/config.yaml');
    expect(config.theme).toBe('dark-tech');
    expect(config.ratio).toBe('16:9');
    expect(config.density).toBe('comfortable');
    expect(config.output).toBe('custom/path.pptx');
    expect(config.embedFonts).toBe(true);
  });

  it('returns all defaults', () => {
    expect(DEFAULT_CONFIG.theme).toBe('dark-tech');
    expect(DEFAULT_CONFIG.ratio).toBe('16:9');
    expect(DEFAULT_CONFIG.density).toBe('comfortable');
    expect(DEFAULT_CONFIG.embedFonts).toBe(true);
  });
});
