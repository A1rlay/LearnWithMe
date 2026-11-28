"use client";

import { useActionState, useEffect, useRef } from "react";

import { saveProjectAction, type ProjectState } from "@/app/u/actions";

type Defaults = { title: string; description: string | null; url: string | null; status: string; subjectId: string | null };

export function ProjectForm({
  projectId = null,
  defaults,
  subjects,
  onDone,
}: {
  projectId?: string | null;
  defaults?: Defaults;
  subjects: { id: string; name: string }[];
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState<ProjectState, FormData>(saveProjectAction.bind(null, projectId), {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      if (!projectId) form.current?.reset();
      onDone?.();
    }
  }, [state, projectId, onDone]);

  return (
    <form ref={form} action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">Title</span>
        <input name="title" required maxLength={80} defaultValue={defaults?.title} placeholder="e.g. Pass the B2 exam" className="field py-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">What is it?</span>
        <textarea name="description" rows={2} maxLength={300} defaultValue={defaults?.description ?? ""} placeholder="Optional. What you're doing and why." className="field py-2" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Status</span>
          <select name="status" defaultValue={defaults?.status ?? "ACTIVE"} className="field py-2">
            <option value="PLANNED">Planned</option>
            <option value="ACTIVE">In progress</option>
            <option value="DONE">Done</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Subject</span>
          <select name="subjectId" defaultValue={defaults?.subjectId ?? ""} className="field py-2">
            <option value="">None</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">Link</span>
        <input name="url" maxLength={300} defaultValue={defaults?.url ?? ""} placeholder="Optional, e.g. a blog, a notebook, a playlist" className="field py-2" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary px-4 py-2">
          {pending ? "Saving…" : projectId ? "Save project" : "Add project"}
        </button>
        {onDone && projectId && (
          <button type="button" onClick={onDone} className="text-sm text-muted hover:text-fg">Cancel</button>
        )}
        <span role="status" className="text-sm text-danger">{state.error}</span>
      </div>
    </form>
  );
}
