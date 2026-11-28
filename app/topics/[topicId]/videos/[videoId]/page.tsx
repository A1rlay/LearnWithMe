import { notFound } from "next/navigation";

import { BackLink } from "@/components/ui/nav-link";
import { VideoPlayer } from "@/components/video/video-player";
import { assertSubjectViewable } from "@/lib/auth";
import { getVideoLessonById } from "@/server/data/learning";
import { markVideoCompleteAction } from "./actions";

type VideoPageProps = {
  params: Promise<{ topicId: string; videoId: string }>;
};

export default async function VideoPage({ params }: VideoPageProps) {
  const { videoId } = await params;
  const video = await getVideoLessonById(videoId);

  if (!video) notFound();
  await assertSubjectViewable(video.topic.subjectId, "VIDEO");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 pb-24 pt-10 sm:px-6">
      <BackLink href={`/topics/${video.topic.id}`}>{video.topic.title}</BackLink>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl leading-tight text-fg">{video.title}</h1>
        <span className="chip">{video.subtitlesEnabled ? "Subtitles on" : "Subtitles off, listen closely"}</span>
      </div>

      <VideoPlayer video={video} onComplete={markVideoCompleteAction.bind(null, videoId)} />
    </main>
  );
}
