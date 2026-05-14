# SlideSmith — Design Document

> **Status**: Implementation Complete · **Last updated**: 2026-05-14 · **Version**: v0.1.0

---

## 1. Concept & Positioning

**One-liner**: The presentation tool for people who think in text.

SlideSmith is a CLI tool that generates professional, native `.pptx` presentations from Markdown or natural language prompts. Think `zola` or `hugo`, but for presentations.

### Target Audience

- **Developers** who think in structure, not drag-and-drop. They want git diff on presentations.
- **Engineer-managers** who need weekly/quarterly deck updates from the same source of truth.
- **Technical presenters** who'd rather write Markdown than fight PowerPoint formatting.
- **Compliance-sensitive teams** (healthcare, finance, defence) who can't upload data to cloud AI tools.
- **Open source enthusiasts** who refuse to pay $30/mo for Gamma or Beautiful.ai.

### How It's Different

| | SlideSmith | Pandoc | Marp/Slidev | Gamma/Beautiful.ai |
|---|---|---|---|---|
| **Output** | Native PPTX | PPTX (ugly) | HTML/PDF | PPTX export (locked) |
| **AI-powered** | Built-in (BYOK + Ollama) | ❌ | ❌ | Proprietary |
| **Design system** | 5 themes, 8 layouts, density modes | Zero | CSS-themable | Limited |
| **Open source** | ✅ MIT | ✅ GPL | ✅ MIT | ❌ Closed |
| **Offline** | ✅ | ✅ | ✅ | ❌ |
| **Code blocks** | Native syntax-highlighted | Basic | Via plugin | ❌ |

---

## 2. Input Modes

| Mode | v0.1 | Command |
|------|:----:|---------|
| Markdown → PPTX | ✅ | `slidesmith build deck.md` |
| Raw text → AI → PPTX (BYOK) | ✅ | `slidesmith generate "text"` |
| Raw text → AI → PPTX (Ollama) | ✅ | `slidesmith generate --provider ollama` |
| Project scaffolding | ✅ | `slidesmith init [directory]` |
| Live preview with hot-reload | ✅ | `slidesmith preview deck.md` |
| List available themes | ✅ | `slidesmith list-themes` |
| Template reverse-engineer (magic wand) | ❌ Not implemented | `slidesmith expand template.pptx` |
| Web UI | ❌ Phase 2 | Next.js app |

### Markdown → PPTX (`slidesmith build`)

```
deck.md                 output/
├── # Title              ├── deck.pptx
├── ## Section           └── assets/
├── - Bullet text            ├── image1.png
├── ```code block            └── image2.png
├── | Table |
└── NOTE: speaker text
```

### AI → PPTX (`slidesmith generate`)

```
$ slidesmith generate "3 slides on quantum computing for a technical audience"
→ ContentModel (via provider) → PPTX
```

### Slide Segmentation Strategy

The parser splits a flat Markdown file into discrete slides using two rules:

| Rule | Delimiter | Behaviour |
|------|-----------|-----------|
| **Explicit** | `---` on its own line | Forces a new slide boundary. Compatible with Marp convention. |
| **Implicit** | `##` heading (depth 2+) | Starts a new slide only when `---` is absent. Deep headings (h3+) nest within the current slide. |

**Priority:** `---` takes precedence. An `##` heading is only a slide boundary if it doesn't follow a `---` line.

**Edge cases:**
- Leading content before first `---` or `##` → single slide (title slide)
- Multiple `---` in a row → empty slides (warning emitted)
- No `---` and no `##` → single slide with all content
- Mixed: `##` headings separated by `---` → each `---` group is one slide, titled by its first `##`

---

## 3. Architecture

### Package Dependency Graph

```
┌─────────────┐
│    core     │  CLI entry, config (load + merge), parser → ContentModel
│             │  Depends on: content-model, renderer, ai, themes
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│          content-model              │  ← Shared intermediate representation
│  (types.ts, validator.ts)          │     NO external dependencies
└─────────────────────────────────────┘
       │            ▲            ▲
       ▼            │            │
┌──────────┐  ┌──────────┐  ┌────────┐
│ renderer │  │    ai    │  │ themes │
│ pptxgenjs│  │ OpenAI   │  │ json   │
│ layouts  │  │ Claude   │  │ tokens │
│ blocks   │  │ Ollama   │  │        │
└──────────┘  └──────────┘  └────────┘
```

### Pipeline

