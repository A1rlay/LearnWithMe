import Link from "next/link";

import { SubjectSkillPicker } from "@/components/studio/subject-skill-picker";
import { pickerSubjects } from "@/lib/studio";

import { createQMTopicAction } from "../actions";
import { QMTopicFields } from "../[topicId]/edit/page";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function NewQMTopicPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  const subjects = await pickerSubjects("QUIZ");
  const defaultSubjectId = subjects.some((s) => s.id === subject) ? subject : undefined;
  const back = defaultSubjectId ? `/admin/question-maker?subject=${defaultSubjectId}` : "/admin/question-maker";
  return (
    <div className="flex flex-col gap-6">
      <Link href={back} className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
      </Link>
      <div>
        <p className="eyebrow">Studio · Quizzes</p>
        <h1 className="mt-2 font-display text-4xl text-fg">New topic</h1>
      </div>
      <form action={createQMTopicAction} className="flex flex-col gap-5 card p-8">
        <QMTopicFields />
        <SubjectSkillPicker subjects={subjects} defaultSubjectId={defaultSubjectId} />
        <div className="flex gap-3 pt-2">
          <SubmitButton className="btn btn-primary">Create topic</SubmitButton>
        </div>
      </form>
    </div>
  );
}
