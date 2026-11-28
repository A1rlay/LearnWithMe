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
