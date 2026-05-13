# SlideSmith Configuration Reference

SlideSmith is configured via a YAML file (`slidesmith.yaml`) placed in the project root directory. CLI flags override config file values, which override built-in defaults.

---

## Config File Location

SlideSmith looks for `slidesmith.yaml` in this order:

1. **`--config <path>` flag** — explicit path via CLI
2. **Current working directory** — `./slidesmith.yaml`
3. **Defaults** — no config file needed; built-in defaults apply

---

## Full Schema

```yaml
# SlideSmith Configuration v0.1.0
# See https://github.com/yonghuatrc/slidesmith for full documentation.

# ── General Settings ───────────────────────────────────────────

# Theme to use for presentations.
# Run `slidesmith list-themes` to see available options.
# Type: string
# Default: "dark-tech"
theme: dark-tech

# Slide aspect ratio.
# Type: "16:9" | "4:3"
# Default: "16:9"
ratio: "16:9"

# Content density controls spacing throughout the slide.
# Type: "compact" | "comfortable" | "breathing"
# Default: "comfortable"
density: comfortable

# Default output path for generated PPTX files.
# Type: string
# Default: "output/deck.pptx"
output: output/deck.pptx

# Whether to embed Google Fonts in the PPTX file.
# Embedding ensures correct rendering on any system but increases file size ~300KB per weight.
# Type: boolean
# Default: true
embedFonts: true

# ── AI Provider (for `slidesmith generate`) ────────────────────

# provider:
#   # ── OpenAI ──────────────────────────────────────────────
#   # Requires an API key. Set via config or OPENAI_API_KEY env var.
#   provider: openai
#   apiKey: "sk-..."              # Or set OPENAI_API_KEY environment variable
#   model: "gpt-4o"               # Optional, default: gpt-4o
#   # organization: "org-..."     # Optional, for org-level API keys
#
#   # ── Ollama (local) ──────────────────────────────────────
#   # Runs entirely offline. Requires Ollama server running locally.
#   # provider: ollama
#   # baseUrl: "http://localhost:11434"   # Optional, default: http://localhost:11434
#   # model: "llama3.1"                   # Optional, default: llama3.1
```

---

## Field Reference

### General Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | `string` | `"dark-tech"` | Theme name. Run `slidesmith list-themes` for available themes. Can also be a path to a custom `theme.json` file. |
| `ratio` | `"16:9"` \| `"4:3"` | `"16:9"` | Slide aspect ratio. 16:9 is the widescreen standard. 4:3 is the legacy format. |
| `density` | `"compact"` \| `"comfortable"` \| `"breathing"` | `"comfortable"` | Content density mode. Controls padding, gaps, and spacing throughout slides. |
| `output` | `string` | `"output/deck.pptx"` | Default output path for generated PPTX files. Can be overridden with `--output` flag. |
| `embedFonts` | `boolean` | `true` | Embed Google Fonts (Inter, JetBrains Mono) into the PPTX. When `true`, fonts render correctly on any system but file size increases. Set to `false` to use font-stack fallbacks instead. |

### Density Modes

| Mode | Padding | Block Gap | Use Case |
|------|:-------:|:---------:|----------|
| `compact` | 24pt | 8pt | Data-heavy slides, many bullet points, code |
| `comfortable` | 36pt | 14pt | General presentations (default) |
| `breathing` | 48pt | 20pt | Keynotes, pitch decks, storytelling |

### AI Provider

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `provider.provider` | `"openai"` \| `"ollama"` | ✅ | AI provider to use for `slidesmith generate` |
| `provider.apiKey` | `string` | for openai | OpenAI API key. Can also be set via `OPENAI_API_KEY` environment variable. |
| `provider.model` | `string` | ❌ | Model name. Default: `gpt-4o` (OpenAI) or `llama3.1` (Ollama) |
| `provider.organization` | `string` | ❌ | OpenAI organization ID (for org-level API keys) |
| `provider.baseUrl` | `string` | ❌ | Ollama base URL. Default: `http://localhost:11434` |

#### Provider Notes

**OpenAI:**
- Requires a valid API key with access to `gpt-4o` or your chosen model
- API key can be set in config file or via `OPENAI_API_KEY` environment variable
- Recommended model: `gpt-4o` for best slide generation quality
- Uses JSON mode + structured outputs for reliable ContentModel generation

**Ollama:**
- Runs completely offline — no data leaves your machine
- Requires Ollama server running locally (`ollama serve`)
- Recommended models: `llama3.1:70b` or `qwen2.5:32b` for best results
- Smaller models (< 7B parameters) may produce invalid JSON
- Includes automatic retry (up to 4 times), JSON5 fallback parsing, and code fence stripping

---

## Config Priority

Configuration is resolved in this order (higher priority overrides lower):

```
1. CLI flags         ─── highest priority
2. Config file       ─── slidesmith.yaml
3. Built-in defaults ─── lowest priority
```

**Rule:** CLI flags use `??` (nullish coalescing) — they only override when explicitly provided:

```
CLI flag ?? config file value ?? default value
```

### Examples

| CLI Command | Config File | Effective Value |
|-------------|-------------|-----------------|
| `--theme warm-earth` | `theme: dark-tech` | `warm-earth` (CLI wins) |
| *(no flag)* | `theme: blue-white` | `blue-white` (config wins) |
| *(no flag)* | *(no config)* | `dark-tech` (default wins) |

---

## Environment Variables

| Variable | Provider | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | openai | OpenAI API key (alternative to config file) |

---

## Example Configurations

### Minimal (all defaults)

```yaml
# Just use defaults for everything
```

### Corporate Deck with OpenAI

```yaml
theme: blue-white
ratio: "16:9"
density: comfortable
embedFonts: true

provider:
  provider: openai
  apiKey: "${OPENAI_API_KEY}"
  model: gpt-4o
```

### Offline with Ollama

```yaml
theme: high-contrast
ratio: "4:3"
density: compact
embedFonts: false

provider:
  provider: ollama
  baseUrl: "http://localhost:11434"
  model: llama3.1
```

### Large Venue Keynote

```yaml
theme: high-contrast
ratio: "16:9"
density: breathing
embedFonts: true
```

---

## Config File in `slidesmith init`

When you run `slidesmith init`, the generated `slidesmith.yaml` contains all fields commented out with their defaults shown. Uncomment and set values to customize:

```yaml
# Theme to use for presentations.
# Available: dark-tech, blue-white, warm-earth, minimal-clean, high-contrast.
# theme: dark-tech

# Aspect ratio: "16:9" or "4:3".
# ratio: "16:9"

# Content density: "compact", "comfortable", or "breathing".
# density: "comfortable"
```

---

## Schema Validation

Configuration is validated with Zod at runtime. Invalid values produce clear error messages:

```
Error: ERR_CONFIG_VALIDATION: Invalid configuration:
  - density: Invalid enum value. Expected 'compact' | 'comfortable' | 'breathing', received 'spacious'
```
