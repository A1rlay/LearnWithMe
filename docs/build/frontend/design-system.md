# Design system — "Learn with me" (owner: frontend)

Tokens live in `app/globals.css` (`@theme`) and are consumed as Tailwind utilities.
**Components never use raw hex.** The sweep removed ~470 hard-coded colours
(`#0F9C00`, `#000D71`, `rgba(255,255,255,…)`, Tailwind gray/green/red).

## Direction
Modern, calm, dark-first: flat near-black canvas (no coloured glows; owner asked for none)
with a faint neutral dot grid fading out down the first screen, layered surfaces
with a hairline highlight, one violet accent, editorial serif for display text.
"Not simple, not flashy": depth from layering and type; motion is purposeful and quick (see
Motion below), and collapses under `prefers-reduced-motion`.

## Tokens
| Role | Token / utility | Value |
|---|---|---|
| Page | `bg-canvas` | #0B0C10 |
| Surfaces | `bg-surface` / `-2` / `-3` | #14161D / #1B1E27 / #232733 |
| Text | `text-fg` / `text-muted` / `text-subtle` | #EDEEF2 / #A0A4B0 / #7D8291 |
| Hairlines | `border-line` / `border-line-strong` | white 8% / 16% |
| Accent fill | `bg-accent` (+ `-hover`) | #5B4FE0 |
| Accent text | `text-accent-text` | #AFA6FF |
| Status | `success` / `warning` / `danger` | #4ADE9B / #F5C04A / #FF7A7A — state only, always with a word |
| Radar series | `series-now` / `series-then` | #8B80FF / #2BB39A |

Contrast (WCAG 2.2 AA, computed): fg/canvas 16.9 · muted/canvas 7.9 · subtle/surface 4.7 ·
accent-text/surface 8.4 · white on accent 5.8. Radar series validated with the dataviz
validator (dark, surface #14161D): lightness band, chroma, CVD ΔE 18.4, normal ΔE 24.6 — all pass;
"then" is additionally dashed so identity is never colour-alone.

## Type
Geist (UI), Geist Mono (numbers), Instrument Serif (`font-display`, headings; italic for the
one emphasised word). `font-serif` aliases display for older pages.

## Components (globals.css `@layer components`)
`card`, `card-interactive`, `btn btn-primary|btn-ghost`, `chip`, `field`, `eyebrow`.
Focus: global `:focus-visible` 2px accent-text outline. Skip link in the root layout.

## Motion (ADR 0002)
CSS only, transform + opacity only. Tokens: `--ease-out`, `--ease-spring`, `--dur-enter` (280 ms).
| Utility | Use |
|---|---|
| `animate-enter` | panels, revealed hints, new messages, question changes (key the element) |
| `stagger` | on a list/grid: children rise in 40 ms apart (first 10) |
| `animate-pop` | badges, ticks, scores, the correct answer |
| `animate-shake` | wrong answer, form error; always with a word, never motion alone |
| `animate-fade` | overlays, secondary series |
| `press` | tactile scale on custom buttons (`.btn`, `.toggle-chip` already have it) |
| `skeleton` | shimmer placeholder in `loading.tsx` |
| `<Spinner>` / `<LoadingLabel>` | `components/ui/spinner.tsx`; every pending button uses it |

Entrances use fill-mode `backwards` so hover/press transforms still work afterwards.
Route loading: `app/loading.tsx`, Studio `app/admin/(protected)/loading.tsx` (`PageSkeleton`).
Navigation bar: `components/ui/nav-progress.tsx`. Theme switch cross-fades (View Transitions).

## Brand
Wordmark "Learn *with* me"; mark = two overlapping circles (you + the person you learn with)
in the two radar series colours. The previous company logo (`app/icon.png`) was removed.

## Known debt
Older activity screens (quiz/game/spelling clients, Studio CRUD forms) were colour-swept but keep
their original layout and uppercase field labels; restyle them to `field`/`btn` when next touched.
Light theme: tokens are structured for it, not implemented.
