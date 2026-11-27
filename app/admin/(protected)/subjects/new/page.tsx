import { BackLink } from "@/components/ui/nav-link";
import { requireRole } from "@/lib/auth";
import { createSubjectAction } from "../actions";

export const metadata = { title: "New subject" };

export default async function NewSubjectPage() {
  await requireRole("ADMIN");
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <BackLink href="/admin/subjects">Subjects</BackLink>
      <div>
        <p className="eyebrow">New subject</p>
        <h1 className="mt-2 font-display text-4xl text-fg">What will people learn?</h1>
        <p className="mt-1.5 text-sm text-muted">
          e.g. English, Math, Guitar. You&apos;ll add skills and assign experts next.
        </p>
      </div>
      <form action={createSubjectAction} className="card flex flex-col gap-5 p-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Name</span>
          <input name="name" required maxLength={60} className="field" placeholder="English" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Description</span>
          <textarea name="description" rows={3} maxLength={300} className="field" placeholder="What learners practise here" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Display order</span>
          <input name="order" type="number" defaultValue={0} className="field w-28" />
        </label>
        <button type="submit" className="btn btn-primary self-start">
          Create subject
        </button>
      </form>
    </div>
  );
}
