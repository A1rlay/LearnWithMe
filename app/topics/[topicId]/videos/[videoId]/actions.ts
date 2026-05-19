"use server";

import { getSession } from "@/lib/session";
import { markVideoComplete } from "@/server/data/progress";

export async function markVideoCompleteAction(videoId: string) {
  const session = await getSession();
  if (!session) return;
  await markVideoComplete(session.userId, videoId);
}
