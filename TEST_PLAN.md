# SlideSmith Test Plan

> **Status**: Pre-implementation · **Last updated**: 2026-05-12 · **Version**: v0.1 (planned)

---

## 1. Unit Test Categories

### ContentModel Validation
- [ ] Valid ContentModel → `validate()` returns success
- [ ] Missing required fields → correct `ERR_*` code
- [ ] Empty slides array → warning
- [ ] Layout type not in allowed set → validation error
- [ ] QuoteBlock with empty text → validation error
- [ ] TwoColumnBlock with mismatched items length → passes (valid)

### Markdown Parser (slide segmentation)
- [ ] `---` forces slide boundary
- [ ] `##` heading starts new slide when no `---`
- [ ] Leading content before first `---` or `##` → title slide
- [ ] Multiple `---` in a row → warning + skip empty slides
- [ ] No `---` and no `##` → single slide with all content
- [ ] Mixed `---` and `##` → correct grouping per segmentation rules
- [ ] `NOTE:` line → speakerNotes field, not slide content
- [ ] Code blocks with backticks → CodeBlock with correct language
- [ ] Tables → TableBlock with headers and rows
- [ ] Images (local/URL/base64) → ImageBlock with correct src
- [ ] Nested lists → flattened list items
- [ ] Bold/italic/inline code in text → stripped or passed through

### Layout Engine (block distribution)
- [ ] Cover: header zone gets h1, body gets rest, subtitle applied
- [ ] Hero-top: header zone gets h1/h2, body gets everything else
- [ ] Three-column: 3 equal columns with header bar
- [ ] Symmetric: text left, image right
- [ ] Waterfall: sections stack vertically
- [ ] Comparison: two columns with headers
- [ ] Quote: quote zone gets QuoteBlock, attribution rendered
- [ ] Section-divider: background applied, title centered
- [ ] Overflow (compact): font size shrinks
- [ ] Overflow (comfortable): truncate + warning emitted
- [ ] Overflow (breathing): content split across slides
- [ ] Empty zone → hidden gracefully (no crash)
- [ ] Zone with no matching blocks → empty zone hidden

### Theme System
- [ ] All 5 themes load and validate against schema
- [ ] Missing color → default fallback applied
- [ ] Invalid type for color value → ERR_THEME_* error
- [ ] Font specified but not installed/available → font stack fallback
- [ ] Density mode spacing overrides applied correctly
- [ ] WCAG AA contrast: every text/background pair ≥ 4.5:1
- [ ] Bad theme.json path → ERR_THEME_NOT_FOUND error

### AI Provider System
- [ ] Factory returns correct provider by config shape
- [ ] OpenAI: `response_format: json_object` handled correctly
- [ ] Ollama: code fences stripped, trailing text removed
- [ ] Ollama: JSON5 lenient parse works for edge cases
- [ ] Retry count differs: OpenAI=2, Ollama=4
- [ ] Backoff timing: 1s, 2s, 4s, 8s (Ollama); 1s, 2s (OpenAI)
- [ ] All providers return `ContentModel` type
- [ ] Provider timeout → AbortSignal respected

---

## 2. CLI Integration Tests

### `slidesmith build`
- [ ] `slidesmith build tests/fixtures/basic-deck.md` → exits 0, writes `.pptx`
- [ ] `slidesmith build nonexistent.md` → ERR_IO_FILE_NOT_FOUND, exits 1
- [ ] `-o` / `--output` flag overrides output path
- [ ] `--theme dark-tech` applies dark-tech theme (verify via XML snapshot)
- [ ] `--ratio 4:3` produces 4:3 slide dimensions in PPTX
- [ ] `--density compact` applies compact spacing
- [ ] `--dry-run` prints slide summary, no file written
- [ ] `--verbose` includes debug output to stderr
- [ ] `--config slidesmith.custom.yaml` loads custom config
- [ ] `--config <path>` flag reads alternate config file → applies settings
- [ ] CLI flag overrides config file value (`--theme` CLI + config says `blue-white` → CLI wins)
- [ ] No config file → all defaults applied without error
- [ ] Invalid config file → ERR_CONFIG_INVALID with clear message
- [ ] Partial config file → missing keys fall back to defaults
- [ ] Empty `.md` file → ERR_PARSER_EMPTY_INPUT
- [ ] `.md` with only `---` lines → warning, no slides
- [ ] Concurrent builds to same output → handled gracefully

