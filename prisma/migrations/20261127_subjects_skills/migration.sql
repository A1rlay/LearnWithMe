-- Subjects, expert assignment, skills, persisted video answers, subtitles toggle,
-- and indexes on previously unindexed foreign keys.
--
-- ASSUMES the target database already has the tables created outside migrations via
-- `prisma db push` (User, Class, ClassStudent, ClassAssignment, VideoProgress, SpellRight*).
-- Apply to an existing database with:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20261127_subjects_skills/migration.sql
--   npx prisma migrate resolve --applied 20261127_subjects_skills
-- Existing TEACHER users become experts of English (see the INSERT near the end).
-- If there are none, assign an expert in Studio afterwards or learners see no subjects.
-- See docs/build/data/schema.md for the migration-drift note.

-- DropIndex
DROP INDEX IF EXISTS "ClassAssignment_classId_idx";

-- AlterTable
ALTER TABLE "QMTopic" ADD COLUMN "subjectId" TEXT;

-- AlterTable
ALTER TABLE "SpellRightSet" ADD COLUMN "subjectId" TEXT;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN "subjectId" TEXT;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "subtitlesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- Backfill: everything that exists today is English content.
INSERT INTO "Subject" ("id", "name", "description", "order", "updatedAt")
VALUES ('subject_english', 'English', 'Listening, grammar, vocabulary and pronunciation practice.', 0, CURRENT_TIMESTAMP);
UPDATE "Topic"         SET "subjectId" = 'subject_english' WHERE "subjectId" IS NULL;
UPDATE "QMTopic"       SET "subjectId" = 'subject_english' WHERE "subjectId" IS NULL;
UPDATE "SpellRightSet" SET "subjectId" = 'subject_english' WHERE "subjectId" IS NULL;
ALTER TABLE "Topic"         ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "QMTopic"       ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "SpellRightSet" ALTER COLUMN "subjectId" SET NOT NULL;

-- CreateTable
CREATE TABLE "SubjectExpert" (
    "subjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectExpert_pkey" PRIMARY KEY ("subjectId","userId")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicSkill" (
    "topicId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "TopicSkill_pkey" PRIMARY KEY ("topicId","skillId")
);

-- CreateTable
CREATE TABLE "QMTopicSkill" (
    "topicId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "QMTopicSkill_pkey" PRIMARY KEY ("topicId","skillId")
);

-- CreateTable
CREATE TABLE "SpellRightSetSkill" (
    "setId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "SpellRightSetSkill_pkey" PRIMARY KEY ("setId","skillId")
);

