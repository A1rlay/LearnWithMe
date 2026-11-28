-- Onboarding + weekly goal
ALTER TABLE "User" ADD COLUMN "weeklyGoal" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "User" ADD CONSTRAINT "User_weeklyGoal_range" CHECK ("weeklyGoal" BETWEEN 1 AND 14);
ALTER TABLE "User" ADD COLUMN "onboardedAt" TIMESTAMPTZ(3);
-- Everyone who already has an account skips the first-run flow.
UPDATE "User" SET "onboardedAt" = now();

-- Instructions, levels and hints
ALTER TABLE "Topic" ADD COLUMN "instructions" TEXT;
ALTER TABLE "QMTopic" ADD COLUMN "level" TEXT, ADD COLUMN "instructions" TEXT;
ALTER TABLE "SpellRightSet" ADD COLUMN "level" TEXT, ADD COLUMN "instructions" TEXT;
ALTER TABLE "Question" ADD COLUMN "hint" TEXT;
ALTER TABLE "QMQuestion" ADD COLUMN "hint" TEXT;

-- GitHub-style profile
CREATE TYPE "ProfileVisibility" AS ENUM ('MEMBERS', 'BUDDIES', 'ONLY_ME');
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'DONE');
ALTER TABLE "User" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "User" ADD COLUMN "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'MEMBERS';

CREATE TABLE "LearningProject" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subjectId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT,
  "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "LearningProject_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LearningProject_title_len" CHECK (char_length("title") BETWEEN 1 AND 80),
  CONSTRAINT "LearningProject_description_len" CHECK ("description" IS NULL OR char_length("description") <= 300),
  CONSTRAINT "LearningProject_url_https" CHECK ("url" IS NULL OR ("url" ~ '^https?://' AND char_length("url") <= 300))
);
CREATE INDEX "LearningProject_userId_idx" ON "LearningProject"("userId");
CREATE INDEX "LearningProject_subjectId_idx" ON "LearningProject"("subjectId");
ALTER TABLE "LearningProject" ADD CONSTRAINT "LearningProject_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningProject" ADD CONSTRAINT "LearningProject_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