```
┌─────────┐    ┌───────────┐    ┌──────────────┐    ┌───────────────┐    ┌────────┐
│  Input  │───▶│ Parser /  │───▶│  ContentModel │───▶│ Layout Engine │───▶│  PPTX  │
│  .md /  │    │ AI        │    │  (intermedi-  │    │ (zone-based   │    │ (native│
│  prompt │    │ provider  │    │  ate repr)    │    │  placement)   │    │ binary)│
└─────────┘    └───────────┘    └──────────────┘    └───────────────┘    └────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                               │   Validator   │
                               │ Zod schema    │
                               └──────────────┘

### Config Merge Pipeline

```
CLI flags ──────┐
                ├──▶ merge() ──▶ Build Command
         ┌──────┘
         ▼
slidesmith.yaml ──▶ loadConfig()
```

Configuration is resolved before the rendering pipeline executes. The merge system combines CLI flags, config file values, and defaults into a single `BuildOptions` object.

### Why ContentModel?

ContentModel is the **shared intermediate representation** between parser, AI providers, and renderer. It decouples input format from output rendering.

**Key benefits:**
- A new parser (docx→pptx, restructured text) needs zero renderer changes
- A new AI provider only needs to emit ContentModel — no layout logic
- Validation at the model boundary catches bad input before rendering
- Dry-run mode serialises ContentModel to JSON for preview
- Testable in isolation (parse → validate → assert ContentModel equality)

### Preview Architecture

`slidesmith preview` starts an HTTP server that displays slides in a browser with hot-reload.

**Key design decision:** Preview HTML is **derived from pptxgenjs output**, not a separate code path. This guarantees visual fidelity between preview and final PPTX.

```
ContentModel → pptxgenjs (in-memory) → PNG per slide → HTML page with embedded images
                                                      ↑ filesystem watcher → WebSocket reload
```

The preview server:
1. Renders the ContentModel to PPTX in memory (using the same `renderer` package)
2. Exports each slide as PNG via pptxgenjs
3. Serves a zero-dependency HTML page that displays all slides
4. Watches the source `.md` file for changes → re-renders on save → pushes reload via WebSocket
5. No separate layout/theme/block rendering code — reuses the full renderer pipeline

This avoids maintaining two renderers. Preview fidelity is 100% guaranteed because it IS the actual output.

### Error Handling & Error Codes

All errors use a typed hierarchy for testability and user-friendly output:

```typescript
class SlideSmithError extends Error {
  constructor(
    code: string,        // e.g. 'ERR_PARSER_EMPTY_INPUT'
    message: string,
    detail?: unknown
  ) { super(message); }
}

// Error categories
'ERR_PARSER_*'       // Markdown parsing failures
'ERR_RENDERER_*'     // PPTX generation failures
'ERR_AI_*'           // AI provider failures
'ERR_CONFIG_*'       // Configuration loading failures
'ERR_THEME_*'        // Theme validation failures
'ERR_IO_*'           // File system failures
```

```typescript
// Core types (content-model/src/types.ts)

type LayoutType = 'cover' | 'hero-top' | 'three-column' | 'symmetric'
                | 'waterfall' | 'comparison' | 'quote' | 'section-divider';

interface Slide {
  layout: LayoutType;
  blocks: Block[];
  speakerNotes?: string;
  subtitle?: string;             // Used by: cover, hero-top
  footer?: string;               // Used by: cover
  background?: SlideBackground;  // Used by: section-divider, cover
}

interface SlideBackground {
  type: 'color' | 'image';
  value: string; // hex color or image URL
  opacity?: number;
}

type Block = TextBlock | TableBlock | CodeBlock | ImageBlock | QuoteBlock | TwoColumnBlock;

interface TextBlock {
  type: 'text';
  style: 'heading' | 'body' | 'list-item';
  content: string;
  level?: 1 | 2 | 3 | 4;            // only for heading style
  listType?: 'unordered' | 'ordered'; // only for list-item style
}

interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
  caption?: string;
}

interface CodeBlock {
  type: 'code';
  language: string;
  code: string;
  caption?: string;
}

interface ImageBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

interface QuoteBlock {
  type: 'quote';
  text: string;
  attribution?: string;
}

