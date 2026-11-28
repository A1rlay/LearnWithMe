# Handoffs

### tech-lead (product → dbms → backend ∥ frontend) — Frame → Build — 2026-11-27
**Did:** Pivoted LearnWithMe from a single English-company app to a general subject platform.
Slices S1–S4 of `product/PRD-subjects-skills-revamp.md`: subjects as the front door (listed only
with ≥1 expert), expert-defined skills + per-subject radar, expert-controlled subtitles per video,
full rebrand and visual revamp (tokens, Geist + Instrument Serif, new mark, removed company logo).
Also: Studio (admin) scoped per subject for experts, WordCatch/SpellRight answers now persisted,
QuestionMaker graded on the server, `middleware.ts` → `proxy.ts` (Next 16).

**Decisions**
- Subject as a new parent of the three activity types — rejected: merging today's topics into one
  list (mixes subjects once non-English content exists). Cost: one more level of navigation.
- Skills tagged on activity containers (ADR 0001) — rejected: per-question tags (authoring cost).
  Cost: coarser attribution.
- Keep enum `TEACHER`, label it "Expert" — rejected: enum rename (one-way door, no user benefit).
- Radar scoring = % correct, first answer per item per UTC day, now vs ≤30 days ago, min 3 answers
  — rejected: recency-weighted mastery (hard to explain). Cost: slower to react.
- Moved QuestionMaker grading to the server (was explicitly out of scope) — forced by red-team #3:
  the radar would otherwise show client-forgeable numbers. Cost: scope grew by one module.
- Dark-only theme, tokens ready for light — rejected: shipping both now (doubles QA).

**Artifacts:** `prisma/schema.prisma`, `prisma/migrations/20261127_subjects_skills/`, `server/data/subjects.ts`,
`server/data/skill-progress.ts`, `lib/auth.ts`, `lib/qm-scoring.ts`, `components/progress/skill-radar.tsx`,
`app/globals.css`, `docs/build/{product,adr,data,frontend}/…`.

**Provides / Requires:** requires the owner to apply the migration (README) and assign experts.

**Verification (non-author):** red-team pass 1 proved 10 defects (3 high); all addressed; pass 2:
8 FIXED, 2 PARTIAL (#5, #6 — see below), 0 regressions; follow-ups N1, N2, N4, N6 then fixed by
author (N1 verified: wrong-then-right on the same day scores as wrong; Listening 10/16).
Local checks: typecheck clean, `next build` passes, lint 13 problems = pre-existing baseline,
migration applied to a db-push'd copy with data → zero drift, English keeps its teacher as expert.
Radar numbers matched hand-computed values for a seeded learner.

**Risks**
- MEDIUM — Answer rows can grow without bound (SpellRight/quiz runs, concurrent video submits).
  Scoring neutralises the effect on the radar; storage is not limited. Signal: row growth per user/day.
- LOW — Pronunciation trusts the browser's transcript (inherent to client speech recognition).
- LOW — Any expert can view any learner's profile radar across subjects (pre-existing profile
  access model; the session detail page is scoped). Signal: experts outside a learner's subjects.
- LOW — Quiz page still ships answer keys to the browser for instant feedback (N5); grading is
  server-side so it can't be forged, but it can be read.
- LOW — Fresh-DB `migrate deploy` still fails (pre-existing drift; needs squashed baseline).

**Named but not implemented**
- App-only invariants: QMAnswer.question ∈ session.topic; SpellRightAnswer.word ∈ session.set
  (write paths filter; raw inserts could violate) — deferred, documented in `data/schema.md`.
- Per-user rate limiting — deferred (stage 0; scoring dedupe covers the radar).
- Create actions insert the activity then tag it in a second statement — a failed tag step would
  leave an untagged activity (not triggered; deferred).
- Older activity screens keep their original layout (colour-swept only) — `frontend/design-system.md`.

**Next:** product — choose the "study peers" solution to test (PRD: opt-in buddies / small groups /
pair challenge) after answering: what may one learner see of another, how do they contact each
other, are minors on the platform?
