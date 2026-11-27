import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getVideoLessonById, submitSingleAnswer } from "@/server/data/learning";
import { getUserRole, isSubjectVisible, subjectIdOf } from "@/server/data/subjects";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

/** Same rule as the pages: hidden subjects (no expert) exist only for staff. */
async function canSee(subjectId: string | null, userId: string | undefined) {
  if (!subjectId) return false;
  if (await isSubjectVisible(subjectId)) return true;
  const role = userId ? await getUserRole(userId) : null;
  return role === "ADMIN" || role === "TEACHER";
}

export const videoRouter = createTRPCRouter({
  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const lesson = await getVideoLessonById(input.id);
      if (!lesson || !(await canSee(lesson.topic.subjectId, ctx.session?.userId))) return null;
      return lesson;
    }),

  submitAnswer: publicProcedure
    .input(
      z.object({
        optionId: z.string().min(1).max(64),
        questionId: z.string().min(1).max(64),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const subjectId = await subjectIdOf({ kind: "question", id: input.questionId });
      const result = (await canSee(subjectId, ctx.session?.userId))
        ? await submitSingleAnswer(input.questionId, input.optionId, ctx.session?.userId ?? null)
        : null;

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question or option not found.",
        });
      }

      return result;
    }),
});