interface TwoColumnBlock {
  type: 'two-column';
  leftHeader: string;
  leftItems: string[];
  rightHeader: string;
  rightItems: string[];
}
```

---

## 4. v0.1 Scope

### In (v0.1.0 — All Shipped)

| Feature | Priority | Status | Notes |
|---------|----------|:------:|-------|
| Markdown → PPTX pipeline | P0 | ✅ | Core raison d'être |
| 8 layouts (cover, hero-top, three-column, symmetric, waterfall, comparison, quote, section-divider) | P0 | ✅ | Covers real-world presentation patterns |
| 5 themes (dark-tech, blue-white, warm-earth, minimal-clean, high-contrast) | P0 | ✅ | Broader appeal from day one |
| Block types: text, tables, code, images | P0 | ✅ | Text = paragraphs + headings + lists |
| AI generation (BYOK OpenAI + Ollama) | P0 | ✅ | Bring your own key |
| Speaker notes (`NOTE:` lines in MD) | P1 | ✅ | Parsed from Markdown, added to slide notes |
| `--ratio 16:9\|4:3` flag | P1 | ✅ | Default 16:9 |
| `slidesmith preview` — HTML hot-reload | P1 | ✅ | Fix design feedback loop |
| `slidesmith init` command | P1 | ✅ | Scaffolds project with theme + example deck |
| Density modes (compact/comfortable/breathing) | P1 | ✅ | Controls spacing throughout |
| `slidesmith list-themes` command | P1 | ✅ | Show available themes |
| `--config <path>` flag | P1 | ✅ | Path to config file |
| Zod validation on ContentModel | P1 | ✅ | Gate between parser/AI and renderer |
| `--dry-run` flag | P2 | ✅ | Preview slides + tokens without calling AI |
| Overflow handling (text too long for slide) | P2 | ✅ | Shrink font, truncate with warning, or split slide |
| Error recovery (LLM returns invalid JSON) + 4 retries for Ollama | P2 | ✅ | Exponential backoff, code fence stripping, JSON5 lenient parse |

### Config Merge Priority

Configuration is resolved in this order (higher overrides lower):

1. **CLI flags** — highest priority. `--theme dark-tech` overrides everything.
2. **Config file** (`slidesmith.yaml`) — loaded from current directory or `--config <path>`.
3. **Defaults** — hardcoded in `packages/core/src/config/defaults.ts`.

Priority rule: `CLI flags ?? config file values ?? defaults`

### Stretch Goal (v0.1, not implemented)

| Feature | Why Stretch | Effort | Status |
|---------|-------------|--------|:------:|
| Magic wand (reverse-engineer PPTX template) | Biggest competitive differentiator. Demo is HN front page material. Requires JSZip + XML parsing of OOXML. | ~2 weeks | ❌ |

### Deferred (Phase 2+)

| Feature | Reason |
|---------|--------|
| Claude AI provider | Reduce testing surface. Ship OpenAI + Ollama in v0.1. |
| Remaining layouts | 8 covers the 80% case. Add more post-launch. |
| Remaining themes | 5 covers major use cases. Add more post-launch. |
| Web UI (Next.js app) | Separate surface, separate repo |
| Plugin API | Needs stable ContentModel + Layout API first |
| Animated builds | pptxgenjs animation support is experimental |
| PDF export | Use LibreOffice headless |
| Diagram/flowchart blocks | Needs a graph layout engine |

---

## 5. File Tree

```
slidesmith/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── vitest.workspace.ts
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI: lint + test + build. CD: npm publish on v* tags
├── packages/
│   ├── cli/                          # @slidesmith/cli — publishable npm wrapper
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .npmignore
│   ├── content-model/
│   │   ├── package.json
│   │   └── src/
│   │       ├── types.ts
│   │       ├── validator.ts
│   │       └── index.ts
│   ├── core/
│   │   ├── package.json
│   │   └── src/
│   │       ├── cli/
│   │       │   ├── index.ts
│   │       │   ├── build.command.ts
│   │       │   ├── generate.command.ts
│   │       │   ├── init.command.ts
│   │       │   ├── list-themes.command.ts
│   │       │   └── preview.command.ts
│   │       ├── preview/
│   │       │   └── index.ts
│   │       ├── parser/
│   │       │   ├── index.ts
│   │       │   ├── markdown.ts
│   │       │   └── speaker-notes.ts
│   │       ├── config/
│   │       │   ├── index.ts
│   │       │   ├── schema.ts
│   │       │   └── defaults.ts
│   │       └── __tests__/
│   │           ├── config.test.ts
│   │           └── parser.test.ts
│   ├── renderer/
│   │   ├── package.json
│   │   └── src/
│   │       ├── engine/
│   │       │   ├── renderer.ts
│   │       │   ├── slide-builder.ts
│   │       │   └── pptxgenjs.d.ts
│   │       ├── layouts/
│   │       │   ├── registry.ts
│   │       │   ├── cover.ts
│   │       │   ├── hero-top.ts
│   │       │   ├── three-column.ts
│   │       │   ├── symmetric.ts
│   │       │   ├── waterfall.ts
│   │       │   ├── comparison.ts
│   │       │   ├── quote.ts
│   │       │   └── section-divider.ts
│   │       ├── blocks/
│   │       │   ├── index.ts
│   │       │   ├── types.ts
│   │       │   ├── text-block.ts
│   │       │   ├── table-block.ts
│   │       │   ├── code-block.ts
│   │       │   ├── image-block.ts
│   │       │   ├── quote-block.ts
│   │       │   └── two-column-block.ts
│   │       └── utils/
│   │           ├── text-measure.ts
│   │           └── color.ts
│   ├── ai/
│   │   ├── package.json
│   │   └── src/
│   │       ├── providers/
│   │       │   ├── types.ts
│   │       │   ├── factory.ts
│   │       │   ├── index.ts
│   │       │   ├── openai.ts
│   │       │   └── ollama.ts
│   │       ├── schema/
│   │       │   └── content-model-schema.ts
│   │       └── prompt/
│   │           └── system-prompt.ts
│   └── themes/
│       ├── package.json
│       ├── dark-tech/theme.json
│       ├── blue-white/theme.json
│       ├── warm-earth/theme.json
│       ├── minimal-clean/theme.json
│       └── high-contrast/theme.json
├── tests/
│   ├── e2e/
│   │   └── golden.test.ts
│   └── fixtures/
│       ├── basic-deck.md
│       ├── code-heavy.md
│       ├── complex-deck.md
│       └── empty-deck.md
├── docs/
│   ├── getting-started.md
│   ├── themes.md
│   └── configuration.md
├── examples/
│   └── demo-deck.md
├── CREDITS.md
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

