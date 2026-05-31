# Session Context — SlideSmith

> Shared state for SlideSmith sessions. Read at session start.

## Current Task

SlideSmith — CLI tool that generates professional `.pptx` presentations from Markdown or natural language prompts.

**Status:** v0.1.0 implemented. Tests needed for validation, parsing, layout distribution.
**Next:** Complete unit tests for first 3 areas from TEST_PLAN.md.

## Active Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Language | TypeScript monorepo (pnpm workspaces) |
| 2 | Bundler | esbuild |
| 3 | Test runner | vitest |
| 4 | PPTX engine | pptxgenjs |
| 5 | AI providers | OpenAI + Ollama (BYOK), Claude deferred to Phase 2 |
| 6 | Input modes | Markdown → PPTX, AI → PPTX, scaffold + preview |
| 7 | Design system | 5 themes, 8 layouts, 3 density modes |
| 8 | Positioning | "The presentation tool for people who think in text" |
| 9 | Output | Native PPTX, git-diffable text input |
| 10 | License | MIT |

## Project Structure

```
D:\Hermes\Project\SlideSmith\
├── packages/
│   ├── ai/              # Provider factory, OpenAI, Ollama, prompts, schema
│   ├── cli/             # CLI entry point
│   ├── content-model/   # Types, validator, Zod schemas
│   ├── core/            # Build command, generate command, init, config, parser
│   ├── renderer/        # Layout engine, distributor, pptxgenjs renderer
│   └── themes/          # 5 themes with design tokens
├── tests/
│   ├── fixtures/        # Test markdown fixtures
│   └── e2e/             # End-to-end golden tests
├── docs/                # Configuration, getting started, themes
├── examples/            # demo-deck.md
└── output/              # Generated deck.pptx
```

## Key Files

| File | Purpose |
|------|---------|
| `DESIGN.md` | Full design document (830 lines) |
| `TEST_PLAN.md` | Test plan with 240+ test cases (most unchecked) |
| `CLAUDE.md` | Karpathy coding principles |
| `docs/getting-started.md` | User-facing CLI docs |

## Immediate Next Steps

| Priority | Task | Files |
|----------|------|-------|
| 1 | Complete ContentModel validation tests (6 tests → 12) | `packages/content-model/src/__tests__/validator.test.ts` |
| 2 | Complete Markdown parser tests (12 tests → 25) | `packages/core/src/__tests__/parser.test.ts` |
| 3 | Complete Layout engine tests (14 tests → 25) | `packages/renderer/src/__tests__/distributor.test.ts` |

## Related

- Owner: Dennis Ng (Boss)
- GitHub: yonghuatrc
- Session started: 2026-05-14
- Last session: ManggoMusicCH project (separate repo)
