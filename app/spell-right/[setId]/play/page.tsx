import { notFound } from "next/navigation";

import { SpellRightMode, getSpellRightSetDetail } from "@/server/data/spell-right";
import { TerminationClient } from "./termination-client";
import { PronunciationClient } from "./pronunciation-client";

type Props = { params: Promise<{ setId: string }> };

export default async function SpellRightPlayPage({ params }: Props) {
  const { setId } = await params;
  const set = await getSpellRightSetDetail(setId);
  if (!set || set.words.length === 0) notFound();

  if (set.mode === SpellRightMode.TERMINATION) {
    return <TerminationClient setId={set.id} setTitle={set.title} words={set.words} />;
  }

  return <PronunciationClient setId={set.id} setTitle={set.title} words={set.words} />;
}
