# ADR 0001 — Skills are tagged on activity containers, scored as % correct

Status: accepted · 2026-11-27 · Reversibility: two-way door (tag tables can gain a question-level table later)

## Context
The radar needs answers → skills. Activities: WordCatch topic (videos+checkpoint questions),
QuestionMaker topic, SpellRight set. Experts define skills per subject.

## Options
1. **Tag containers** (chosen). Cost: a quiz mixing grammar and vocabulary questions credits
   every answer to both skills — coarser signal.
2. Tag each question. Rejected: 5–20× more authoring clicks; experts at stage 0 won't do it,
   leaving skills empty and the radar blank.
3. Fixed universal taxonomy (Bloom). Rejected by the user: experts define skills.

## Scoring
Per skill: % correct over graded answers in tagged activities (`isCorrect` null = pending
open answer, excluded). Each question / word counts **once per UTC day** (the *first* answer that
day — the key is shown after each attempt, so later retries aren't evidence) so retries and request bursts can't inflate a skill (red-team finding #5). All three sources
are graded on the server; QuestionMaker grading moved server-side (`lib/qm-scoring.ts`) because
client-reported flags would otherwise drive a learner-visible score (red-team finding #3).
Hidden subjects are not charted. "Then" = same, restricted to answers created ≤ 30 days ago.
Below 3 graded answers a skill is shown as "not enough practice" rather than 0%.
Rejected: recency-weighted mastery (EWMA) — harder to explain to a learner and to the reviewer.

## Accepted consequences
- Retagging or moving an activity re-attributes its past answers, so a learner's "30 days ago"
  outline can change after the fact. Accepted: tags describe what an activity trains, not when.
- Pronunciation correctness is computed from the browser's speech-recognition transcript;
  the server re-grades the transcript but cannot verify the audio.

## Revisit when
An expert asks for per-question tagging, or >20% of tagged quizzes span ≥3 skills.
