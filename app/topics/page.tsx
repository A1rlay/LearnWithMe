import { TopicGrid } from "@/components/topics/topic-grid";
import { BackLink } from "@/components/ui/nav-link";
import { getTopicCatalog } from "@/server/data/learning";

export default async function TopicsPage() {
  const topics = await getTopicCatalog();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-12 sm:py-16">
      <BackLink href="/learn" />

      <h1 className="text-3xl font-extrabold text-white">Select a topic</h1>

      <TopicGrid topics={topics} />
    </main>
  );
}
