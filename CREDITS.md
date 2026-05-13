# Credits

SlideSmith builds on the work of many open-source projects and design concepts. We are grateful for their contributions.

---

## Design Inspiration

- **ppt-agent-skills** — The design system concepts (layout zones, density modes, color tokens, and theme structure) are adapted from ppt-agent-skills. This project provided the foundational thinking for how a CLI-first presentation tool should handle layout, spacing, and theming. Thank you to the team behind ppt-agent-skills for the inspiration.

---

## Libraries & Tools

### pptxgenjs
Native JavaScript PPTX generation library that powers SlideSmith's rendering engine.
- https://github.com/gitbrent/PptxGenJS
- License: MIT

### shiki
Syntax highlighting engine used for code blocks in presentations. Supports 20+ languages out of the box.
- https://shiki.style/
- License: MIT

### remark / remark-parse / remark-gfm / mdast-util-from-markdown
Markdown parsing pipeline. These libraries form the foundation of SlideSmith's Markdown → PPTX conversion.
- https://remark.js.org/
- License: MIT

### Zod
Schema validation library used to validate ContentModel, configuration, and theme files.
- https://zod.dev/
- License: MIT

### commander.js
CLI framework powering the `slidesmith` command-line interface.
- https://github.com/tj/commander.js
- License: MIT

### unified
Content processing ecosystem that remark is built upon.
- https://unifiedjs.com/
- License: MIT

### js-yaml
YAML parser for reading `slidesmith.yaml` configuration files.
- https://github.com/nodeca/js-yaml
- License: MIT

### Google Fonts (Inter, JetBrains Mono)
Open-source typefaces used as the default fonts in all SlideSmith themes.
- https://fonts.google.com/
- License: Open Font License (OFL)

### node-canvas
Server-side canvas implementation used for text measurement.
- https://github.com/Automattic/node-canvas
- License: MIT

### Vitest
Unit test framework used across all packages.
- https://vitest.dev/
- License: MIT

### esbuild
JavaScript bundler used for building the CLI executable.
- https://esbuild.github.io/
- License: MIT

### TypeScript
The language SlideSmith is written in.
- https://www.typescriptlang.org/
- License: Apache 2.0

---

## Inspiration from Alternative Tools

- **Marp** (https://marp.app/) — MD → HTML/PDF slides. The `---` slide boundary convention is borrowed from Marp.
- **Slidev** (https://sli.dev/) — Vue-powered slide decks. Inspired the preview server concept.
- **Pandoc** (https://pandoc.org/) — The universal document converter that showed MD → PPTX is possible.
- **Hugo / Zola** — Static site generators that inspired SlideSmith's "content-first, output-second" philosophy.
- **Gamma.app** and **Beautiful.ai** — Commercial AI presentation tools that demonstrated the market need.
- **python-pptx** (https://python-pptx.readthedocs.io/) — Python PPTX library that proved native PPTX generation is viable.

---

## Maintained By

SlideSmith is created and maintained by **Dennis Ng** ([@yonghuatrc](https://github.com/yonghuatrc)).

---

*If we've missed an attribution, please open an issue or PR and we'll add it promptly.*
