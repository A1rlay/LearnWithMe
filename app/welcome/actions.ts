"use server";

import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { normalizeTimezone, parseInterests, parseWeeklyGoal } from "@/lib/identity";
import { completeOnboarding, firstActivityHref } from "@/server/data/me";

export async function finishWelcomeAction(formData: FormData) {
  const { userId } = await requireSession();
  const subjectIds = formData.getAll("subjectIds").map(String);
  await completeOnboarding(userId, {
    subjectIds,
    interests: parseInterests(formData.get("interests")?.toString() ?? ""),
    lookingForBuddies: formData.get("lookingForBuddies") === "on",
    weeklyGoal: parseWeeklyGoal(formData.get("weeklyGoal")),
    timezone: normalizeTimezone(formData.get("timezone")),
  });
  const first = subjectIds[0] ? await firstActivityHref(subjectIds[0]) : null;
  redirect(first ?? (subjectIds[0] ? `/subjects/${subjectIds[0]}` : "/#subjects"));
}

export async function skipWelcomeAction() {
  const { userId } = await requireSession();
  await completeOnboarding(userId, null);
  redirect("/#subjects");
}