-- CreateTable
CREATE TABLE "VideoAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "SubjectExpert_userId_idx" ON "SubjectExpert"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_subjectId_name_key" ON "Skill"("subjectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_id_subjectId_key" ON "Skill"("id", "subjectId");

-- CreateIndex
CREATE INDEX "TopicSkill_skillId_subjectId_idx" ON "TopicSkill"("skillId", "subjectId");

-- CreateIndex
CREATE INDEX "TopicSkill_topicId_subjectId_idx" ON "TopicSkill"("topicId", "subjectId");

-- CreateIndex
CREATE INDEX "QMTopicSkill_skillId_subjectId_idx" ON "QMTopicSkill"("skillId", "subjectId");

-- CreateIndex
CREATE INDEX "QMTopicSkill_topicId_subjectId_idx" ON "QMTopicSkill"("topicId", "subjectId");

-- CreateIndex
CREATE INDEX "SpellRightSetSkill_skillId_subjectId_idx" ON "SpellRightSetSkill"("skillId", "subjectId");

-- CreateIndex
CREATE INDEX "SpellRightSetSkill_setId_subjectId_idx" ON "SpellRightSetSkill"("setId", "subjectId");

-- CreateIndex
CREATE INDEX "VideoAnswer_userId_createdAt_idx" ON "VideoAnswer"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoAnswer_questionId_idx" ON "VideoAnswer"("questionId");

-- CreateIndex
CREATE INDEX "VideoAnswer_optionId_questionId_idx" ON "VideoAnswer"("optionId", "questionId");

-- CreateIndex
CREATE INDEX "ClassAssignment_topicId_idx" ON "ClassAssignment"("topicId");

-- CreateIndex
CREATE INDEX "ClassStudent_studentId_idx" ON "ClassStudent"("studentId");

-- CreateIndex
CREATE INDEX "QMAnswer_sessionId_idx" ON "QMAnswer"("sessionId");

-- CreateIndex
CREATE INDEX "QMAnswer_questionId_idx" ON "QMAnswer"("questionId");

-- CreateIndex
CREATE INDEX "QMTopic_subjectId_idx" ON "QMTopic"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "QMTopic_id_subjectId_key" ON "QMTopic"("id", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_id_questionId_key" ON "QuestionOption"("id", "questionId");

-- CreateIndex
CREATE INDEX "SpellRightAnswer_sessionId_idx" ON "SpellRightAnswer"("sessionId");

-- CreateIndex
CREATE INDEX "SpellRightAnswer_wordId_idx" ON "SpellRightAnswer"("wordId");

-- CreateIndex
CREATE INDEX "SpellRightSet_subjectId_idx" ON "SpellRightSet"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SpellRightSet_id_subjectId_key" ON "SpellRightSet"("id", "subjectId");

-- CreateIndex
CREATE INDEX "Topic_subjectId_idx" ON "Topic"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_id_subjectId_key" ON "Topic"("id", "subjectId");

-- AddForeignKey
ALTER TABLE "SubjectExpert" ADD CONSTRAINT "SubjectExpert_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectExpert" ADD CONSTRAINT "SubjectExpert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep the site live after deploy: every existing teacher becomes an expert of English
-- (before this change teachers could edit all content). Without at least one expert,
-- English — i.e. all existing content — would be hidden from learners.
INSERT INTO "SubjectExpert" ("subjectId", "userId")
SELECT 'subject_english', u."id" FROM "User" u WHERE u."role" = 'TEACHER'
ON CONFLICT DO NOTHING;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSkill" ADD CONSTRAINT "TopicSkill_topicId_subjectId_fkey" FOREIGN KEY ("topicId", "subjectId") REFERENCES "Topic"("id", "subjectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSkill" ADD CONSTRAINT "TopicSkill_skillId_subjectId_fkey" FOREIGN KEY ("skillId", "subjectId") REFERENCES "Skill"("id", "subjectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QMTopicSkill" ADD CONSTRAINT "QMTopicSkill_topicId_subjectId_fkey" FOREIGN KEY ("topicId", "subjectId") REFERENCES "QMTopic"("id", "subjectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QMTopicSkill" ADD CONSTRAINT "QMTopicSkill_skillId_subjectId_fkey" FOREIGN KEY ("skillId", "subjectId") REFERENCES "Skill"("id", "subjectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpellRightSetSkill" ADD CONSTRAINT "SpellRightSetSkill_setId_subjectId_fkey" FOREIGN KEY ("setId", "subjectId") REFERENCES "SpellRightSet"("id", "subjectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpellRightSetSkill" ADD CONSTRAINT "SpellRightSetSkill_skillId_subjectId_fkey" FOREIGN KEY ("skillId", "subjectId") REFERENCES "Skill"("id", "subjectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QMTopic" ADD CONSTRAINT "QMTopic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAnswer" ADD CONSTRAINT "VideoAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAnswer" ADD CONSTRAINT "VideoAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAnswer" ADD CONSTRAINT "VideoAnswer_optionId_questionId_fkey" FOREIGN KEY ("optionId", "questionId") REFERENCES "QuestionOption"("id", "questionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpellRightSet" ADD CONSTRAINT "SpellRightSet_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

