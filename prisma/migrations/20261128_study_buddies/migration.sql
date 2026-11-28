-- Study buddies: usernames (email becomes optional), learner subjects, buddy
-- connections, messages, blocks, reports, and DB-backed rate limiting.
-- Apply after 20261127_subjects_skills:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20261128_study_buddies/migration.sql
--   npx prisma migrate resolve --applied 20261128_study_buddies

-- CreateEnum
CREATE TYPE "BuddyStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discordHandle" TEXT,
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lookingForBuddies" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- Backfill usernames for existing accounts from their email's local part:
-- lowercase, disallowed characters -> "_", 3..16 chars. Allocated one by one (oldest first)
-- so a numeric suffix never collides with a name already handed out (ana, ana2, "ana2@…").
DO $$
DECLARE
  r RECORD;
  base TEXT;
  cand TEXT;
  n INT;
BEGIN
  FOR r IN SELECT id, email FROM "User" ORDER BY "createdAt", id LOOP
    base := left(regexp_replace(lower(split_part(coalesce(r.email, r.id), '@', 1)), '[^a-z0-9_.]', '_', 'g'), 16);
    IF length(base) < 3 THEN base := rpad(base, 3, '_'); END IF;
    cand := base;
    n := 1;
    WHILE EXISTS (SELECT 1 FROM "User" WHERE "username" = cand) LOOP
      n := n + 1;
      cand := base || n::text;
    END LOOP;
    UPDATE "User" SET "username" = cand WHERE id = r.id;
  END LOOP;
END $$;

-- Emails become case-insensitive: lowercase them unless that would collide with another account.
UPDATE "User" u SET "email" = lower(u."email")
 WHERE u."email" IS NOT NULL AND u."email" <> lower(u."email")
   AND NOT EXISTS (SELECT 1 FROM "User" o WHERE o.id <> u.id AND lower(o."email") = lower(u."email"));
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_username_format" CHECK ("username" ~ '^[a-z0-9_.]{3,20}$');

-- CreateTable
CREATE TABLE "LearnerSubject" (
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnerSubject_pkey" PRIMARY KEY ("userId","subjectId")
);

-- CreateTable
CREATE TABLE "BuddyConnection" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "BuddyStatus" NOT NULL DEFAULT 'PENDING',
    "closedById" TEXT,
    "acceptedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMPTZ(3),

    CONSTRAINT "BuddyConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMPTZ(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "messageId" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateEvent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearnerSubject_subjectId_idx" ON "LearnerSubject"("subjectId");

-- CreateIndex
CREATE INDEX "BuddyConnection_userBId_idx" ON "BuddyConnection"("userBId");

-- CreateIndex
CREATE INDEX "BuddyConnection_requesterId_createdAt_idx" ON "BuddyConnection"("requesterId", "createdAt");

-- CreateIndex
CREATE INDEX "BuddyConnection_closedById_idx" ON "BuddyConnection"("closedById");

-- CreateIndex
CREATE UNIQUE INDEX "BuddyConnection_userAId_userBId_key" ON "BuddyConnection"("userAId", "userBId");

-- CreateIndex
CREATE INDEX "Message_connectionId_createdAt_idx" ON "Message"("connectionId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

-- CreateIndex
CREATE INDEX "Report_resolvedAt_createdAt_idx" ON "Report"("resolvedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_reportedId_idx" ON "Report"("reportedId");

-- CreateIndex
CREATE INDEX "Report_messageId_idx" ON "Report"("messageId");

-- CreateIndex
CREATE INDEX "RateEvent_key_createdAt_idx" ON "RateEvent"("key", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "LearnerSubject" ADD CONSTRAINT "LearnerSubject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerSubject" ADD CONSTRAINT "LearnerSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyConnection" ADD CONSTRAINT "BuddyConnection_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyConnection" ADD CONSTRAINT "BuddyConnection_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyConnection" ADD CONSTRAINT "BuddyConnection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuddyConnection" ADD CONSTRAINT "BuddyConnection_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "BuddyConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Invariants the store enforces (not just the app):
ALTER TABLE "BuddyConnection" ADD CONSTRAINT "BuddyConnection_canonical_pair" CHECK ("userAId" < "userBId");
ALTER TABLE "BuddyConnection" ADD CONSTRAINT "BuddyConnection_requester_in_pair" CHECK ("requesterId" IN ("userAId", "userBId"));
ALTER TABLE "Block" ADD CONSTRAINT "Block_not_self" CHECK ("blockerId" <> "blockedId");
ALTER TABLE "Message" ADD CONSTRAINT "Message_body_length" CHECK (char_length("body") BETWEEN 1 AND 2000);
ALTER TABLE "Report" ADD CONSTRAINT "Report_reason_length" CHECK (char_length("reason") BETWEEN 1 AND 1000);
ALTER TABLE "Report" ADD CONSTRAINT "Report_not_self" CHECK ("reporterId" <> "reportedId");
