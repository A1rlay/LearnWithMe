"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { createProject, deleteProject, ProjectError, updateProject } from "@/server/data/profile";
import { allow } from "@/server/data/rate-limit";

export type ProjectState = { error?: string; ok?: boolean };

function parse(formData: FormData) {
  const title = formData.get("title")?.toString().trim().slice(0, 80) ?? "";
  const description = formData.get("description")?.toString().trim().slice(0, 300) || null;
  const rawUrl = formData.get("url")?.toString().trim() ?? "";
  const status = formData.get("status")?.toString();
  const subjectId = formData.get("subjectId")?.toString() || null;
  if (!title) return { error: "Give your project a title." } as const;
  let url: string | null = null;
  if (rawUrl) {
    try {
      const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      url = u.toString().slice(0, 300);
    } catch {
      return { error: "That link doesn't look right." } as const;
    }
  }
  return {
    data: {
      title,
      description,
      url,
      subjectId,
      status: status === "PLANNED" || status === "DONE" ? status : ("ACTIVE" as const),
    },
  } as const;
}

async function run(fn: () => Promise<void>, username: string): Promise<ProjectState> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof ProjectError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/u/${username}`);
  return { ok: true };
}

export async function saveProjectAction(projectId: string | null, _prev: ProjectState, formData: FormData): Promise<ProjectState> {
  const { userId, username } = await requireSession();
  if (!(await allow(`project:${userId}`, 30, 60 * 60_000))) return { error: "Too many changes. Try again in a while." };
  const p = parse(formData);
  if ("error" in p) return { error: p.error };
  return run(() => (projectId ? updateProject(userId, projectId, p.data) : createProject(userId, p.data)), username);
}

export async function deleteProjectAction(projectId: string) {
  const { userId, username } = await requireSession();
  await deleteProject(userId, projectId);
  revalidatePath(`/u/${username}`);
}
