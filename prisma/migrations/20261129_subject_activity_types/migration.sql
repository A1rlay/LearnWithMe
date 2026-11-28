-- Each subject chooses which activity kinds it offers.
CREATE TYPE "ActivityType" AS ENUM ('VIDEO', 'QUIZ', 'SPELLING');

ALTER TABLE "Subject"
  ADD COLUMN "activityTypes" "ActivityType"[] NOT NULL DEFAULT ARRAY['VIDEO', 'QUIZ']::"ActivityType"[];

-- Existing subjects keep every kind, so nothing already published disappears.
UPDATE "Subject" SET "activityTypes" = ARRAY['VIDEO', 'QUIZ', 'SPELLING']::"ActivityType"[];
