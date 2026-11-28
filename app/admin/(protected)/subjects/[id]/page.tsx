import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/delete-button";
import { ActivityTypeChecks } from "@/components/studio/activity-type-checks";
import { BackLink } from "@/components/ui/nav-link";
import { requireSubjectEditor, ForbiddenError } from "@/lib/auth";
import { adminGetSubject, getExpertCandidates } from "@/server/data/subjects";
import {
  assignExpertAction,
  createSkillAction,
  deleteSkillAction,
  deleteSubjectAction,
  renameSkillAction,
  setActivityTypesAction,
  unassignExpertAction,
  updateSubjectAction,
} from "../actions";
import { SubmitButton } from "@/components/ui/submit-button";

type Props = { params: Promise<{ id: string }> };

export default async function SubjectDetailPage({ params }: Props) {
  const { id } = await params;
  let session;
  try {
    session = await requireSubjectEditor(id);
  } catch (e) {
    if (e instanceof ForbiddenError) notFound();
    throw e;
  }
  const subject = await adminGetSubject(id);
  if (!subject) notFound();

  const isAdmin = session.role === "ADMIN";
  const candidates = isAdmin ? await getExpertCandidates() : [];
  const assigned = new Set(subject.experts.map((e) => e.userId));
  const available = candidates.filter((c) => !assigned.has(c.id));
  const live = subject.experts.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/admin/subjects">Subjects</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Subject</p>
          <h1 className="mt-2 font-display text-5xl text-fg">{subject.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {live ? (
              <span className="text-success">● Live: learners can find this subject.</span>
            ) : (
              <span className="text-warning">● Hidden: assign an expert to publish it.</span>
            )}
          </p>
        </div>
        {isAdmin && <DeleteButton action={deleteSubjectAction.bind(null, id)} label={`the subject “${subject.name}”`} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skills */}
        <section aria-labelledby="skills-h" className="card flex flex-col gap-4 p-6">
          <div>
            <h2 id="skills-h" className="font-semibold text-fg">Skills</h2>
            <p className="mt-1 text-sm text-muted">
              The axes of each learner&apos;s skill chart. Tag every activity with the skills it trains.
              Aim for 3–8.
            </p>
          </div>
          {subject.skills.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">
              No skills yet. Add the first one below, e.g. Listening, Grammar, Vocabulary.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {subject.skills.map((k) => (
                <li key={k.id} className="flex items-center gap-2">
                  <form action={renameSkillAction.bind(null, k.id)} className="flex flex-1 gap-2">
                    <label className="sr-only" htmlFor={`skill-${k.id}`}>Skill name</label>
                    <input id={`skill-${k.id}`} name="name" defaultValue={k.name} maxLength={60} className="field py-2" />
                    <SubmitButton className="btn btn-ghost px-3 py-2 text-xs">Save</SubmitButton>
                  </form>
                  <DeleteButton action={deleteSkillAction.bind(null, k.id)} label={`the skill “${k.name}”`} />
                </li>
              ))}
            </ul>
          )}
          <form action={createSkillAction.bind(null, id)} className="flex gap-2">
            <label className="sr-only" htmlFor="new-skill">New skill</label>
            <input id="new-skill" name="name" required maxLength={60} placeholder="New skill" className="field py-2" />
            <SubmitButton className="btn btn-primary px-4 py-2">Add</SubmitButton>
          </form>
        </section>

        {/* Experts */}
        <section aria-labelledby="experts-h" className="card flex flex-col gap-4 p-6">
          <div>
            <h2 id="experts-h" className="font-semibold text-fg">Experts</h2>
            <p className="mt-1 text-sm text-muted">
              People who teach this subject. They can create activities and skills here.
            </p>
          </div>
          {subject.experts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-warning/40 p-4 text-sm text-warning">
              No experts, so the subject is hidden from learners.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {subject.experts.map((e) => (
                <li key={e.userId} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-fg">{e.user.name}</p>
                    <p className="text-xs text-subtle">@{e.user.username}</p>
                  </div>
                  {isAdmin && (
                    <form action={unassignExpertAction.bind(null, id, e.userId)}>
                      <SubmitButton className="btn btn-ghost px-3 py-1.5 text-xs">Remove</SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isAdmin &&
            (available.length > 0 ? (
              <form action={assignExpertAction.bind(null, id)} className="flex gap-2">
                <label className="sr-only" htmlFor="expert">Expert to add</label>
                <select id="expert" name="userId" className="field py-2" defaultValue="">
                  <option value="" disabled>Choose an expert…</option>
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (@{c.username})
                    </option>
                  ))}
                </select>
                <SubmitButton className="btn btn-primary px-4 py-2">Assign</SubmitButton>
              </form>
            ) : (
              <p className="text-xs text-subtle">
                To add someone, create a user with the <span className="text-fg">Expert</span> role under People.
              </p>
            ))}
        </section>
      </div>

      <section id="activity-types" aria-labelledby="types-h" className="card flex flex-col gap-4 p-6">
        <div>
          <h2 id="types-h" className="font-semibold text-fg">Activity kinds</h2>
          <p className="mt-1 text-sm text-muted">
            Which kinds of activity fit {subject.name}. Learners only see these, and Studio only lets you
            create these here. Turning one off hides its existing activities without deleting them.
          </p>
        </div>
        <form action={setActivityTypesAction.bind(null, id)} className="flex flex-wrap items-center justify-between gap-3">
          <ActivityTypeChecks defaults={subject.activityTypes} />
          <SubmitButton className="btn btn-primary px-4 py-2">Save kinds</SubmitButton>
        </form>
      </section>

      {isAdmin && (
        <section aria-labelledby="details-h" className="card flex flex-col gap-4 p-6">
          <h2 id="details-h" className="font-semibold text-fg">Details</h2>
          <form action={updateSubjectAction.bind(null, id)} className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg">Name</span>
              <input name="name" required maxLength={60} defaultValue={subject.name} className="field" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg">Order</span>
              <input name="order" type="number" defaultValue={subject.order} className="field" />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-fg">Description</span>
              <textarea name="description" rows={2} maxLength={300} defaultValue={subject.description ?? ""} className="field" />
            </label>
            <SubmitButton className="btn btn-primary justify-self-start sm:col-span-2">Save details</SubmitButton>
          </form>
        </section>
      )}
    </div>
  );
}
