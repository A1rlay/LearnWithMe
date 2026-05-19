# LearnWithMe 

Next.js foundation for an English listening platform where students:

- choose a grammar topic
- pick an audio lesson inside that topic
- listen until a configured checkpoint
- answer 4 database-driven comprehension questions in a modal

## Stack

- Next.js App Router
- React 19
- tRPC
- Prisma
- PostgreSQL
- Tailwind CSS v4

## Project structure

- `app/`: frontend routes and the tRPC route handler
- `components/`: reusable UI by feature area
- `server/api/`: tRPC context, root router, and domain routers
- `server/db.ts`: shared Prisma client
- `prisma/schema.prisma`: PostgreSQL schema for topics, audios, questions, and options
- `prisma/seed.ts`: sample seed data
- `lib/placeholders.ts`: temporary UI data shaped like the database records

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run db:studio
```

## Environment

Copy `.env.example` to `.env` and update `DATABASE_URL` for your PostgreSQL instance.

## Current routes

- `/`: landing page
- `/topics`: topic listing
- `/topics/[topicSlug]`: audio list for a topic
- `/topics/[topicSlug]/audios/[audioSlug]`: audio lesson detail and quiz blueprint

## Notes

- Topic and audio routes now read from PostgreSQL through Prisma.
- tRPC routers are ready for frontend consumption and already mirror the core topic/audio lookup flow.
- The next steps are adding the real player, opening the quiz modal at the playback checkpoint, and submitting answers/results.
