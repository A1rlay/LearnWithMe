import { notFound } from "next/navigation";

import { ActivityInstructions } from "@/components/ui/activity-instructions";
import { assertSubjectViewable } from "@/lib/auth";

import { SpellRightMode, getSpellRightSetDetail } from "@/server/data/spell-right";
import { TerminationClient } from "./termination-client";
import { PronunciationClient } from "./pronunciation-client";

type Props = { params: Promise<{ setId: string }> };

export default async function SpellRightPlayPage({ params }: Props) {
  const { setId } = await params;
  const set = await getSpellRightSetDetail(setId);
  if (!set || set.words.length === 0) notFound();
  await assertSubjectViewable(set.subjectId, "SPELLING");

  const termination = set.mode === SpellRightMode.TERMINATION;
  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4 pt-8 sm:px-6">
        <ActivityInstructions
          text={set.instructions}
          fallback={
            termination
              ? "Listen to each word and choose the sound its ending makes: /t/, /d/ or /ɪd/."
              : "Press the microphone and say each word out loud. Your browser listens and checks it."
          }
        />
      </div>
      {termination ? (
        <TerminationClient setId={set.id} subjectId={set.subjectId} setTitle={set.title} words={set.words} />
      ) : (
        <PronunciationClient setId={set.id} subjectId={set.subjectId} setTitle={set.title} words={set.words} />
      )}
    </>
  );
}