### Pre-Implementation Checklist

All items resolved before implementation began. All captured in this document:

- [x] Slide segmentation strategy documented (`---` + `##` rules)
- [x] ContentModel types finalized (subtitle, background, quote, two-column, footer)
- [x] Preview architecture: derive from pptxgenjs output, not parallel code path
- [x] Font embedding strategy documented
- [x] Text measurement approach chosen (node-canvas)
- [x] TextBlock.style discriminated from TextBlock.level
- [x] Layout block distribution algorithm defined
- [x] Error handling hierarchy designed (SlideSmithError with codes)
- [x] AI provider types use discriminated union
- [x] Ollama-specific sanitization + 4 retries
- [x] Code block rendering requires shiki (budgeted 6h)
- [x] Critical test defined: single-slide markdown → valid PPTX

---

## 6. Build Plan (4 Sprints)

### Sprint 1 — Foundation (Weeks 1–2)

**Goal:** Monorepo scaffold runs, ContentModel compiles, theme system loads, config loads.

| Task | Est. | Verification |
|------|------|-------------|
| pnpm workspace + tsconfig + vitest | 2h | `pnpm test` runs across all packages |
| `content-model` package with types + Zod validator | 4h | `validate()` passes/fails known cases |
| `themes` package with 5 `theme.json` files | 4h | Theme loader reads + validates all themes |
| `core/config` schema + defaults + YAML loader | 4h | `loadConfig()` returns correct defaults |
| `renderer` package scaffold + pptxgenjs integration | 3h | `pptxgenjs` imports without error |
| CI setup (GitHub Actions: lint + test + build) | 2h | PR checks pass |
| **Total** | **19h** | |

### Sprint 2 — Parser & Renderer (Weeks 3–4)

**Goal:** `slidesmith build deck.md` produces a valid PPTX with correct layout.

