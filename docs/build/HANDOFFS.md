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

### tech-lead — Study buddies (PRD-study-buddies) — Frame → Build → Harden — 2026-11-27
**Did:** Open sign-up (username + password; email optional, case-insensitive), Me page (profile,
interests, subjects, Discord, recovery email, password change, blocks, skill charts), study buddies
(opt-in suggestions by shared subjects/interests, request → accept/decline, silent declines),
in-app messages (polling every 5 s, read receipts, unread badge), block/report everywhere,
Studio → Reports, DB-backed rate limits. Migration `20261128_study_buddies`.

**Decisions**
- Username + password only (user) — rejected: required email (friction), email verification (needs a
  provider + domain). Cost: no self-service recovery; owner resets passwords.
- Discord as a plain username field — rejected: Discord OAuth now (app + callback). Revisit on demand.
- Polling instead of websockets — rejected: realtime infra at stage 0. Cost: ≤5 s message latency.
- Silent declines, and blocks look like declines to the blocked side — rejected: explicit "declined"
  (pressure/retaliation risk with possibly-minor users). Cost: more state (`closedById`, `acceptedAt`).
- Rate limits in Postgres (`RateEvent`) — rejected: in-memory (useless on serverless) / Redis (new infra).

**Verification (non-author):** red-team pass 1: 13 proved (2 high: migration username collision,
legacy mixed-case email lockout). Pass 2: 8 fixed, 3 partial, 0 regressions, 1 new leak (cancel
revealed a decline). Author then fixed N1 (verified: cancel/re-request indistinguishable for pending vs
declined; decliner never re-notified), N2 (deleted-user cookies = signed out; tRPC hides internals),
N3 (blocks silent), #2 edge (email login tries each case-variant account). E2E in Chromium: sign-up →
profile → suggestion (no Discord) → request → accept (Discord shown) → messages both ways via polling →
report → admin Reports. Migration verified on PR-1-schema copies with collisions → zero drift.

**Risks / deferred**
- MEDIUM — IP-based limits trust `x-vercel-forwarded-for`/`x-real-ip`/last XFF hop: safe on Vercel,
  spoofable if self-hosted without a header-rewriting proxy.
- LOW — Profile-save email check is a (rate-limited, 20/h) oracle for "is this email registered".
- LOW — Rate limits overshoot by ~1 under concurrent bursts (count-then-insert).
- LOW — Look-alike usernames (`sofia.r` vs `sofia.r.`) allowed.
- Deferred (app-enforced only): message sender ∈ connection; reported message authored by reported user.

**Next:** product — forum (owner to discuss with partner); consider Discord OAuth and email recovery
once there are real users.

### tech-lead — Activity kinds per subject + interest chips — 2026-11-27
**Did:** `Subject.activityTypes` (VIDEO/QUIZ/SPELLING; existing subjects keep all, new default VIDEO+QUIZ).
Studio Activities grouped by subject; lists and New forms scoped with `?subject=`; learner pages,
catalog counts and direct activity URLs honour the kinds. Interests became a chip input. Removed em
dashes from all user-facing copy.
**Decisions:** enum array on Subject — rejected: a join table (no per-kind settings yet). Turning a
kind off hides, never deletes. Moving an activity into a subject requires the kind; staying put doesn't.
**Verification:** migration rehearsed on a Neon branch (zero drift); E2E as owner: chips add/remove/
dedupe/persist, kind off hides in Studio + learner page, back on restores.

### tech-lead — Learner experience batch — Build — 2026-11-27
**Did:** first-run `/welcome` (subjects, interests, weekly goal, buddies opt-in → first activity) and
an activation funnel on Studio Overview; weekly goals shared with buddies (rings, "studied today"),
invite link, buddy-request badge; per-activity instructions + level, per-question hints, level filter,
learner CC toggle (within the expert's setting); class insights (quiet students, most-missed
questions) and classes scoped to their teacher; GitHub-style profile `/u/[username]` (practice
calendar in the learner's timezone, streaks, learning projects, achievements, skills, recent
activity, visibility setting); phone tab bar; legacy screens moved to design-system classes;
submit buttons show pending state; light theme (header toggle, cookie, dark stays default);
migrations squashed into a `pg_dump --schema-only` baseline.
**Decisions**
- Activated = finished an activity within 7 days of sign-up — rejected: sign-up (not value) and
  "has a buddy" (too far for week one; tracked as the next funnel step).
- Profile visible to signed-in members by default, never to anonymous visitors — rejected: public
  web profiles (possibly minors). Owner can choose buddies-only or only-me.
- Heatmap counts answers per local day (user timezone from the browser, validated against
  Intl.supportedValuesOf) — rejected: UTC days (wrong day for Mexico evenings).
- Baseline from pg_dump — rejected: `migrate diff --from-empty` (drops CHECK constraints).
- No automated tests: the owner asked for none unless requested; verified by running the app.
**Verification:** Playwright runs against a seeded Neon branch (welcome flow, profile, projects,
buddies, class insights, light/dark, phone layout); fresh `migrate deploy` on Postgres 17 → zero
drift, 11 CHECKs; production procedure rehearsed on a branch of main → zero drift, data intact.
**Risks**
- LOW — Week boundaries for goals use UTC Mondays while the calendar uses local days.
- LOW — `lastActiveAt` counts completions only; answering without finishing reads as inactive.
- Blocked on owner: email notifications (needs an email provider + domain), error tracking (needs a
  Sentry project/DSN).
