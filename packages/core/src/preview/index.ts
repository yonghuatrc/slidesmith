import { createServer, type Server } from 'node:http';
import { readFileSync, watch, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadTheme } from '@slidesmith/themes';
import { parseMarkdown } from '../parser/markdown';
import { renderToPptx } from '@slidesmith/renderer';

export interface PreviewOptions {
  port: number;
  markdownFile: string;
  theme: string;
  ratio: '16:9' | '4:3';
  density: 'compact' | 'comfortable' | 'breathing';
}

/**
 * Start the preview server.
 * Watches the markdown file for changes and re-renders.
 */
export function startPreviewServer(options: PreviewOptions): Server {
  const { port, markdownFile, theme: themeName, ratio, density } = options;
  const mdPath = resolve(process.cwd(), markdownFile);

  if (!existsSync(mdPath)) {
    throw new Error(`ERR_FILE_NOT_FOUND: ${mdPath}`);
  }

  const theme = loadTheme(themeName);

  // Current rendered slides (cached)
  let currentHtml = '<p>No content rendered yet.</p>';
  let lastRender = 0;

  /**
   * Re-render the markdown to an HTML preview.
   */
  async function renderPreview(): Promise<void> {
    try {
      const md = readFileSync(mdPath, 'utf-8');
      const parsed = parseMarkdown(md);

      await renderToPptx(parsed.slides, theme, {
        ratio,
        density,
        title: 'Preview',
        author: 'SlideSmith',
      });

      // Generate HTML
      let slidesHtml = '';

      for (let i = 0; i < parsed.slides.length; i++) {
        const slide = parsed.slides[i];
        const blocks = slide.blocks.map((b) => {
          switch (b.type) {
            case 'text':
              return `<div class="block ${b.style}">${escapeHtml(b.content)}</div>`;
            case 'code':
              return `<pre class="block code"><code>${escapeHtml(b.code)}</code></pre>`;
            case 'table':
              return `<table class="block"><thead><tr>${b.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
            case 'quote':
              return `<blockquote class="block">${escapeHtml(b.text)}${b.attribution ? `<footer>— ${escapeHtml(b.attribution)}</footer>` : ''}</blockquote>`;
            case 'image':
              return `<div class="block image"><em>[Image: ${escapeHtml(b.alt)}]</em></div>`;
            case 'two-column':
              return `<div class="block two-column"><div class="col"><h4>${escapeHtml(b.leftHeader)}</h4><ul>${b.leftItems.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div><div class="col"><h4>${escapeHtml(b.rightHeader)}</h4><ul>${b.rightItems.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div></div>`;
            default:
              return '';
          }
        }).join('');

        slidesHtml += `
          <div class="slide" style="background: ${theme.colors.background}; color: ${theme.colors.text};">
            <div class="slide-header">
              <span class="slide-number">${i + 1}</span>
              <span class="slide-layout">${slide.layout}</span>
            </div>
            <div class="slide-content">
              ${blocks}
            </div>
            ${slide.speakerNotes ? `<div class="speaker-notes">📝 ${escapeHtml(slide.speakerNotes)}</div>` : ''}
          </div>
        `;
      }

      currentHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>SlideSmith Preview</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; background: #111; padding: 20px; }
            .slide { width: 1066px; min-height: 600px; margin: 20px auto; border-radius: 8px; padding: 40px; position: relative; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
            .slide-header { position: absolute; top: 8px; right: 12px; font-size: 11px; opacity: 0.4; display: flex; gap: 8px; }
            .slide-content { display: flex; flex-direction: column; gap: 12px; height: 100%; }
            .block.heading { font-weight: 600; }
            .block.body { font-size: 14px; line-height: 1.6; }
            .block.code { background: rgba(0,0,0,0.3); border-radius: 4px; padding: 12px; font-family: monospace; font-size: 12px; overflow-x: auto; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: rgba(255,255,255,0.1); padding: 8px 12px; text-align: left; font-weight: 600; }
            td { padding: 6px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
            blockquote { border-left: 3px solid; padding-left: 16px; font-style: italic; font-size: 18px; }
            .two-column { display: flex; gap: 24px; }
            .two-column .col { flex: 1; }
            .speaker-notes { margin-top: 16px; padding: 8px 12px; background: rgba(255,255,0,0.1); border-radius: 4px; font-size: 12px; border-left: 2px solid #ffd700; }
            .status-bar { max-width: 1066px; margin: 0 auto 10px; display: flex; justify-content: space-between; color: #888; font-size: 12px; }
            .refresh-btn { background: #333; color: #fff; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; }
            .refresh-btn:hover { background: #555; }
          </style>
        </head>
        <body>
          <div class="status-bar">
            <span>🔄 Watching: ${markdownFile}</span>
            <span>${parsed.slides.length} slides · ${theme.name} · ${ratio} · ${density}</span>
          </div>
          ${slidesHtml}
          <script>
            // Poll for changes
            let lastPoll = Date.now();
            setInterval(async () => {
              try {
                const res = await fetch('/_ping?t=' + lastPoll);
                if (res.ok) {
                  const data = await res.json();
                  if (data.changed) {
                    window.location.reload();
                  }
                  lastPoll = Date.now();
                }
              } catch {}
            }, 2000);
          </script>
        </body>
        </html>
      `;

      lastRender = Date.now();
      console.log(`[preview] Re-rendered ${parsed.slides.length} slides`);
    } catch (err) {
      console.error(`[preview] Render error: ${(err as Error).message}`);
    }
  }

  // Initial render
  renderPreview();

  // Watch for file changes
  watch(mdPath, async (eventType) => {
    if (eventType === 'change') {
      console.log(`[preview] File changed: ${markdownFile}`);
      await renderPreview();
    }
  });

  // HTTP server
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (url.pathname === '/_ping') {
      const changed = lastRender > parseInt(url.searchParams.get('t') || '0');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ changed }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(currentHtml);
  });

  server.listen(port, () => {
    console.log(`\n  🎬 SlideSmith Preview Server\n`);
    console.log(`  📄 File:    ${mdPath}`);
    console.log(`  🎨 Theme:   ${themeName}`);
    console.log(`  🌐 URL:     http://localhost:${port}\n`);
    console.log(`  Press Ctrl+C to stop.\n`);
  });

  return server;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
