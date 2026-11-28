# ADR 0002 — Motion and loading system

**Status:** accepted · 2026-11-27 · owner: frontend

## Context
The app felt static: pages swapped in without feedback, navigations to dynamic routes showed
nothing until the server answered, and activity feedback (right/wrong) was colour only.
Quality attributes at stake: perceived responsiveness, CLS, INP, accessibility (WCAG 2.2 AA,
2.3.3 Animation from Interactions), bundle size.

## Scenarios
- A learner clicks a subject on a slow connection → within 100 ms they see a skeleton with a
  "Loading…" status (prefetched `loading.tsx`); CLS on landing ≤ 0.1 (measured 0.0000).
- A learner changes a filter (`?level=`) where no skeleton shows → a top progress bar appears
  after 120 ms and finishes when the URL commits; navigations under 120 ms show nothing.
- A learner with `prefers-reduced-motion: reduce` → no animation runs longer than ~0 ms and
  nothing loops; all content is visible immediately (measured: zero long-running animations).
- No interaction adds JS animation work on the main thread (INP unaffected): CSS only.

## Decision
CSS-only motion in `app/globals.css`: tokens (`--ease-out`, `--ease-spring`, `--dur-enter`),
keyframes, and utilities `animate-enter|fade|pop|shake`, `stagger`, `skeleton`, `spinner`,
`press`, `nav-progress`. Route skeletons via `app/loading.tsx` and
`app/admin/(protected)/loading.tsx`; page entrance via `template.tsx` + `.page-enter > *`;
a tiny client `NavProgress` for navigations that commit without a skeleton; theme switches
cross-fade with the browser View Transitions API when available.

Entrances use `animation-fill-mode: backwards` (never `both`/`forwards`): a filled final
keyframe would pin `transform` and silently disable hover lifts and press scales.

## Options rejected
- **framer-motion / motion** — rejected: ~30–45 KB client JS, forces `"use client"` on server
  components to animate them. Cost accepted: no layout/shared-element animations or exit
  animations (CSS cannot animate unmount).
- **React `<ViewTransition>` + `experimental.viewTransition`** — rejected: Next docs say
  "strongly advise against using this feature in production". Revisit when it is stable.
- **`useLinkStatus` per link** — rejected as the primary signal: needs a client child in every
  link; one global bar covers all links.

## Consequences
- `template.tsx` remounts per route segment: client state below it resets on navigation (it
  already did, since each page is a different component).
- During a 280 ms entrance, a transformed ancestor is the containing block for `position:
  fixed` descendants; nothing fixed is mounted at page entry today.
- NavProgress only sees link clicks (capture phase, because `next/link` calls
  `preventDefault`). `router.push` and server-action redirects show the submit-button spinner
  instead.

**Reversibility:** two-way door: delete the utilities' class names and the four route files.
**Revisit when:** React ViewTransition ships stable in Next, or p75 INP > 200 ms on any page.
