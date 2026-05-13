import { startPreviewServer } from '../preview';

export interface PreviewOptions {
  port?: number;
}

export async function executePreview(file: string, options: PreviewOptions): Promise<void> {
  await startPreviewServer({
    markdownFile: file,
    port: options.port || 3000,
    theme: 'dark-tech',
    ratio: '16:9',
    density: 'comfortable',
  });
}
