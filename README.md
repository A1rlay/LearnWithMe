# Learn With Me

A platform for learning **with people**: every subject (English, Math, Guitar…) is taught by
an expert who builds its activities, and learners see their progress as a skill chart.

- **Subjects first.** The home page lists subjects. A subject is only visible while at least one
  expert is assigned to it.
- **Experts** are accounts the owner creates (role `TEACHER`, shown as *Expert*) and assigns to
  subjects in **Studio → Subjects & experts**. Experts can only edit their own subjects.
- **Activities** — video lessons with checkpoint questions, quizzes, and sounds & spelling
  drills — each belong to a subject and are tagged with the **skills** they train.
- **Skill chart.** Answers count toward the tagged skills; the profile and subject pages show a
  radar of % correct now vs 30 days ago.
- **Subtitles** are set per video by the expert (on for beginners, off for listening practice).
- **Accounts** — anyone can join at `/signup` with just a username and password (email optional,
  for recovery later). Login accepts username or email.
- **Study buddies** — learners who opt in on their **Me** page are suggested to each other by shared
  subjects and interests. After a request is accepted they can message in-app and see each other's
  Discord username. Block and report are on every person and message; reports land in
  **Studio → Reports**.

## Stack
Next.js 16 (App Router, `proxy.ts`), React 19, Prisma 6 + PostgreSQL, tRPC (video checkpoints),
Tailwind CSS v4 with design tokens in `app/globals.css`.

## Getting started
```bash
cp .env.example .env      # fill in DATABASE_URL(S) and AUTH_SECRET
npm install
npx prisma migrate deploy # fresh database: baseline + every later migration
npm run db:seed           # admin, a sample expert, English subject + skills
npm run dev
```

### Migrations
`prisma/migrations/0_baseline` is the whole schema as production had it on 2026-11-28 (a
`pg_dump --schema-only`, so CHECK constraints are included). Later migrations go after it.

- **New database:** `npx prisma migrate deploy`.
- **Production / an existing database:** back it up first (a Neon branch), then
  `npx prisma migrate deploy`. Production already has the baseline marked as applied.
- Write constraints Prisma can't express (CHECKs, composite FKs) by hand in the migration SQL.

## Commands
`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run db:seed` · `npm run db:studio`

## Project map
- `app/` — routes. Learner: `/`, `/welcome`, `/subjects/[id]`, `/u/[username]` (profile), `/me`, `/buddies`, `/messages`, `/signup`, `/topics/…`, `/question-maker/…`, `/spell-right/…`. Studio: `/admin/…`.
- `server/data/` — all database access (`subjects.ts`, `skill-progress.ts`, …).
- `lib/auth.ts` — session + subject-scoped authorization helpers.
- `components/` — UI (`progress/skill-radar.tsx`, `studio/`, `brand/`).
- `docs/build/` — PRD, ADRs, data-model notes, design system, handoffs.