| Task | Est. | Verification |
|------|------|-------------|
| Markdown parser with slide segmentation (`---` / `##` rules) | 8h | Parse known MD with `---`, assert correct Slide[] boundaries |
| Speaker notes extractor | 2h | `NOTE:` lines → `speakerNotes` field |
| 8 layout implementations (cover, hero-top, 3-col, symmetric, waterfall, comparison, quote, section-divider) | 16h | Each layout renders correct zone positions |
| Layout block distribution algorithm (zone affinity rules) | 4h | Blocks map to correct zones per layout type |
| Text + table block renderers | 6h | Text formatting, table grid, alternating rows |
| Code block renderer with syntax highlighting (shiki + 15 languages) | 6h | Monospace + colored text runs. JS, TS, Python, Rust, Go, Java, C++, Ruby, SQL, YAML, JSON, HTML, CSS, Bash, Diff |
| Image block renderer (local/URL/base64 resolution) | 3h | Aspect ratio preserved, remote URLs downloaded |
| Text measurement utility (node-canvas) | 4h | Measure known string — within 5% of pptxgenjs actual output |
| Density mode spacing overrides | 2h | Compact < Comfortable < Breathing spacing |
| `slidesmith preview` server (derive HTML from pptxgenjs) | 6h | Live preview reflects exact PPTX output |
| `slidesmith build` CLI command | 4h | CLI produces `.pptx` file at given path |
| Font download + embed pipeline (Google Fonts → `~/.slidesmith/fonts/`) | 4h | Inter and JetBrains Mono downloaded and embedded |
| **Total** | **65h** | |

### Sprint 3 — AI & Commands (Weeks 5–6) ✅ COMPLETE

**Goal:** `slidesmith generate` works with OpenAI + Ollama. `init` scaffolds projects.

| Task | Est. | Verification | Status |
|------|------|-------------|:------:|
| `AiProvider` interface + factory + discriminated config | 3h | Factory returns correct provider by config shape | ✅ |
| OpenAI provider (JSON mode + structured outputs) | 4h | Real API call returns valid ContentModel | ✅ |
| Ollama provider + sanitization layer (strip fences, JSON5 parse) | 8h | Retry loop handles invalid JSON, 4 retries with backoff | ✅ |
| Zod validation on AI output + retry loop | 3h | Invalid response triggers retry then SlideSmithError | ✅ |
| `slidesmith generate` CLI command | 4h | CLI accepts prompt + provider + options | ✅ |
| `slidesmith init` CLI command (minimal: `cp -r` from template) | 2h | Scaffolds directory + example deck | ✅ |
| `slidesmith list-themes` CLI command | 1h | Lists all themes with descriptions | ✅ |
| Overflow handling (shrink/truncate/split) | 4h | Long text demo triggers correct strategy per density mode | ✅ |
| `--dry-run` flag with char-based token estimation | 2h | Dry run prints estimated slide count + tokens | ✅ |
| **Total** | **31h** | **All delivered** | ✅ |

### Sprint 4 — Polish & Release (Weeks 7–8) — Phase A ✅ / Phase B ⏳

**Goal (Phase A):** Docs readable, E2E tests pass, examples work.

**Goal (Phase B):** npm publish-ready. **BLOCKED** — `npm login` credentials not available. `@slidesmith/cli` package is ready, CI/CD workflow exists, publish triggers on `v*` tags.

#### Phase A — Documentation & Assets (Complete)

| Task | Est. | Verification | Status |
|------|------|-------------|:------:|
| `docs/getting-started.md` | 3h | Follow steps from clean environment | ✅ |
| `docs/themes.md` | 2h | Theme tokens documented | ✅ |
| `docs/configuration.md` | 2h | Config reference complete | ✅ |
| `examples/demo-deck.md` | 2h | `slidesmith build demo-deck.md` works | ✅ |
| README.md with badges + comparison table | 3h | 5-second test passes | ✅ |
| CONTRIBUTING.md + CREDITS.md | 2h | Contribution flow documented | ✅ |
| **Phase A Total** | **14h** | **All delivered** | ✅ |

#### Phase B — npm Publish & CI/CD (Blocked)

| Task | Est. | Verification | Status |
|------|------|-------------|:------:|
| `@slidesmith/cli` publishable wrapper | 2h | `npm pack` produces correct tarball | ✅ |
| Config merge: CLI flags > config file > defaults (finalized) | 2h | `--theme X` + config `theme: Y` → X wins | ✅ |
| `generate` fix: bundle `@slidesmith/ai` into CLI | 1h | Runtime no longer crashes on `generate` | ✅ |
| CI/CD publish workflow (GitHub Actions) | 3h | `pnpm publish` workflow green on `v*` tags | ✅ |
| E2E test suite (build, generate, init) | 6h | Full pipeline tests in CI | ✅ |
| Cross-platform PPTX testing (PowerPoint, Google Slides, LibreOffice, Keynote) | 4h | All 4 platforms render correctly | ⏳ |
| v0.1.0 npm publish | 2h | `pnpm publish --tag latest` | ⏳ Blocked |
| **Phase B Total** | **20h** | **Unblocked: ~42h remaining** | ⏳ |

