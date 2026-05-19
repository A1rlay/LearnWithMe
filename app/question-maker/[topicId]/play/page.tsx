import { notFound } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { getQMTopicDetail } from "@/server/data/question-maker";
import { GameClient } from "./game-client";

type Props = { params: Promise<{ topicId: string }> };

export default async function GamePage({ params }: Props) {
  await requireSession();
  const { topicId } = await params;
  const topic = await getQMTopicDetail(topicId);
  if (!topic) notFound();
  if (topic.questions.length === 0) notFound();

  return <GameClient topic={topic} />;
}
