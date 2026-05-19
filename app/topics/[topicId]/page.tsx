import { notFound } from "next/navigation";

import { VideoList } from "@/components/video/video-list";
import { BackLink } from "@/components/ui/nav-link";
import { getTopicById } from "@/server/data/learning";

type TopicPageProps = {
  params: Promise<{ topicId: string }>;
};

export default async function TopicPage({ params }: TopicPageProps) {
  const { topicId } = await params;
  const topic = await getTopicById(topicId);

  if (!topic) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-12 sm:py-16">
      <BackLink href="/topics">Topics</BackLink>

      <div>
        {topic.level && (
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[rgba(255,255,255,0.55)]">
            {topic.level}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-extrabold text-white">{topic.title}</h1>
      </div>

      <VideoList topic={topic} />
    </main>
  );
}
