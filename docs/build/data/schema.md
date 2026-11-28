# Data model notes (owner: dbms)

Source of truth: `prisma/schema.prisma`. This file records the *why*.

## Subjects
- `Subject` is the top level. `Topic` (WordCatch), `QMTopic`, `SpellRightSet` each have a
  required `subjectId` with `ON DELETE RESTRICT` — a subject with content cannot be deleted.
- `SubjectExpert(subjectId, userId)` assigns TEACHER users. Visibility rule ("listed only
  while ≥1 expert") is a query predicate (`experts: { some: {} }`), not a stored flag, so it
  can never disagree with the assignment rows.
- Authorization: a TEACHER may change content/skills of subject S only if a
  `SubjectExpert(S, teacher)` row exists **and the user's current DB role is TEACHER**.
  `requireRole` re-reads the role from the DB on every call, so unassigning *or* demoting
  revokes access immediately (the cookie only proves identity). Demotion also deletes the
  user's assignment rows in the same transaction. "Has an expert" (visibility) likewise
  counts only assignments whose user is still TEACHER.

## Skills and tagging
- `Skill` belongs to one subject; `(subjectId, name)` unique.
- Tag tables `TopicSkill`, `QMTopicSkill`, `SpellRightSetSkill` carry `subjectId` and use
  **two composite FKs**: `(activityId, subjectId) → activity(id, subjectId)` and
  `(skillId, subjectId) → Skill(id, subjectId)`. The store therefore refuses a tag whose skill
  is from another subject. Moving an activity to another subject cascades `subjectId` into its
  tags, which then fail the skill FK — the app must clear tags when the subject changes
  (it does: `setActivitySubjectAndSkills` deletes then re-inserts in one transaction).
- Tags are on the activity *container*, not each question: far less authoring work, and it is
  the "which objective does this activity serve" link the pedagogy review asked for.

## Answers used for the radar
| Source | Table | Graded where |
|---|---|---|
| WordCatch checkpoint | `VideoAnswer` (new) | server (`submitSingleAnswer`) |
| SpellRight | `SpellRightSession/Answer` (now written) | server, recomputed from the stored word |
| QuestionMaker | `QMSession/QMAnswer` | server (`recordQMRun` + `lib/qm-scoring.ts`); open answers wait for expert review |

`VideoAnswer(optionId, questionId) → QuestionOption(id, questionId)` composite FK: an answer
cannot pair a question with another question's option. Not enforced in the store (app-only):
a QMAnswer's question belonging to its session's topic, and a SpellRightAnswer's word belonging
to its session's set — both write paths filter, raw inserts could violate. Deferred: needs
composite keys on QMQuestion/SpellRightWord; revisit if another write path appears.

## Indexes added on previously unindexed FKs
`ClassAssignment.topicId`, `ClassStudent.studentId`, `QMAnswer.sessionId/questionId`,
`SpellRightAnswer.sessionId/wordId`, plus every new FK.

## Timestamps
New tables use `TIMESTAMPTZ(3)`. Existing tables keep `TIMESTAMP(3)` (Prisma writes UTC);
converting them is deferred — revisit when any code compares against local time.

## Migration drift (pre-existing)
`prisma/migrations` never created User/Class/VideoProgress/SpellRight tables (they came from
`db push`). `20261127_subjects_skills` assumes the db-push state and is applied with
`prisma db execute` + `prisma migrate resolve --applied`. A fresh `migrate deploy` from zero
still fails — fixing that needs a squashed baseline (deferred, tracked in HANDOFFS).
The migration also makes every existing TEACHER an expert of English so the site stays
live after deploy; with no teachers, the owner must assign one in Studio first.
Verified: on a db-push'd + seeded local DB, applying the migration leaves
`prisma migrate diff --from-url … --to-schema-datamodel` empty.

## Accounts & study buddies (20261128_study_buddies)
- Login: username, or email compared case-insensitively. Usernames are backfilled oldest-first in a
  loop that skips taken candidates (`ana`, `ana2`, then `ana22` if `ana2` already exists).
- `User.username` is the login handle: lowercase, `CHECK ~ '^[a-z0-9_.]{3,20}$'`, unique. `email` is
  now optional (unique when present). Backfill: email local part → lowercase, disallowed chars → `_`,
  ≤16 chars, padded to 3, de-duplicated with a numeric suffix.
- `BuddyConnection` stores each pair once: `CHECK (userAId < userBId)` + unique `(userAId, userBId)`,
  so A→B and B→A can't both exist even under concurrency; `CHECK requesterId IN (userAId, userBId)`.
  Status `PENDING → ACCEPTED | DECLINED`; `closedById` records who declined/ended/blocked and
  `acceptedAt` whether it was ever accepted. **Declines are silent**: to the requester a declined
  request still reads "waiting" (`viewOf()` in `server/data/buddies.ts`). Only the closer may reopen
  (a new request resets the row to PENDING); the other side's re-request is a silent no-op.
  Cancelling a real PENDING request deletes the row; cancelling a silently-declined one hands
  `requesterId` to the closer so it disappears without becoming re-sendable.
- `Message.body` 1–2000 chars (CHECK). `Report.messageId` is `ON DELETE SET NULL` (evidence survives).
- `Block(blockerId, blockedId)` with `CHECK blocker <> blocked`; every buddy query filters both directions.
- `RateEvent(key, createdAt)` backs sliding-window limits (sign-up per IP, failed logins per
  account/IP, requests, messages, reports). App-level, not atomic under bursts.
- Privacy rule (app-enforced): `discordHandle` and `email` are never selected for strangers;
  Discord is returned only for ACCEPTED connections.
- Deferred (app-enforced only): a message's sender belongs to its connection; a reported message
  was written by the reported user. Needs triggers; revisit if another write path appears.