#### Stretch Goal (Not Implemented)

| Task | Est. | Verification | Status |
|------|------|-------------|:------:|
| Magic wand (reverse-engineer PPTX template) | 16h | Extract theme from arbitrary .pptx | ❌ |

---

## 7. Theme System

### Schema (`theme.json`)

```jsonc
{
  "$schema": "https://slidesmith.dev/theme-schema.json",
  "name": "dark-tech",
  "version": "1.0.0",
  "description": "Dark theme for tech presentations with green accent",
  "author": "SlideSmith",

  "colors": {
    "background": "#0D1117",
    "surface": "#161B22",
    "text": "#E6EDF3",
    "textMuted": "#8B949E",
    "accent": "#58A6FF",
    "accent2": "#3FB950",
    "border": "#30363D",
    "error": "#F85149"
  },

  "fonts": {
    "heading": { "family": "Inter", "weight": 600, "weights": { "h1": 800, "h2": 700, "h3": 600, "h4": 600 } },
    "body": { "family": "Inter", "weight": 400, "size": 14 },
    "mono": { "family": "JetBrains Mono", "weight": 400 }
  },

  "spacing": {
    "compact": { "slidePadding": 24, "blockGap": 8, "paragraphGap": 4, "sectionGap": 12 },
    "comfortable": { "slidePadding": 36, "blockGap": 14, "paragraphGap": 8, "sectionGap": 20 },
    "breathing": { "slidePadding": 48, "blockGap": 20, "paragraphGap": 12, "sectionGap": 28 }
  },

  "radii": { "small": 2, "medium": 4, "large": 8, "full": 999 },
  "shadows": {
    "subtle": { "offsetX": 0, "offsetY": 1, "blur": 2, "color": "#00000033" },
    "medium": { "offsetX": 0, "offsetY": 2, "blur": 8, "color": "#00000044" }
  },

  "layouts": ["cover", "hero-top", "three-column", "symmetric", "waterfall", "comparison", "quote", "section-divider"]
}
```

### Density Modes

| Mode | Use Case |
|------|----------|
| `compact` | Data-heavy slides, many points |
| `comfortable` | General presentations (default) |
| `breathing` | Keynotes, pitch decks |

### Layout Block Distribution Algorithm

The layout engine assigns blocks to zones using type affinity rules:

```
Algorithm: Layout Block Distribution
1. Each layout defines named zones with type affinity
   - 'header' zone accepts h1/h2 blocks
   - 'body' zone accepts all block types
   - 'media' zone accepts image/two-column blocks
   - 'quote' zone accepts quote blocks (quote layout only)
2. Blocks are assigned to zones in order:
   a. First h1/h2 TextBlock → header zone (if layout has one)
   b. QuoteBlock → quote zone (if layout has one)
   c. ImageBlock/TwocolumnBlock → media zone (if layout has one)
   d. Remaining blocks in order → primary body zone
   e. Unmatched zones → hidden gracefully
3. Within a zone, blocks stack vertically in order
4. If total content height exceeds zone height:
   - compact density: auto-shrink font size
   - comfortable density: truncate with ellipsis + warning
   - breathing density: split content across multiple slides
5. Stretch zones (quote, cover) absorb available vertical space
```

### Font Embedding Strategy

Themes specify Google Fonts (Inter, JetBrains Mono, etc.). Font availability on the recipient's system is not guaranteed.

| Approach | How | File Size | Fidelity |
|----------|-----|:---------:|:--------:|
| **Embed fonts** (default) | Download at first build via `slidesmith init`, store in `~/.slidesmith/fonts/`, embed via pptxgenjs `embedFont()` | +300KB per weight | Exact |
| **Font stack** (fallback) | CSS-like fallback: `"Inter, 'Segoe UI', Arial, sans-serif"` | Zero | Approximate |
| `embedFonts: false` (config) | Skip embedding, use font stack only | Zero | Variable |

Google Fonts are Open Font License (OFL) compliant — embedding is permitted. Non-OFL fonts are not supported.

