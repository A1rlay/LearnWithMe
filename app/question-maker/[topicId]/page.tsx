import { notFound } from "next/navigation";

import { getQMTopicDetail } from "@/server/data/question-maker";
import { QuizClient } from "./quiz-client";

type Props = { params: Promise<{ topicId: string }> };

export default async function QuizPage({ params }: Props) {
  const { topicId } = await params;
  const topic = await getQMTopicDetail(topicId);
  if (!topic) notFound();
  if (topic.questions.length === 0) notFound();

  return <QuizClient topic={topic} topicId={topicId} />;
}
