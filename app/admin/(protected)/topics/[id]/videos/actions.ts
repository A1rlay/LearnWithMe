"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import {
  adminCreateVideo,
  adminDeleteVideo,
  adminUpdateVideo,
} from "@/server/data/admin";

export async function createVideoAction(topicId: string, formData: FormData) {
  await requireRole("ADMIN");
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const videoUrl = formData.get("videoUrl")?.toString().trim() ?? "";
  const order = parseInt(formData.get("order")?.toString() ?? "0", 10);

  if (!videoUrl.match(/youtube\.com|youtu\.be/)) {
    throw new Error("Invalid YouTube URL.");
  }

  await adminCreateVideo({ description, order, title, topicId, videoUrl });

  revalidatePath(`/admin/topics/${topicId}/videos`);
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  redirect(`/admin/topics/${topicId}/videos`);
}

export async function updateVideoAction(
  topicId: string,
  videoId: string,
  formData: FormData,
) {
  await requireRole("ADMIN");
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const videoUrl = formData.get("videoUrl")?.toString().trim() ?? "";
  const order = parseInt(formData.get("order")?.toString() ?? "0", 10);

  if (!videoUrl.match(/youtube\.com|youtu\.be/)) {
    throw new Error("Invalid YouTube URL.");
  }

  await adminUpdateVideo(videoId, { description, order, title, videoUrl });

  revalidatePath(`/admin/topics/${topicId}/videos`);
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  redirect(`/admin/topics/${topicId}/videos`);
}

export async function deleteVideoAction(topicId: string, videoId: string) {
  await requireRole("ADMIN");
  await adminDeleteVideo(videoId);
  revalidatePath(`/admin/topics/${topicId}/videos`);
  revalidatePath("/topics");
  revalidatePath(`/topics/${topicId}`);
  redirect(`/admin/topics/${topicId}/videos`);
}
