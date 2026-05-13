# SlideSmith

> The presentation tool for people who think in text.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/yonghuatrc/slidesmith?style=flat)](https://github.com/yonghuatrc/slidesmith)
[![npm version](https://img.shields.io/npm/v/@slidesmith/cli)](https://www.npmjs.com/package/@slidesmith/cli)

---

**SlideSmith** is a CLI tool that generates professional, native `.pptx` presentations from Markdown or natural language prompts. Think `zola` or `hugo`, but for presentations.

Write in Markdown. Get a polished PPTX. No PowerPoint required.

![Screenshot placeholder](https://via.placeholder.com/800x450?text=Screenshot+coming+soon)
> Screenshot coming soon — run `slidesmith build examples/demo-deck.md` to see output.

---

## Why SlideSmith?

| Situation | SlideSmith | Alternatives |
|-----------|-----------|-------------|
| You write in Markdown, need PPTX | One command | Pandoc (ugly output), Marp (HTML only) |
| You want AI-generated slides | Built-in, bring your own key | Gamma/Beautiful.ai ($22-40/mo, closed) |
| You need git-diffable presentations | Markdown in git | `.pptx` is binary |
| You can't upload data to cloud AI | Ollama support, fully offline | All commercial tools require cloud |
| You want open source | MIT licensed | Proprietary tools |

### Comparison

| | **SlideSmith** | Pandoc | Marp/Slidev | Gamma/Beautiful.ai |
|---|---|---|---|---|
| **Output** | Native PPTX | PPTX (ugly) | HTML/PDF | PPTX export (locked) |
| **AI-powered** | Built-in (BYOK + Ollama) | ❌ | ❌ | Proprietary |
| **Design system** | 5 themes, 8 layouts, density modes | Zero | CSS-themable | Limited |
| **Open source** | ✅ MIT | ✅ GPL | ✅ MIT | ❌ Closed |
| **Offline** | ✅ | ✅ | ✅ | ❌ |
| **Code blocks** | Native syntax-highlighted | Basic | Via plugin | ❌ |

---

## Features

- **Markdown → PPTX** — Write slides in Markdown, get a native PowerPoint file
- **AI generation** — Generate slides from a text prompt via OpenAI or Ollama (BYOK)
- **8 layouts** — Cover, hero-top, three-column, symmetric, waterfall, comparison, quote, section-divider
- **5 themes** — dark-tech, blue-white, warm-earth, minimal-clean, high-contrast
- **Code syntax highlighting** — TypeScript, Python, Rust, Go, Java, SQL, and 14 more languages via shiki
- **Density modes** — Compact (data-heavy), comfortable (default), breathing (keynotes)
- **Speaker notes** — Add `NOTE:` lines in Markdown, parsed into PPTX speaker notes
- **Live preview** — `slidesmith preview` starts an HTTP server with hot-reload
- **Open source** — MIT licensed, fully offline capable

---

## Quick Start

**No install needed** — `npx @slidesmith/cli` works out of the box.

```bash
# Create a new project
npx @slidesmith/cli init my-presentation
cd my-presentation

# Edit deck.md with your content, then build
npx @slidesmith/cli build deck.md -o my-deck.pptx
```

Or install globally:

```bash
npm install -g @slidesmith/cli

slidesmith init my-talk
cd my-talk
slidesmith build deck.md -o talk.pptx
```

---

## CLI Commands

### `slidesmith build <file>`

Build a PPTX presentation from a Markdown file.

```bash
# Basic usage
slidesmith build deck.md

# With options
slidesmith build deck.md \
  --theme warm-earth \
  --ratio 4:3 \
  --density breathing \
  --output my-deck.pptx \
  --title "My Talk" \
  --author "Jane Doe"

# Dry run (show outline without rendering)
slidesmith build deck.md --dry-run --verbose
```

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --theme <name>` | Theme name (`list-themes`) | `dark-tech` |
| `-o, --output <path>` | Output path | `output/deck.pptx` |
| `--ratio <16:9\|4:3>` | Slide aspect ratio | `16:9` |
| `--density <mode>` | Content density | `comfortable` |
| `--config <path>` | Path to config file | `./slidesmith.yaml` |
| `--dry-run` | Show outline without rendering | `false` |
| `--verbose` | Debug output | `false` |
| `--title <text>` | Presentation title | from markdown |
| `--author <text>` | Author name | — |

### `slidesmith generate <prompt>`

Generate slides from a text prompt using AI.

> **Note:** AI generation requires either a valid `OPENAI_API_KEY` (set via environment variable or `slidesmith.yaml`) for OpenAI, or a locally running Ollama server (`ollama serve`). See [Configuration](docs/configuration.md) for setup instructions.

```bash
# Using OpenAI (default) — requires OPENAI_API_KEY
slidesmith generate "3 slides about TypeScript for beginners"

# Using local Ollama — requires Ollama running on localhost:11434
slidesmith generate "5 slides on quantum computing" \
  --provider ollama \
  --model llama3.1

# Dry run (show outline without calling AI)
slidesmith generate "Quarterly review" --dry-run
```

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --provider <name>` | AI provider (`openai`, `ollama`) | config |
| `-m, --model <name>` | Model name | config |
| `-t, --theme <name>` | Theme name | `dark-tech` |
| `-o, --output <path>` | Output path | `output/deck.pptx` |
| `--dry-run` | Show outline without calling AI | `false` |
| `--verbose` | Debug output | `false` |
| `--slide-count <number>` | Number of slides | — |

### `slidesmith init [directory]`

Scaffold a new SlideSmith project with config file and example deck.

```bash
slidesmith init my-talk       # Create in ./my-talk
slidesmith init               # Scaffold in current directory
```

Creates:
- `slidesmith.yaml` — configuration file
- `deck.md` — example deck to get started
- `output/` — output directory

### `slidesmith preview <file>`

Start an HTTP preview server with hot-reload.

```bash
slidesmith preview deck.md          # Default port 3000
slidesmith preview deck.md --port 8080
```

### `slidesmith list-themes`

List all available themes.

```bash
slidesmith list-themes
```

---

## Configuration

SlideSmith reads `slidesmith.yaml` from the current directory. CLI flags override config file values, which override defaults.

```yaml
# slidesmith.yaml
theme: dark-tech
ratio: "16:9"
density: comfortable
output: output/deck.pptx
embedFonts: true

provider:
  provider: openai
  apiKey: "${OPENAI_API_KEY}"
  model: gpt-4o
```

See [Configuration Reference](docs/configuration.md) for the full schema.

---

## Creating Custom Themes

Themes are JSON files with color palettes, fonts, spacing, radii, and shadows. Create a `theme.json` and point to it:

```bash
slidesmith build deck.md --theme ./my-theme/theme.json
```

See [Themes Documentation](docs/themes.md) for the full theme schema and a guide to creating custom themes.

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Step-by-step from zero to first deck |
| [Themes](docs/themes.md) | Theme reference, customization, and creation |
| [Configuration](docs/configuration.md) | Full config file reference |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and PR process.

---

## License

MIT © [Dennis Ng](https://github.com/yonghuatrc)