```
Layout: hero-top
┌──────────────────────────────────┐
│          HEADER ZONE             │  y: 0.05, height: 0.15
│  ┌────────────────────────────┐  │
│  │       Title + Subtitle     │  │  x: 0.08, width: 0.84
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│          BODY ZONE               │  y: 0.22, height: 0.73
│  ┌────────────────────────────┐  │
│  │     Text / Code / Table    │  │  x: 0.08, width: 0.84
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Built-in Themes (v0.1)

| Theme | Palette Mood | Best For |
|-------|-------------|----------|
| `dark-tech` | Dark bg, blue/green accent | Developer talks, tech conferences |
| `blue-white` | White bg, blue accent | Corporate, academic, internal meetings |
| `warm-earth` | Cream/brown, warm accent | Storytelling, design reviews |
| `minimal-clean` | White bg, black text, thin borders | Print, formal documents, accessibility |
| `high-contrast` | Black/white, large type, max contrast | Accessibility-first, projectors, large rooms |

---

## 8. AI Provider System

### Interface

```typescript
interface AiProvider {
  readonly name: string;
  generateSlides(prompt: string, options?: GenerateOptions): Promise<Slide[]>;
}

interface GenerateOptions {
  slideCount?: number;
  theme?: string;
  language?: string;
  temperature?: number;    // default 0.3 for consistency
  signal?: AbortSignal;
}
```

### Discriminated Config

```typescript
type ProviderConfig = 
  | { provider: 'openai'; apiKey: string; model?: string; organization?: string }
  | { provider: 'ollama'; baseUrl?: string; model?: string }
  | { provider: 'claude'; apiKey: string; model?: string };  // Phase 2
```

### Factory Pattern

```typescript
const provider = createProvider(
  { provider: 'openai', apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o' }
);

const model = await provider.generateSlides(
  '3 slides about quantum computing',
  { slideCount: 3, theme: 'dark-tech' }
);
```

### Provider Details

| Provider | Method | JSON Mode | Notes |
|----------|--------|-----------|-------|
| **OpenAI** | Chat Completions API | `response_format: json_object` + structured outputs | Primary provider. Pin major SDK version. |
| **Ollama** | Chat API (no native JSON mode) | System prompt: "Respond ONLY with valid JSON" | 4 retries (not 2). Strip code fences. |
| **Claude** | Phase 2 | — | Deferred to reduce testing surface. |

### Ollama-Specific Error Handling

Ollama requires extra sanitization because small models frequently produce invalid JSON:

```
Call provider → Raw string
  → Strip markdown code fences (```json ... ```)
  → Remove trailing text after closing }
  → JSON5.parse() lenient fallback
  → Zod.validate()
  → Valid? → Return ContentModel
  → Invalid? → Retry (max 4, backoff: 1s, 2s, 4s, 8s)
Retry exhausted → Throw SlideSmithError with raw response in detail
```

**Recommended models:** For best Ollama results, use `llama3.1:70b` or `qwen2.5:32b`. Smaller models (< 7B parameters) may produce invalid JSON.

### Error Handling

```
Call provider → Raw string → Sanitize → Parse → Zod valid? → Yes → Return ContentModel
                                                       → No  → Retry (OpenAI: max 2, backoff 1s/2s; Ollama: max 4, backoff 1s/2s/4s/8s)
Retry exhausted → Throw SlideSmithError (ERR_AI_PROVIDER_*)
```

### Dry-Run Mode

```bash
$ slidesmith generate "5 slides on AI" --dry-run
Estimated slides: 5 | Tokens: ~850 | Provider: openai (gpt-4o)
Theme: dark-tech | Layouts: [cover, hero-top×2, three-column, waterfall]
[No AI call made. Pass --no-dry-run to generate.]
```

Provider configuration (`apiKey`, `model`) is read from `slidesmith.yaml` at build time via the config merge system.

---

## 9. Design System

### Credit

The design system — theme structure, layout zones, density modes, and color token naming — is inspired by **ppt-agent-skills** (see CREDITS.md). SlideSmith adapts these concepts into an open-source, CLI-first tool.

### Design Tokens

| Category | Tokens | Example (dark-tech) |
|----------|--------|---------------------|
| Colors | background, surface, text, textMuted, accent, accent2, border, error | `#0D1117`, `#58A6FF` |
| Typography | heading family + weights, body family + size, mono family | Inter 800/700, JetBrains Mono |
| Spacing | slidePadding, blockGap, paragraphGap, sectionGap (×3 densities) | `24/8/4/12` (compact) |
| Radii | small, medium, large, full | `2/4/8/999` |
| Shadows | subtle, medium | `0 1 2 #00000033` |

