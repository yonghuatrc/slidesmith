import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SLIDESMITH_YAML_TEMPLATE = `# SlideSmith Configuration File
# See https://github.com/yonghuatrc/slidesmith for full documentation.

# Theme to use for presentations.
# Available: dark-tech, blue-white, warm-earth, minimal-clean, high-contrast.
# theme: dark-tech

# Aspect ratio: "16:9" or "4:3".
# ratio: "16:9"

# Content density: "compact", "comfortable", or "breathing".
# density: "comfortable"

# Default output path for generated PPTX files.
# output: "output/deck.pptx"

# Whether to embed fonts in the PPTX (larger file, renders correctly everywhere).
# embedFonts: true

# AI provider configuration (for slidesmith generate command).
# provider:
#   # Supported: openai, ollama (claude coming in Phase 2)
#   provider: openai
#   apiKey: "\${OPENAI_API_KEY}"  # Or use environment variable
#   model: "gpt-4o"
#
# Or for local Ollama:
# provider:
#   provider: ollama
#   baseUrl: "http://localhost:11434"
#   model: "llama3.1"
`;

const DECK_MD_TEMPLATE = `# My Presentation
## Author Name
> A brief subtitle or tagline for your presentation.

---

## Agenda

1. Introduction
2. Key Concepts
3. Data Overview
4. Implementation
5. Next Steps

---

## Introduction

This is an example presentation created with **SlideSmith**.

SlideSmith converts Markdown into professional PPTX presentations with:
- Multiple themes and layouts
- Code syntax highlighting
- Tables and charts
- Speaker notes

---

## Key Concepts

- **Markdown-first**: Write your content in Markdown, get a polished PPTX
- **Layout engine**: 8 layouts automatically chosen based on content
- **AI generation**: Optional AI-powered slide generation
- **Preview server**: Live preview while you edit

---

## Data Overview

| Metric | Value | Change |
|--------|-------|--------|
| Users | 12,847 | +18% |
| Revenue | $342K | +24% |
| Engagement | 87% | +5% |
| Retention | 94% | +2% |

---

## Code Example

Here's a sample TypeScript function:

\`\`\`typescript
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calculate first 10 Fibonacci numbers
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}
\`\`\`

---

## Architecture Overview

**Frontend Layer**
- React/TypeScript SPA
- State management with Zustand
- Tailwind CSS for styling

**Backend Layer**
- Node.js with Express
- PostgreSQL database
- Redis caching

**Infrastructure**
- Docker containers
- AWS ECS deployment
- CloudFront CDN
- CI/CD with GitHub Actions

> *"A well-architected system is one that balances simplicity with scalability."*
> — System Design Principles

---

## Two-Column Comparison

| **Approach A** | **Approach B** |
|---|---|
| Simpler implementation | More scalable |
| Monolithic deployment | Microservices |
| Single database | Sharded database |
| Lower initial cost | Higher initial cost |

---

## Speaker Notes Example

This slide shows how speaker notes work.

\`\`\`
Speaker notes are hidden from the audience
but visible to the presenter during the talk.
They can include:
- Key talking points
- Timing reminders
- Technical details to reference
\`\`\`

---

## Thank You

**Author Name**
- Email: author@example.com
- GitHub: github.com/author

Questions? Reach out anytime!
`;

export interface InitOptions {
  dir?: string;
}

export function executeInit(options: InitOptions = {}): void {
  const targetDir = options.dir ? resolve(process.cwd(), options.dir) : process.cwd();

  // Create directory if needed
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  // Write slidesmith.yaml
  const configPath = join(targetDir, 'slidesmith.yaml');
  if (!existsSync(configPath)) {
    writeFileSync(configPath, SLIDESMITH_YAML_TEMPLATE, 'utf-8');
    console.log(`  ✅ Created slidesmith.yaml`);
  } else {
    console.log(`  ⏭️  slidesmith.yaml already exists, skipping`);
  }

  // Write deck.md
  const deckPath = join(targetDir, 'deck.md');
  if (!existsSync(deckPath)) {
    writeFileSync(deckPath, DECK_MD_TEMPLATE, 'utf-8');
    console.log(`  ✅ Created deck.md`);
  } else {
    console.log(`  ⏭️  deck.md already exists, skipping`);
  }

  // Create output directory
  const outputDir = join(targetDir, 'output');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`  ✅ Created output/ directory`);
  } else {
    console.log(`  ⏭️  output/ directory already exists, skipping`);
  }

  console.log(`\n  🎉 SlideSmith project initialized in ${targetDir}\n`);
  console.log(`  Next steps:`);
  console.log(`    1. Edit deck.md with your content`);
  console.log(`    2. Run: slidesmith build deck.md`);
  console.log(`    3. Or preview: slidesmith preview deck.md\n`);
}