### `slidesmith generate`
- [ ] `slidesmith generate "3 slides" --provider openai` → exits 0, writes `.pptx`
- [ ] `slidesmith generate "3 slides" --provider ollama` → exits 0 (with Ollama running)
- [ ] `--dry-run` shows estimated slides + tokens, no API call made
- [ ] `--provider invalid` → clear error listing valid providers
- [ ] OpenAI API key missing → ERR_CONFIG_MISSING_KEY
- [ ] Ollama not running → ERR_AI_PROVIDER_FAIL with readable message
- [ ] `--model` flag overrides default model per provider
- [ ] Progress output written to stderr during generation
- [ ] Abort via Ctrl+C → clean exit

### `slidesmith init`
- [ ] `slidesmith init my-deck` → creates my-deck/ with config + example .md
- [ ] `slidesmith init` without name → creates in current directory
- [ ] Target directory exists → prompt or `--force` to overwrite
- [ ] Generated `slidesmith.config.yaml` loads without error

### `slidesmith preview`
- [ ] `slidesmith preview deck.md` → starts HTTP server (default port)
- [ ] `--port` flag overrides default port
- [ ] Hot-reload triggers on .md file save
- [ ] No source file argument → clear error
- [ ] Server responds with HTML page containing slide previews

### `slidesmith list-themes`
- [ ] Lists all 5 themes with name + description
- [ ] Output formatted as table for readability

---

## 3. PPTX Output Validation

- [ ] Output file is valid ZIP (`file` command → "Zip archive data")
- [ ] Contains `[Content_Types].xml`, `ppt/presentation.xml`, `ppt/slides/`
- [ ] Slide count matches expected count from input
- [ ] Speaker notes present in `ppt/notesSlides/` (when present in MD)
- [ ] Speaker notes absent when no NOTE: lines
- [ ] Images embedded (not linked) in `ppt/media/`
- [ ] Fonts embedded (when `--embed` is default)
- [ ] Theme colors match theme.json hex values (check theme XML)
- [ ] Correct aspect ratio (16:9 = 12800 × 7200 EMU, 4:3 = 10000 × 7500 EMU)
- [ ] Slide dimensions: 12800 × 7200 EMU (16:9) or 10000 × 7500 EMU (4:3)

---

## 4. AI Provider Mocking

### OpenAI
- [ ] Valid ContentModel JSON returned → parsed successfully
- [ ] JSON with extra fields → extra fields stripped, not rejected
- [ ] Non-JSON response → retry (max 2), then ERR_AI_INVALID_RESPONSE
- [ ] HTTP 401 → ERR_AI_PROVIDER_FAIL with auth hint
- [ ] HTTP 429 (rate limit) → retry with backoff
- [ ] Empty response → covered by non-JSON retry path

### Ollama
- [ ] Valid JSON returned → parsed successfully
- [ ] JSON wrapped in ``` `` ```json ``` `` ``` fences → stripped, parsed
- [ ] JSON wrapped in ``` `` ``` ``` `` ``` fences → stripped, parsed
- [ ] Trailing text after closing `}` → stripped, parsed
- [ ] Non-JSON response → retry (max 4), then ERR_AI_INVALID_RESPONSE
- [ ] Connection refused (Ollama not running) → clear error
- [ ] Small model (7B) slow response → timeout handling

---

## 5. Cross-Platform Rendering (Manual — Pre-Release)

Before v0.1.0 release, open test output in:

