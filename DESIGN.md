# SBC — Style Reference
> A high-tech, clean-tech editorial surface. A canvas of soft duck-egg and warm beige, structured with thin slate lines, where Geist Sans headings carry the precise, lightweight technical gravity, and Inter handles dense UI readability. 

**Theme:** light

SBC reads like a high-end corporate science portal: a canvas blending cool light-blue and warm beige, Geist Sans carrying almost all title text with lightweight, tight letter spacing, and Inter used for description and UI actions. Clean-tech layout flows are anchored by hairline borders, minimal shadows, and precise technical detail tags. A point blue (`#628ad1`) serves as the primary active indicator, supported by dark navy, beige, and duck-egg.

---

## Tokens — Colors (SBC Theme Mapping)

To maintain compatibility with existing codebase variables, the tokens are mapped as follows:

| Token Name | original CSS Variable | SBC Hex | Role & Mapping |
|------------|-----------------------|-----------------|----------------|
| **Point Blue** | `--color-violet-pulse` | `#628ad1` | Primary CTA, active status dot, brand blue points. |
| **Dark Blue** | `--color-indigo-ink` | `#3d5e86` | Secondary accent, link hover, active text emphasis. |
| **Light Blue** | `--color-lavender-wash` | `#d3e7ff` | Soft tinted background for info boxes or highlights. |
| **Duck Egg Blue** | `--color-iris-glow` | `#f1f5f8` | Recessed container background, light-grey-blue. |
| **Active Accent** | `--color-ledger-green` | `#628ad1` | point blue is utilized for positive states/highlights. |
| **White Canvas** | `--color-paper-white` | `#ffffff` | Primary content panels, card fills, modal background. |
| **Warm Beige** | `--color-bone` | `#f1f0eb` | Soft background surface, recessed pages, footer panels. |
| **Warm Pebble** | `--color-marble` | `#f1f0eb` | Soft alert banners, developer info bars. |
| **Dark Charcoal**| `--color-graphite` | `#1b1b1b` | Primary heading and senior display response text. |
| **Slate Grey** | `--color-slate` | `#242424` | Secondary text, modal titles. |
| **Deep Grey** | `--color-iron` | `#524f4b` | Default body copy, comfortable text. |
| **Muted Grey** | `--color-steel` | `#7d7d7d` | Helper text, secondary descriptors, inactive tabs. |
| **Silver Dust** | `--color-smoke` | `#b6b5b2` | Placeholders, inactive icons, subtle indicators. |
| **Structural Line**| `--color-ash` | `#cfcdc9` | 1px hairline divider — the structural backbone of the UI. |
| **Input Outline** | `--color-mist` | `#cfcdc9` | Border for text inputs and modal boxes. |
| **Pure Black** | `--color-noir` | `#000000` | Heavy contrast highlights. |

## Tokens — Typography

### Pretendard (UI / Title / Body Typeface) · `--font-moderat-serif`, `--font-twk-lausanne`, `--font-sf-mono`
* **CDN Link:** Pretendard web font dynamic subset CSS link loaded in index.html
* **Substitute:** System default sans-serif (Arial, sans-serif)
* **Weights:** 300, 400, 500, 600, 700
* **Role:** Primary unified font. Pretendard is used exclusively for all headings, labels, button tags, and senior scrolling responses. Title blocks are rendered with thin weights (300) and tight letter spacing (`-0.03em`) to maintain SBC's clean-tech aesthetic.

---

## Tokens — Spacing & Shapes

### Border Radius
* **Buttons / Inputs**: `4px` (`--radius-buttons`, `--radius-inputs` = `.25rem`) — sharp, technical feel.
* **Cards**: `16px` (`--radius-cards`, `--radius-large-panels` = `1rem`) — rounded frames containing structured data.
* **Badges / Status Pills**: `9999px` (`--radius-badges` = `var(--radius-full)`) — soft pills for tags.

### Spacing Scale
* Base unit: 4px
* `--spacing-24: 24px`
* `--spacing-32: 32px`
* `--spacing-40: 40px`

---

## Background Shader Atmosphere (VisualizerCanvas)
* Ambient background represents the SBC homepage header gradient: transitioning between Blue (`#628ad1`), Dark Blue (`#3d5e86`), Beige (`#f1f0eb`), and Duck Egg Blue (`#f1f5f8`). 
* Smooth fluid animation remains running at very low speed (`u_time * 0.05`).
