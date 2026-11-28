# PRD — Subjects, skills radar & visual revamp

Status: in build · Owner: product · Date: 2026-11-27 · Stage: 0 (<1k users)

## Why

LearnWithMe started as an English-listening tool for one company ("Ingles Practico").
It is becoming a general platform: people who know a subject teach it, and learners study
it — ideally alongside peers. Pedagogical review (UDL / constructive alignment) said:
activities don't show which objective they serve, learners can't see their progress, and
"Learn With Me — but with whom?" is unanswered.

## Outcome

**Learners come back to practise a subject they started.**
Measure: share of learners with ≥2 activity sessions in the same subject on different days
within 14 days of their first session. Guardrail: average score per skill must not drop
(we are not trying to make activities easier to drive repeats).

Activation event: a learner completes their first scored activity (video question, quiz or
spelling set) inside a subject.

## Slices (vertical, each demonstrable end to end)

### S1 — Subjects are the front door
- New top level **Subject** (English, Math, Guitar…). Videos topics, quizzes and spelling
  sets each belong to exactly one subject. Existing content goes under **English**.
- **Experts** are the people who teach: accounts the owner (ADMIN) creates and assigns to
  one or more subjects. Experts create the content (video topics, quizzes, spelling sets),
  define skills and choose subtitles. Learners are regular users.
  Stored as role `TEACHER`, labelled **Expert** everywhere in the UI (enum rename avoided —
  one-way door with no user-visible benefit). **No expert profile pages.**
- A subject is listed to learners **only while ≥1 expert is assigned**.

AC
- Given a subject with no assigned expert, when anyone opens `/`, then the subject is not listed and `/subjects/<id>` returns 404 for non-staff.
- Given a subject with an expert, when a visitor opens `/`, then it is listed with its activity counts, and its page shows only that subject's videos, quizzes and spelling sets.
- Given a TEACHER not assigned to subject X, when they submit any create/update/delete for content or skills of X, then the action is refused server-side.

### S2 — Expert-defined skills + radar
- Experts define **skills per subject** (e.g. English: Listening, Grammar, Vocabulary,
  Pronunciation). They tag each video, quiz and spelling set with the skills it trains —
  this is the "which objective does this activity serve" link the review asked for.
- Answers are attributed to the tagged skills. Learner profile shows a **radar per subject**:
  "now" vs "30 days ago", so improvement is visible.
- WordCatch answers and SpellRight results are now **persisted** (they were not before),
  graded on the server.

AC
- Given a learner with ≥3 graded answers on a skill, then the radar plots that skill's % correct; with fewer, the axis shows "not enough practice yet" instead of a misleading 0%.
- Given answers older than 30 days, then the "30 days ago" outline is drawn from answers up to that date only.
- Given a subject with fewer than 3 skills, then a bar list is shown instead of a radar (a radar with <3 axes is not a shape).
- Given a WordCatch or SpellRight submission, then correctness is computed on the server from stored answers, never from a client-sent flag.

### S3 — Subtitles controlled by the expert
- Each video has **Subtitles: on/off**, set by an expert of that subject (e.g. on for A1–B1, off for advanced). Default off (current behaviour).

AC
- Given subtitles on, when the learner plays the video, then YouTube captions load; given off, they are force-unloaded as today.

### S4 — Rebrand + visual revamp
- Remove company branding ("Ingles Practico", English-only copy). Name: **Learn With Me**,
  tagline about learning with people.
- Modern 2026 look: dark layered surfaces, one refined accent, tokens instead of hard-coded
  colours, WCAG 2.2 AA contrast, visible focus.

AC
- No hard-coded brand colours (`#0F9C00`, `#000D71`) remain in components; colours come from tokens in `app/globals.css`.
- Body text ≥ 4.5:1 contrast; focus ring visible on every interactive element.

## Explicitly out of this pass (say no)
- Expert profile pages (user decision).
- Server-side grading for QuestionMaker (scores still client-reported — see risk in HANDOFFS).
- Gamification (XP/streaks), hints, per-activity instructions, CEFR level filter.

## Later slice — "I want to teach" (become an expert)
Some users will want to teach. A learner applies to become an expert for a subject; the owner
approves, which flips the role and creates the assignment. Out of this pass; the owner adds
experts manually for now.

## Next slice candidate — Study peers (the "with whom")
Need (not solution): learners quit when they study alone. Three candidate solutions to test:
1. Opt-in "study buddies" list per subject (people practising the same skills, show first name + overlap).
2. Small rotating study groups per subject with a shared weekly goal.
3. Pair challenge: invite a peer to the same quiz and compare radars.
Riskiest assumption: learners are willing to be visible to strangers. Open questions for the
user: what a peer can see, how they contact each other (in-app vs external), minors.
