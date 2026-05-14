# Contributing to SlideSmith

Thank you for considering contributing to SlideSmith! This document outlines the development workflow, code standards, and how to add new themes, layouts, and block types.

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm 9+
- [pnpm](https://pnpm.io/installation) (npm install -g pnpm)

### Clone and Install

```bash
git clone https://github.com/yonghuatrc/slidesmith.git
cd slidesmith
pnpm install
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests (vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Lint all TypeScript source files |
| `pnpm format` | Format code with Prettier |

### Project Structure

```
slidesmith/
├── packages/
│   ├── cli/              # Publishable npm wrapper (@slidesmith/cli)
│   ├── content-model/    # Shared types + Zod validation (zero dependencies)
│   ├── core/             # CLI, config, parser, preview server
│   ├── renderer/         # PPTX rendering engine (pptxgenjs)
│   ├── ai/               # AI provider abstraction (OpenAI, Ollama)
│   └── themes/           # Theme definitions + loader
├── tests/
│   ├── e2e/              # End-to-end tests
│   └── fixtures/         # Markdown test fixtures
└── docs/                 # Documentation
```

---

## Code Style

- **Language:** TypeScript (strict mode)
- **Linter:** ESLint with `@typescript-eslint` rules
- **Formatter:** Prettier (default config in `.prettierrc`)
- **Module system:** ESM (`"type": "module"` in all packages)
- **No `any`** — use proper types. If you must escape, add a comment explaining why.
- **Async/await** over raw promises. Prefer `for...of` over `.forEach()` for async loops.
- **Error handling** — throw `SlideSmithError` with typed error codes (see DESIGN.md section 3).
- **No TODOs, FIXMEs, or HACKs** in committed code.

Run lint and tests before pushing:

```bash
pnpm lint
pnpm test
pnpm build
```

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
```

### Types

| Type | Usage |
|------|-------|
| `feat:` | New feature for the user |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `chore:` | Build tasks, tooling, CI |
| `refactor:` | Code refactoring (no behaviour change) |
| `test:` | Adding or updating tests |
| `style:` | Code style changes (formatting, linting) |

### Examples

```
feat: add three-column layout for data-heavy slides
fix: handle empty markdown input gracefully
docs: add getting-started guide with AI generation example
test: add edge case tests for overflow handling
refactor: extract density spacing logic into shared utility
```

---

## Pull Request Process

1. **Branch from `main`** — create a feature branch:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Write tests first** (where practical) — we follow TDD:
   - Unit tests in `packages/*/src/__tests__/`
   - E2E tests in `tests/e2e/`
   - Test fixtures in `tests/fixtures/`

3. **Implement your change** — keep commits small and focused.

4. **Verify everything passes:**
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```

5. **Push and open a PR** against `main`:
   ```bash
   git push -u origin feat/my-feature
   ```

6. **PR description** — include:
   - What problem this solves
   - How you tested it
   - Screenshots for visual changes (if applicable)
   - Link to related issue (if any)

7. **CI checks** must pass before merge. A maintainer will review and merge.

---

## How to Add a New Theme

1. Create `packages/themes/<theme-name>/theme.json` with the full schema:

```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "description": "Description of the theme's mood and use case",
  "author": "Your Name",
  "colors": {
    "background": "#...",
    "surface": "#...",
    "text": "#...",
    "textMuted": "#...",
    "accent": "#...",
    "accent2": "#...",
    "border": "#...",
    "error": "#..."
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

2. Import and register the theme in `packages/themes/src/loader.ts`:
   - Add the import at the top
   - Add it to the `themeMap` object

3. Add tests in `packages/themes/src/__tests__/themes.test.ts`:
   - Test that the theme loads without validation errors
   - Test that `listThemes()` includes the new theme

4. Update `docs/themes.md` with the new theme entry

5. Run `pnpm test && pnpm build` to verify

---

## How to Add a New Layout

1. Create the layout file in `packages/renderer/src/layouts/<name>.ts`
2. Define zones with type affinity rules (see DESIGN.md section 7 for the algorithm)
3. Register the layout in `packages/renderer/src/layouts/registry.ts`
4. Add the layout name to each theme's `layouts` array in their `theme.json`
5. Add tests in `packages/renderer/src/__tests__/`
6. Update `docs/themes.md` layout compatibility table

### Layout Interface

```typescript
interface LayoutDefinition {
  name: string;
  zones: ZoneDefinition[];
  assignBlocks(blocks: Block[]): ZoneAssignment[];
}
```

See existing layouts in `packages/renderer/src/layouts/` for reference patterns.

---

## How to Add a New Block Type

1. Define the block type in `packages/content-model/src/types.ts`
2. Add validation in `packages/content-model/src/validator.ts`
3. Create a renderer in `packages/renderer/src/blocks/<name>-block.ts`
4. Export from `packages/renderer/src/blocks/index.ts`
5. Wire it into `packages/renderer/src/engine/slide-builder.ts`
6. Update the AI system prompt in `packages/ai/src/prompt/system-prompt.ts`
7. Add tests for all three layers (content-model, renderer, and e2e)

---

## Testing Guidelines

- **Unit tests** live next to source code in `__tests__/` directories
- **E2E tests** live in `tests/e2e/`
- **Test fixtures** (markdown files) live in `tests/fixtures/`
- Name tests clearly: `describe('Layout: hero-top') / it('renders title and subtitle in header zone')`
- Test error cases: empty input, invalid config, missing files
- For visual tests, assert ContentModel structure rather than raw PPTX bytes

---

## Getting Help

- Open a [GitHub issue](https://github.com/yonghuatrc/slidesmith/issues)
- Check existing documentation in `docs/` and `DESIGN.md`
- Ask in the PR comments for review guidance
