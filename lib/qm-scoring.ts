import type {
  ClassifierData,
  MatcherData,
  MultipleOptionData,
  QMQuestionData,
} from "@/server/data/question-maker";

/**
 * Pure QuestionMaker grading, shared by the server (authoritative — this is what
 * is stored and charted) and the quiz client (instant feedback only).
 * `null` = needs an expert's review (open answers) or not auto-gradable yet.
 */
export function scoreQMAnswer(
  question: { type: string; data: unknown },
  answer: unknown,
): boolean | null {
  const data = question.data as QMQuestionData;
  switch (question.type) {
    case "MULTIPLE_OPTION":
      return answer === (data as MultipleOptionData).correctIndex;
    case "OPEN_ANSWER":
      return null;
    case "MATCHER": {
      const d = data as MatcherData;
      if (!Array.isArray(answer) || d.pairs.length === 0) return false;
      return d.pairs.every((_, i) => (answer as (number | null)[])[i] === i);
    }
    case "CLASSIFIER": {
      const d = data as ClassifierData;
      if (!Array.isArray(answer) || d.items.length === 0) return false;
      return d.items.every((item, i) => (answer as (number | null)[])[i] === item.categoryIndex);
    }
    default:
      return null;
  }
}