- [ ] **PowerPoint (Windows)** — fonts, colours, tables, code blocks
- [ ] **PowerPoint (Mac)** — fonts, colours, tables, code blocks
- [ ] **Google Slides** — layout shift, missing features
- [ ] **LibreOffice Impress** — layout shift, missing features
- [ ] **Keynote** — layout shift, missing features

Check for each platform:
- All fonts render correctly (Inter, JetBrains Mono)
- Slide background colours match theme
- Tables have correct column widths and alternating row colours
- Code blocks show monospace text with coloured tokens
- Images display with correct aspect ratio
- Slide dimensions respect --ratio flag
- Speaker notes accessible in presenter view

---

## 6. Error Path Checklist

| Error Code | How to Trigger | Expected Behaviour |
|------------|----------------|-------------------|
| `ERR_PARSER_EMPTY_INPUT` | Build empty .md file | Clear error: "No slides found" |
| `ERR_PARSER_INVALID_MD` | Unparseable markdown | Error with file + line number |
| `ERR_RENDERER_LAYOUT_FAIL` | Unknown layout type in ContentModel | Error: "Unknown layout: X" |
| `ERR_AI_PROVIDER_FAIL` | API returns 500 / connection timeout | Error: "Provider X failed: {reason}" |
| `ERR_AI_INVALID_RESPONSE` | LLM returns non-JSON (max retries) | Error with raw response for debugging |
| `ERR_AI_RATE_LIMITED` | 429 from provider | Error: "Rate limited. Wait X seconds." |
| `ERR_CONFIG_MISSING_KEY` | Provider selected but no API key | Error: "Missing API key for X. Set {ENV_VAR}" |
| `ERR_THEME_NOT_FOUND` | `--theme nonexistent` | Error with list of available themes |
| `ERR_THEME_VALIDATION` | Invalid theme.json | Error with path + validation details |
| `ERR_IO_FILE_NOT_FOUND` | Input .md file doesn't exist | Error: "File not found: {path}" |
| `ERR_IO_PERMISSION_DENIED` | Can't write to output dir | Error: "Cannot write to {path}. Check permissions." |
| `ERR_FONT_DOWNLOAD_FAIL` | Can't download Google Fonts | Warning + fallback to system fonts |
| `ERR_CONFIG_INVALID` | Malformed `slidesmith.yaml` | Error with line + column of parse failure |
| `ERR_CONFIG_PARSE` | YAML parse failure | Error with YAML parser message |

---

## 7. Test Fixture Inventory

| Fixture File | Purpose |
|-------------|---------|
| `tests/fixtures/basic-deck.md` | 3 slides: title, content, table. All block types. |
| `tests/fixtures/complex-deck.md` | 10+ slides, all 8 layouts, all block types, speaker notes |
| `tests/fixtures/empty-deck.md` | Empty file (0 bytes) |
| `tests/fixtures/dividers-only.md` | Only `---` lines |
| `tests/fixtures/no-dividers.md` | No `---`, only `##` headings |
| `tests/fixtures/images-deck.md` | Slides with local image, URL image, base64 image |
| `tests/fixtures/code-heavy.md` | Multiple code blocks in various languages |
| `tests/fixtures/overflow-deck.md` | Text that exceeds slide capacity |
| `tests/fixtures/malformed.md` | Malformed markdown |

---

## 8. Golden Test

Must pass before any release:

```
Input: tests/fixtures/basic-deck.md
Command: slidesmith build tests/fixtures/basic-deck.md -o /tmp/test.pptx
Assert:
  1. Exit code 0
  2. /tmp/test.pptx exists
  3. `unzip -l /tmp/test.pptx` contains "ppt/slides/slide1.xml"
  4. `unzip -l /tmp/test.pptx` contains "ppt/slides/slide2.xml"
  5. `unzip -l /tmp/test.pptx` contains "ppt/slides/slide3.xml"
  6. XML content contains expected theme colors
```

Also verify structural validity (can be CI'd):
```bash
soffice --headless --convert-to pdf /tmp/test.pptx
# exit code 0 = structurally valid
```
