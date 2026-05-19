import { notFound } from "next/navigation";

import { BackLink } from "@/components/ui/nav-link";
import { VideoPlayer } from "@/components/video/video-player";
import { getVideoLessonById } from "@/server/data/learning";
import { markVideoCompleteAction } from "./actions";

type VideoPageProps = {
  params: Promise<{ topicId: string; videoId: string }>;
};

export default async function VideoPage({ params }: VideoPageProps) {
  const { videoId } = await params;
  const video = await getVideoLessonById(videoId);

  if (!video) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-12 sm:py-16">
      <BackLink href={`/topics/${video.topic.id}`}>{video.topic.title}</BackLink>

      <h1 className="text-2xl font-extrabold text-white">{video.title}</h1>

      <VideoPlayer video={video} onComplete={markVideoCompleteAction.bind(null, videoId)} />
    </main>
  );
}
