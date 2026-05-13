# SlideSmith Themes

SlideSmith ships with **5 built-in themes**, each with a distinct colour palette, typography, spacing, and shadow system. Themes are defined as JSON files in `packages/themes/`.

---

## Built-in Themes

### dark-tech

| | Value |
|---|-------|
| **Description** | Dark theme for tech presentations with blue accent |
| **Mood** | Modern, technical, focused |
| **Best for** | Developer talks, tech conferences, product demos |
| **Colors** | ![#0D1117](https://via.placeholder.com/16/0D1117/000000?text=+) `#0D1117` bg · ![#58A6FF](https://via.placeholder.com/16/58A6FF/000000?text=+) `#58A6FF` accent · ![#3FB950](https://via.placeholder.com/16/3FB950/000000?text=+) `#3FB950` accent2 |

```
background: #0D1117    surface:    #161B22    border:     #30363D
text:       #E6EDF3    textMuted:  #8B949E    error:      #F85149
accent:     #58A6FF    accent2:    #3FB950
```

![Screenshot placeholder](https://via.placeholder.com/720x405/0D1117/58A6FF?text=dark-tech+theme)

---

### blue-white

| | Value |
|---|-------|
| **Description** | Clean corporate theme with blue accent |
| **Mood** | Professional, clean, trustworthy |
| **Best for** | Corporate decks, academic presentations, internal meetings |
| **Colors** | ![#FFFFFF](https://via.placeholder.com/16/FFFFFF/000000?text=+) `#FFFFFF` bg · ![#1A73E8](https://via.placeholder.com/16/1A73E8/000000?text=+) `#1A73E8` accent · ![#34A853](https://via.placeholder.com/16/34A853/000000?text=+) `#34A853` accent2 |

```
background: #FFFFFF    surface:    #F8F9FA    border:     #DADCE0
text:       #202124    textMuted:  #5F6368    error:      #D93025
accent:     #1A73E8    accent2:    #34A853
```

![Screenshot placeholder](https://via.placeholder.com/720x405/FFFFFF/1A73E8?text=blue-white+theme)

---

### warm-earth

| | Value |
|---|-------|
| **Description** | Warm organic theme for storytelling and design reviews |
| **Mood** | Warm, organic, approachable |
| **Best for** | Storytelling, design reviews, creative presentations |
| **Colors** | ![#FFF8F0](https://via.placeholder.com/16/FFF8F0/000000?text=+) `#FFF8F0` bg · ![#FF8F00](https://via.placeholder.com/16/FF8F00/000000?text=+) `#FF8F00` accent · ![#6D4C41](https://via.placeholder.com/16/6D4C41/000000?text=+) `#6D4C41` accent2 |

```
background: #FFF8F0    surface:    #FFF0E0    border:     #E0C9B6
text:       #5D4037    textMuted:  #8D6E63    error:      #C62828
accent:     #FF8F00    accent2:    #6D4C41
```

![Screenshot placeholder](https://via.placeholder.com/720x405/FFF8F0/FF8F00?text=warm-earth+theme)

---

### minimal-clean

| | Value |
|---|-------|
| **Description** | Minimal black and white theme for print and formal documents |
| **Mood** | Minimal, formal, print-ready |
| **Best for** | Print documents, formal submissions, accessibility-first |
| **Colors** | ![#FFFFFF](https://via.placeholder.com/16/FFFFFF/000000?text=+) `#FFFFFF` bg · ![#000000](https://via.placeholder.com/16/000000/000000?text=+) `#000000` accent · ![#333333](https://via.placeholder.com/16/333333/000000?text=+) `#333333` accent2 |

```
background: #FFFFFF    surface:    #FFFFFF    border:     #E0E0E0
text:       #000000    textMuted:  #666666    error:      #D32F2F
accent:     #000000    accent2:    #333333
```

![Screenshot placeholder](https://via.placeholder.com/720x405/FFFFFF/000000?text=minimal-clean+theme)

---

### high-contrast

| | Value |
|---|-------|
| **Description** | High contrast theme for accessibility and projectors |
| **Mood** | Bold, accessible, unambiguous |
| **Best for** | Accessibility-first, projector presentations, large rooms |
| **Colors** | ![#000000](https://via.placeholder.com/16/000000/000000?text=+) `#000000` bg · ![#FFD700](https://via.placeholder.com/16/FFD700/000000?text=+) `#FFD700` accent · ![#00FF00](https://via.placeholder.com/16/00FF00/000000?text=+) `#00FF00` accent2 |

```
background: #000000    surface:    #1A1A1A    border:     #FFFFFF
text:       #FFFFFF    textMuted:  #CCCCCC    error:      #FF4444
accent:     #FFD700    accent2:    #00FF00
```

![Screenshot placeholder](https://via.placeholder.com/720x405/000000/FFD700?text=high-contrast+theme)

---

## Theme Schema Reference

Every theme is a JSON file with this structure:

```jsonc
{
  "name": "dark-tech",                        // Theme name (used in CLI --theme)
  "version": "1.0.0",                         // Theme schema version
  "description": "Dark theme for tech...",    // Human-readable description
  "author": "SlideSmith",                     // Theme author

  "colors": { /* see below */ },
  "fonts": { /* see below */ },
  "spacing": { /* see below */ },
  "radii": { /* see below */ },
  "shadows": { /* see below */ },
  "layouts": ["cover", "hero-top", ...]       // Compatible layouts
}
```

### Colors

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `colors.background` | hex string | `"#0D1117"` | Slide background colour |
| `colors.surface` | hex string | `"#161B22"` | Card, table, and panel background |
| `colors.text` | hex string | `"#E6EDF3"` | Primary text colour |
| `colors.textMuted` | hex string | `"#8B949E"` | Secondary / muted text |
| `colors.accent` | hex string | `"#58A6FF"` | Primary accent (headings, links, highlights) |
| `colors.accent2` | hex string | `"#3FB950"` | Secondary accent (code highlights, success states) |
| `colors.border` | hex string | `"#30363D"` | Table borders, dividers, outlines |
| `colors.error` | hex string | `"#F85149"` | Error states and warnings |

### Fonts

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `fonts.heading.family` | string | `"Inter"` | Heading font family |
| `fonts.heading.weight` | number | `600` | Default heading weight |
| `fonts.heading.weights` | object | `{"h1": 800, "h2": 700}` | Per-level heading weights (h1–h4) |
| `fonts.body.family` | string | `"Inter"` | Body text font family |
| `fonts.body.weight` | number | `400` | Body text font weight |
| `fonts.body.size` | number | `14` | Body text font size in points |
| `fonts.mono.family` | string | `"JetBrains Mono"` | Monospace (code) font family |
| `fonts.mono.weight` | number | `400` | Monospace font weight |

### Spacing (3 Density Modes)

Each density mode (`compact`, `comfortable`, `breathing`) defines the same four spacing values:

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `spacing.{mode}.slidePadding` | number | points | Padding around slide edges |
| `spacing.{mode}.blockGap` | number | points | Gap between content blocks |
| `spacing.{mode}.paragraphGap` | number | points | Gap between paragraphs within a block |
| `spacing.{mode}.sectionGap` | number | points | Gap between sections |

**Density mode behaviour:**

| Mode | Use Case | Default Padding |
|------|----------|:---------------:|
| `compact` | Data-heavy slides, many points | 24pt |
| `comfortable` | General presentations | 36pt |
| `breathing` | Keynotes, pitch decks | 48pt |

### Radii

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `radii.small` | number | `2` | Small border radius (code blocks, tables) |
| `radii.medium` | number | `4` | Medium border radius (cards, images) |
| `radii.large` | number | `8` | Large border radius (pulled quotes) |
| `radii.full` | number | `999` | Full round (avatar, badges) |

### Shadows

Each shadow is an object:

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `shadows.subtle.offsetX` | number | `0` | Horizontal offset in points |
| `shadows.subtle.offsetY` | number | `1` | Vertical offset in points |
| `shadows.subtle.blur` | number | `2` | Blur radius in points |
| `shadows.subtle.color` | hex string | `"#00000033"` | Shadow colour with alpha |

Two shadow levels: `subtle` (cards, surfaces) and `medium` (elevated elements).

---

## Working with Themes

### Listing Available Themes

```bash
slidesmith list-themes
```

Output:

```
dark-tech            Dark theme for tech presentations with blue accent
blue-white           Clean corporate theme with blue accent
warm-earth           Warm organic theme for storytelling and design reviews
minimal-clean        Minimal black and white theme for print and formal documents
high-contrast        High contrast theme for accessibility and projectors
```

### Selecting a Theme

Via CLI flag:

```bash
slidesmith build deck.md --theme warm-earth
```

Via config file (`slidesmith.yaml`):

```yaml
theme: warm-earth
```

**Priority:** CLI flag > config file > default (`dark-tech`)

---

## Customizing a Theme

### Override Colors in Config

Override specific theme colours without creating a full theme file:

This feature is not yet available in v0.1.0. To customize, create a custom theme (see below).

---

## Creating a Custom Theme

Create a `theme.json` file with the full schema:

```json
{
  "name": "my-custom-theme",
  "version": "1.0.0",
  "description": "My custom presentation theme",
  "author": "Your Name",
  "colors": {
    "background": "#1a1a2e",
    "surface": "#16213e",
    "text": "#e8e8e8",
    "textMuted": "#a0a0b0",
    "accent": "#e94560",
    "accent2": "#0f3460",
    "border": "#2a2a4a",
    "error": "#ff4444"
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

Use it with the `--theme` flag:

```bash
slidesmith build deck.md --theme ./path/to/theme.json
```

### Theme Design Guidelines

1. **Contrast**: All v0.1 themes meet WCAG 2.1 AA — text contrast ≥ 4.5:1 (normal) / ≥ 3:1 (large)
2. **Font licensing**: Use Open Font License (OFL) fonts. Google Fonts are recommended and embedding is permitted.
3. **Consistency**: Maintain consistent radii and shadow depth across similar elements.
4. **Density balance**: The three density modes should feel like a smooth progression, not jarring jumps.

---

## Layout Compatibility

All 5 built-in themes support all 8 layouts:

| Layout | Description |
|--------|-------------|
| `cover` | Full-bleed title slide with subtitle and footer |
| `hero-top` | Standard slide with header and body zone |
| `three-column` | Three equal columns with header bar |
| `symmetric` | Two-column: text left, media right |
| `waterfall` | Vertical section cascade with header |
| `comparison` | Side-by-side comparison (before/after, pro/con) |
| `quote` | Large pull-quote with attribution |
| `section-divider` | Full-bleed transition slide with background |
