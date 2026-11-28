"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { BuddyError, sendMessage } from "@/server/data/buddies";

export type SendState = { error?: string; sentAt?: number };

export async function sendMessageAction(connectionId: string, _prev: SendState, formData: FormData): Promise<SendState> {
  const { userId } = await requireSession();
  try {
    await sendMessage(userId, connectionId, formData.get("body")?.toString() ?? "");
  } catch (e) {
    if (e instanceof BuddyError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/messages/${connectionId}`);
  revalidatePath("/messages");
  return { sentAt: Date.now() };
}
