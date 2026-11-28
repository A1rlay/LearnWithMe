import Link from "next/link";
import { notFound } from "next/navigation";

import { TopicFields } from "../../new/page";
import { updateTopicAction } from "../../actions";
import { adminGetTopic } from "@/server/data/admin";
import { requireEditorPage } from "@/lib/auth";
import { SubjectSkillPicker } from "@/components/studio/subject-skill-picker";
import { pickerSubjects } from "@/lib/studio";
import { SubmitButton } from "@/components/ui/submit-button";


type EditTopicPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTopicPage({ params }: EditTopicPageProps) {
  const { id } = await params;
  await requireEditorPage({ kind: "topic", id });
  const topic = await adminGetTopic(id);
  if (!topic) notFound();
  const subjects = await pickerSubjects("VIDEO", topic.subjectId);

  const update = updateTopicAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/topics"
          className="flex items-center gap-2 text-base font-bold text-fg transition-colors hover:text-accent-text"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg> Back
        </Link>
      </div>

      <div>
        <p className="eyebrow">
          Studio · Video lessons
        </p>
        <h1 className="mt-2 font-display text-4xl text-fg">
          Edit topic
        </h1>
      </div>

      <form
        action={update}
        className="flex flex-col gap-5 card p-8"
      >
        <TopicFields defaults={topic} />
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
