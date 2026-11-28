"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { adminResolveReport } from "@/server/data/buddies";

export async function resolveReportAction(id: string) {
  await requireRole("ADMIN");
  await adminResolveReport(id);
  revalidatePath("/admin/reports");
}
