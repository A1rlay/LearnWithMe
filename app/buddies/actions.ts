"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import {
  BuddyError,
  blockUser,
  cancelRequest,
  endBuddy,
  reportUser,
  respondToRequest,
  sendRequest,
} from "@/server/data/buddies";

function refresh() {
  revalidatePath("/buddies");
  revalidatePath("/messages");
  revalidatePath("/me");
}

/** Runs a buddy operation; user-facing rule violations become a ?notice= banner. */
async function run(path: string, fn: (me: string) => Promise<void>) {
  const { userId } = await requireSession();
  try {
    await fn(userId);
  } catch (e) {
    if (e instanceof BuddyError) redirect(`${path}?notice=${encodeURIComponent(e.message)}`);
    throw e;
  }
  refresh();
}

export async function requestBuddyAction(targetId: string) {
  await run("/buddies", (me) => sendRequest(me, targetId));
}
export async function acceptAction(connectionId: string) {
  await run("/buddies", (me) => respondToRequest(me, connectionId, true));
}
export async function declineAction(connectionId: string) {
  await run("/buddies", (me) => respondToRequest(me, connectionId, false));
}
export async function cancelAction(connectionId: string) {
  await run("/buddies", (me) => cancelRequest(me, connectionId));
}
export async function endBuddyAction(connectionId: string) {
  await run("/messages", (me) => endBuddy(me, connectionId));
  redirect("/messages");
}
export async function blockAction(otherId: string) {
  await run("/buddies", (me) => blockUser(me, otherId));
  redirect("/buddies?notice=" + encodeURIComponent("Blocked. You won't see each other anymore."));
}
export async function reportAction(reportedId: string, messageId: string | null, formData: FormData) {
  const reason = [formData.get("category")?.toString(), formData.get("details")?.toString()].filter(Boolean).join(" — ");
  // Only same-site paths we know: never redirect to a client-supplied URL.
  const raw = formData.get("back")?.toString() ?? "";
  const back = /^\/(buddies|messages(\/[A-Za-z0-9_-]{1,40})?)$/.test(raw) ? raw : "/buddies";
  await run(back, (me) => reportUser(me, reportedId, reason, messageId));
  redirect(`${back}?notice=${encodeURIComponent("Thanks — the owner will review your report.")}`);
}
