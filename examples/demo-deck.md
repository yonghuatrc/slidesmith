# SlideSmith Demo

> A feature showcase — everything SlideSmith can do.

This deck demonstrates all the content types, layouts, and features supported by SlideSmith v0.1.0.

Run this deck yourself:

```bash
slidesmith build examples/demo-deck.md -o demo.pptx
```

---

## Features Overview

SlideSmith converts Markdown into professional PPTX presentations:

- **Markdown → PPTX** — No PowerPoint required
- **8 layouts** — Auto-selected based on content type
- **5 themes** — Switch with `--theme` flag
- **Code highlighting** — 20+ languages via shiki
- **Tables** — With alternating row colours
- **Speaker notes** — Hidden from audience, visible to presenter
- **AI generation** — Optional `slidesmith generate` command

NOTE: This is the opening content slide. Use it to set expectations for what the audience will learn.

---

## Quick Comparison

| Feature | Pandoc | Marp | SlideSmith |
|---------|--------|------|------------|
| PPTX output | Ugly | ❌ | ✅ Native |
| AI-powered | ❌ | ❌ | ✅ BYOK + Ollama |
| Syntax highlighting | Basic | Via plugin | ✅ 20 languages |
| Themes | ❌ | CSS custom | ✅ 5 built-in |
| Speaker notes | ❌ | ❌ | ✅ `NOTE:` syntax |
| Open source | ✅ GPL | ✅ MIT | ✅ MIT |

| | | |
|---|---|---|
| **File size** | ~2KB | `.pptx` ~50KB |
| **Build time** | ~0.3s | Per deck |
| **Dependencies** | Zero runtime | Node.js 18+ |

NOTE: The last three rows show the file size comparison with demo output.

---

## Code Example: TypeScript

Here's a strongly-typed function with generics:

```typescript
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchData<T>(
  url: string,
  options?: RequestInit
): Promise<Result<T>> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    const data = await response.json() as T;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
```

NOTE: Walk through the generic type parameter T and how it preserves type safety across the API call.

---

## Code Example: Python

SlideSmith also highlights Python, Rust, Go, and more:

```python
from dataclasses import dataclass
from typing import Optional


@dataclass
class Slide:
    title: str
    content: list[str]
    layout: str = "hero-top"
    notes: Optional[str] = None

    def render(self) -> str:
        lines = [f"# {self.title}", ""]
        for item in self.content:
            lines.append(f"- {item}")
        if self.notes:
            lines.append(f"\nNOTE: {self.notes}")
        return "\n".join(lines)
```

---

## Pull Quote

> "The best presentations are the ones you write in text. No fighting with alignment, no hunting for the right font size — just content that flows."
>
> — SlideSmith Philosophy

NOTE: Emphasise this quote during the talk. It captures the core value proposition.

---

## Two-Column Comparison: Before vs After

| **Before: PowerPoint** | **After: SlideSmith** |
|---|---|
| Manual formatting per slide | Write once, theme everywhere |
| Binary `.pptx` — no git diff | Plain text Markdown — full git history |
| Drag-and-drop alignment | Automatic layout engine |
| Copy-paste for consistency | Config-driven theming |
| Expensive licenses | Free, open source MIT |
| Slow to update decks | Rebuild in seconds |

---

## Architecture Overview

### Frontend Layer
- React / TypeScript single-page application
- State management with Zustand
- Tailwind CSS for rapid styling
- Vite for fast development builds

### Backend Layer
- Node.js with Express framework
- PostgreSQL for persistent storage
- Redis for caching and rate limiting
- RabbitMQ for async job processing

### Infrastructure
- Docker containers deployed on Kubernetes
- CI/CD pipeline with GitHub Actions
- CloudFront CDN for global distribution
- Prometheus + Grafana for monitoring

---

## Section Divider

# Next Steps

---

## What's Next

1. **Try it yourself**
   ```bash
   npx @slidesmith/cli init my-talk
   cd my-talk
   npx @slidesmith/cli build deck.md -o my-talk.pptx
   ```

2. **Explore themes**
   ```bash
   npx @slidesmith/cli build deck.md --theme warm-earth
   npx @slidesmith/cli list-themes
   ```

3. **Generate with AI**
   ```bash
   npx @slidesmith/cli generate \
     "5 slides on microservices architecture" \
     --provider ollama
   ```

4. **Live preview**
   ```bash
   npx @slidesmith/cli preview deck.md
   ```

NOTE: Timing suggestion — spend 30 seconds on each next step, then open for questions.

---

## Thank You

**SlideSmith v0.1.0**

- GitHub: [github.com/yonghuatrc/slidesmith](https://github.com/yonghuatrc/slidesmith)
- License: MIT
- Built with ❤️ for people who think in text

> "Presentations should be written, not designed."
