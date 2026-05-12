import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import { slidesmithConfigSchema, type SlidesmithConfig } from './schema';
import { DEFAULT_CONFIG } from './defaults';

export type { SlidesmithConfig } from './schema';

export async function loadConfig(configPath?: string): Promise<SlidesmithConfig> {
  const resolvedPath = configPath || resolve(process.cwd(), 'slidesmith.yaml');

  if (!existsSync(resolvedPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = await readFile(resolvedPath, 'utf-8');
    const parsed = load(raw);

    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_CONFIG };
    }

    const result = slidesmithConfigSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`ERR_CONFIG_INVALID: ${result.error.message}`);
    }

    return result.data;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('ERR_CONFIG_INVALID')) {
      throw err;
    }
    throw new Error(`ERR_CONFIG_PARSE: Failed to parse config file: ${(err as Error).message}`);
  }
}
