"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireEditorOf } from "@/lib/auth";
import { bool, int, str } from "@/lib/form";
import { adminCreateVideo, adminDeleteVideo, adminUpdateVideo } from "@/server/data/admin";
import { prisma } from "@/server/db";

function readVideo(formData: FormData) {
  const videoUrl = str(formData, "videoUrl");
  if (!/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(videoUrl)) {
    throw new Error("Invalid YouTube URL.");
  }
  return {
    title: str(formData, "title"),
    description: str(formData, "description"),
    videoUrl,
    order: int(formData, "order"),
    subtitlesEnabled: bool(formData, "subtitlesEnabled"),
  };
}

function revalidateVideo(topicId: string) {
  revalidatePath(`/admin/topics/${topicId}/videos`);
  revalidatePath("/", "layout");
}

export async function createVideoAction(topicId: string, formData: FormData) {
  await requireEditorOf({ kind: "topic", id: topicId });
  await adminCreateVideo({ ...readVideo(formData), topicId });
  revalidateVideo(topicId);
  redirect(`/admin/topics/${topicId}/videos`);
}

// `topicId` is only used for redirects; authorization and the update are keyed on the video.
export async function updateVideoAction(_topicId: string, videoId: string, formData: FormData) {
  await requireEditorOf({ kind: "video", id: videoId });
  const video = await adminUpdateVideo(videoId, readVideo(formData));
  revalidateVideo(video.topicId);
  redirect(`/admin/topics/${video.topicId}/videos`);
}

export async function deleteVideoAction(_topicId: string, videoId: string) {
  await requireEditorOf({ kind: "video", id: videoId });
  const { topicId } = await prisma.video.findUniqueOrThrow({ where: { id: videoId }, select: { topicId: true } });
  await adminDeleteVideo(videoId);
  revalidateVideo(topicId);
  redirect(`/admin/topics/${topicId}/videos`);
}
