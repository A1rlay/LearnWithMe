import { notFound } from "next/navigation";

import { ActivityInstructions } from "@/components/ui/activity-instructions";
import { BackLink } from "@/components/ui/nav-link";
import { VideoList } from "@/components/video/video-list";
import { assertSubjectViewable } from "@/lib/auth";
import { getTopicById } from "@/server/data/learning";

type TopicPageProps = {
  params: Promise<{ topicId: string }>;
};

export default async function TopicPage({ params }: TopicPageProps) {
  const { topicId } = await params;
  const topic = await getTopicById(topicId);
  if (!topic) notFound();
  await assertSubjectViewable(topic.subject.id, "VIDEO");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-24 pt-10 sm:px-6">
      <BackLink href={`/subjects/${topic.subject.id}`}>{topic.subject.name}</BackLink>

      <header className="flex flex-col gap-3">
        <p className="eyebrow">Video lessons{topic.level ? ` · ${topic.level}` : ""}</p>
        <h1 className="font-display text-5xl leading-tight text-fg">{topic.title}</h1>
        {topic.description && <p className="text-base text-muted">{topic.description}</p>}
        {topic.skills.length > 0 && (
          <p className="text-sm text-muted">
            <span className="text-subtle">Trains </span>
            {topic.skills.join(" · ")}
          </p>
        )}
      </header>

      <ActivityInstructions
        text={topic.instructions}
        fallback="The video pauses at each checkpoint and asks one question. You can re-watch before answering. Your answers count toward your skill chart when you're signed in."
      />

      <VideoList topic={topic} />
    </main>
  );
}
