# Getting Started with SlideSmith

This guide walks you from zero to your first presentation in under 5 minutes.

---

## 1. Install

**No install needed.** Run SlideSmith directly with `npx`:

```bash
npx @slidesmith/cli --help
```

Or install globally if you prefer:

```bash
npm install -g @slidesmith/cli

# Verify it works
slidesmith --version
# → 0.1.0
```

**Prerequisites:** Node.js 18+ and npm 9+.

---

## 2. Create a Project

Scaffold a new SlideSmith project with an example deck and configuration:

```bash
npx @slidesmith/cli init my-first-talk
cd my-first-talk
```

This creates:

```
my-first-talk/
├── slidesmith.yaml     # Configuration file
├── deck.md             # Example markdown deck
└── output/             # Output directory for generated PPTX files
```

---

## 3. Write Your Deck

Open `deck.md` in your editor. SlideSmith uses **Markdown** with a few conventions:

### Slide Boundaries

| Rule | Example | Behaviour |
|------|---------|-----------|
| **Explicit** | `---` on its own line | Forces a new slide |
| **Implicit** | `## Heading` (level 2+) | Starts a new slide when `---` is absent |

### Supported Content

| Markdown | Renders As |
|----------|-----------|
| `# Title` / `## Section` | Slide headings |
| `- bullet` / `1. list` | Bullet / ordered lists |
| `**bold**`, `*italic*`, `` `code` `` | Inline formatting |
| `` ```typescript ... ``` `` | Syntax-highlighted code block |
| `\| Col1 \| Col2 \|` | Table with headers |
| `> Quote` | Pull quote |
| `---` | Explicit slide boundary |
| `NOTE: text` | Speaker notes (invisible to audience) |

### Example Deck

```markdown
# My Presentation
## Subtitle or tagline

---

## Agenda

1. Introduction
2. Key Concepts
3. Next Steps

---

## Key Concepts

- **Markdown-first**: Write in Markdown, get polished PPTX
- **8 layouts**: Auto-selected based on content type
- **5 themes**: Switch themes without editing content

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| AI Generation | ✅ |
| Themes | ✅ |

---

## Code Example

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

NOTE: Walk through the function signature and return type.

---

## Closing Thoughts

> "The best presentations are the ones you write in text."
> — SlideSmith

Thank you!
```

---

## 4. Build Your Presentation

Generate a PPTX file from your Markdown:

```bash
npx @slidesmith/cli build deck.md -o my-talk.pptx
```

You'll see output like:

```
Building: deck.md
Theme: dark-tech
Layouts: [cover, hero-top, three-column, comparison, code, quote]
Output: my-talk.pptx (12 slides)
✅ Presentation built successfully!
```

Open `my-talk.pptx` in PowerPoint, Google Slides, Keynote, or LibreOffice.

---

## 5. Preview While You Edit

Start the live preview server to see changes as you type:

```bash
npx @slidesmith/cli preview deck.md
```

Open `http://localhost:3000` in your browser. The preview updates automatically when you save `deck.md`.

Press `Ctrl+C` to stop the server.

---

## 6. Generate Slides with AI

Let AI create slides from a text description:

```bash
# Using OpenAI (requires API key in slidesmith.yaml or OPENAI_API_KEY env var)
npx @slidesmith/cli generate "3 slides about TypeScript for beginners"

# Using local Ollama
npx @slidesmith/cli generate "5 slides on quantum computing" \
  --provider ollama \
  --model llama3.1
```

**Before you generate:** Run a dry run to see what the AI will produce without spending tokens:

```bash
npx @slidesmith/cli generate "Quarterly review" --dry-run
```

---

## Next Steps

| Topic | Guide |
|-------|-------|
| Switch themes | [Themes Documentation](themes.md) |
| Configure defaults | [Configuration Reference](configuration.md) |
| Create custom themes | [Themes: Custom Themes](themes.md#creating-a-custom-theme) |
| All available layouts | See DESIGN.md section 9 |
| Contribute | [CONTRIBUTING.md](../CONTRIBUTING.md) |
