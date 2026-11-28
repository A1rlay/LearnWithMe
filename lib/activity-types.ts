import type { ActivityType } from "@prisma/client";

export const ACTIVITY_TYPES: ActivityType[] = ["VIDEO", "QUIZ", "SPELLING"];

/** How each activity kind is named and where it lives in Studio. */
export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; studioTitle: string; studioHref: string; blurb: string; tag: string }
> = {
  VIDEO: {
    label: "Video lessons",
    studioTitle: "WordCatch",
    studioHref: "/admin/topics",
    blurb: "Videos that pause at checkpoints to ask a question. You choose per video whether subtitles are shown.",
    tag: "Listening + Quiz",
  },
  QUIZ: {
    label: "Quizzes",
    studioTitle: "QuestionMaker",
    studioHref: "/admin/question-maker",
    blurb: "Quiz sets with multiple choice, open answers, matching and sorting questions.",
    tag: "Quiz",
  },
  SPELLING: {
    label: "Sounds & spelling",
    studioTitle: "SpellRight",
    studioHref: "/admin/spell-right",
    blurb: "Word sets for ending-sound practice (ed / t / d) and pronunciation with the microphone.",
    tag: "Spelling + Audio",
  },
};

export function parseActivityTypes(values: FormDataEntryValue[]): ActivityType[] {
  return ACTIVITY_TYPES.filter((t) => values.includes(t));
}