### Layouts (v0.1)

| Layout | Description |
|--------|-------------|
| **cover** | Full-bleed title slide: title, subtitle, optional image, footer |
| **hero-top** | Standard: header (title + subtitle), body zone |
| **three-column** | 3 equal columns with header bar |
| **symmetric** | 2-column: text left, media right |
| **waterfall** | Vertical section cascade: header + sections[] |
| **comparison** | Side-by-side: two columns with headers, ideal for before/after or pro/con |
| **quote** | Large pull-quote with attribution. Minimal body, maximum typography. |
| **section-divider** | Full-bleed title + background colour/image. Transition between sections. |

### WCAG 2.1 AA Compliance

All v0.1 themes checked for:
- Text contrast ≥ 4.5:1 (normal) / ≥ 3:1 (large)
- Non-text contrast ≥ 3:1 (borders, UI elements)

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|:----------:|------------|
| pptxgenjs unmaintained | Renderer stuck on bugs | Low | Clean abstraction layer. Fallback: fork or direct XML generation. |
| pptxgenjs no TypeScript types | Missing IDE support | High | Write `pptxgenjs.d.ts` declaration file in Sprint 1. |
| Text measurement inaccurate (no DOM) | Overflow detection false positives | Medium | Use `canvas` package (node-canvas) for server-side text metrics. |
| LLM output quality | Nonsensical slides | Medium | Temperature 0.3 max. Zod validation. Dry-run mode. |
| Ollama invalid JSON (small models) | Frequent user-facing failures | High | 4 retries, strip code fences, lenient JSON5 parse, document recommended models (70b+). |
| Ollama speed (CPU inference) | 2–5 min for 10 slides | High | Progress spinner. Recommend smaller models. |
| Font availability on recipient's system | Design breaks if fonts missing | High | Embed Google Fonts by default. `--no-embed` flag for size-sensitive users. |
| Font licensing | Legal risk | Medium | Google Fonts only (Open Font License). Embedding permitted. |
| PPTX cross-platform diffs | Different rendering across apps | High | Test all 4 platforms. Avoid exotic XML. |
| Two-renderer maintenance (preview + PPTX) | Duplicate layout logic | High | Preview derives HTML from pptxgenjs output — single code path. |
| Config eval security | Malicious .ts config | Medium | Warn users. Recommend YAML for untrusted envs. |
| AI API costs | Surprise token burn | Medium | Dry-run shows estimate. Running count. Cap at 20 slides. |
| Syntax highlighting dependency (shiki) | 5MB+ added to bundle | Medium | Lazy-load shiki — only import when code blocks present. |
| Config merge priority confusion | User expects CLI to win but config wins | Medium | Use `??` (nullish coalescing) — CLI only overrides when explicitly set. |

---

## 11. References

### Design Inspiration
- **ppt-agent-skills** — Design system concepts (layout zones, density modes, color tokens). Credited in CREDITS.md.

### Rendering
- **pptxgenjs** (v3.12+) — JavaScript PPTX generation. https://github.com/gitbrent/PptxGenJS

### Alternative Approaches
- **Marp** — MD → HTML/PDF slides. Not PPTX. https://marp.app/
- **Slidev** — Vue-powered slides. Not PPTX. https://sli.dev/
- **Pandoc** — Universal converter. MD→PPTX works but unstyled. https://pandoc.org/
- **python-pptx** — Python PPTX library. https://python-pptx.readthedocs.io/

### Commercial Competitors
- **Gamma.app** — AI presentations, $22/mo, proprietary
- **Beautiful.ai** — Design-first slides, $40/mo, closed source
- **Canva Presentations** — $12.99/mo pro, PPTX export available

### Technology
- **commander.js** — CLI framework. https://github.com/tj/commander.js
- **Zod** — Schema validation. https://zod.dev/
- **remark** — Markdown parser. https://remark.js.org/
- **shiki** — Syntax highlighting. https://shiki.style/
- **node-canvas** — Server-side text measurement. https://github.com/Automattic/node-canvas
- **Google Fonts** — Open-source fonts. https://fonts.google.com/
- **Vitest** — Unit test framework. https://vitest.dev/

---

*This document is the canonical source of truth for SlideSmith architecture and design decisions. Update when scope changes.*
