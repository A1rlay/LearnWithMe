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

## Stack
Next.js 16 (App Router, `proxy.ts`), React 19, Prisma 6 + PostgreSQL, tRPC (video checkpoints),
Tailwind CSS v4 with design tokens in `app/globals.css`.

## Getting started
```bash
cp .env.example .env      # fill in DATABASE_URL(S) and AUTH_SECRET
npm install
npx prisma db push        # fresh local database
npm run db:seed           # admin, a sample expert, English subject + skills
npm run dev
```

### Applying the subjects/skills migration to an existing database
The existing database was managed with `db push`, so apply this one migration explicitly:
```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20261127_subjects_skills/migration.sql
npx prisma migrate resolve --applied 20261127_subjects_skills
```
It creates the **English** subject and moves all existing content into it. Then assign an expert
to English in Studio — until you do, English is hidden from learners.

## Commands
`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run db:seed` · `npm run db:studio`

## Project map
- `app/` — routes. Learner: `/`, `/subjects/[id]`, `/topics/…`, `/question-maker/…`, `/spell-right/…`, `/profile/[id]`. Studio: `/admin/…`.
- `server/data/` — all database access (`subjects.ts`, `skill-progress.ts`, …).
- `lib/auth.ts` — session + subject-scoped authorization helpers.
- `components/` — UI (`progress/skill-radar.tsx`, `studio/`, `brand/`).
- `docs/build/` — PRD, ADRs, data-model notes, design system, handoffs.
