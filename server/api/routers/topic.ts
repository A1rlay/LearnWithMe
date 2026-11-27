import { z } from "zod";

import { getTopicById } from "@/server/data/learning";
import { getUserRole, isSubjectVisible } from "@/server/data/subjects";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const topicRouter = createTRPCRouter({
  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const topic = await getTopicById(input.id);
      if (!topic) return null;
      if (await isSubjectVisible(topic.subject.id)) return topic;
      const role = ctx.session ? await getUserRole(ctx.session.userId) : null;
      return role === "ADMIN" || role === "TEACHER" ? topic : null;
    }),
});
