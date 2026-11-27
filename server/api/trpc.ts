import { initTRPC } from "@trpc/server";
import superjson from "superjson";

import { getSession } from "@/lib/session";
import { prisma } from "@/server/db";

export async function createTRPCContext() {
  return {
    prisma,
    session: await getSession(),
  };
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
