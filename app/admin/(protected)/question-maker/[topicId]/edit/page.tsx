import { PedagogyFields } from "@/components/studio/pedagogy-fields";
import Link from "next/link";
import { notFound } from "next/navigation";

import { adminGetQMTopic } from "@/server/data/question-maker";
import { requireEditorPage } from "@/lib/auth";
import { SubjectSkillPicker } from "@/components/studio/subject-skill-picker";
import { pickerSubjects } from "@/lib/studio";

import { updateQMTopicAction } from "../../actions";
import { SubmitButton } from "@/components/ui/submit-button";

type Props = { params: Promise<{ topicId: string }> };

export default async function EditQMTopicPage({ params }: Props) {
  const { topicId } = await params;
  await requireEditorPage({ kind: "qmTopic", id: topicId });
  const topic = await adminGetQMTopic(topicId);
  if (!topic) notFound();
  const subjects = await pickerSubjects("QUIZ", topic.subjectId);

  const update = updateQMTopicAction.bind(null, topicId);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/question-maker" className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
      </Link>
      <div>
        <p className="eyebrow">Studio · Quizzes</p>
        <h1 className="mt-2 font-display text-4xl text-fg">Edit topic</h1>
      </div>
      <form action={update} className="flex flex-col gap-5 card p-8">
        <QMTopicFields defaults={topic} />
        <SubjectSkillPicker
          subjects={subjects}
          defaultSubjectId={topic.subjectId}
          defaultSkillIds={topic.skills.map((k) => k.skillId)}
        />
        <div className="flex gap-3 pt-2">
          <SubmitButton className="btn btn-primary">Save changes</SubmitButton>
        </div>
      </form>
    </div>
  );
}

const inputClass = "field";

export function QMTopicFields({ defaults }: { defaults?: { title?: string; description?: string | null; order?: number; level?: string | null; instructions?: string | null } } = {}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-fg">
          Title <span className="text-accent-text">*</span>
        </label>
        <input id="title" name="title" defaultValue={defaults?.title} required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-fg">Description</label>
        <textarea id="description" name="description" defaultValue={defaults?.description ?? ""} rows={2} className={inputClass} />
      </div>
      <PedagogyFields defaults={defaults} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="order" className="text-sm font-medium text-fg">Order</label>
        <input id="order" name="order" type="number" defaultValue={defaults?.order ?? 0} className={inputClass} />
      </div>
    </>
  );
}
