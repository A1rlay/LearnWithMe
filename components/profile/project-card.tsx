"use client";

import { useState } from "react";

import { deleteProjectAction } from "@/app/u/actions";
import { ProjectForm } from "./project-form";

export type Project = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  status: "PLANNED" | "ACTIVE" | "DONE";
  subject: { id: string; name: string } | null;
};

const STATUS = {
  PLANNED: { label: "Planned", dot: "bg-subtle" },
  ACTIVE: { label: "In progress", dot: "bg-series-now" },
  DONE: { label: "Done", dot: "bg-series-then" },
} as const;

export function ProjectCard({ p, editable, subjects }: { p: Project; editable: boolean; subjects: { id: string; name: string }[] }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li className="card p-4">
        <ProjectForm
          projectId={p.id}
          subjects={subjects}
          defaults={{ title: p.title, description: p.description, url: p.url, status: p.status, subjectId: p.subject?.id ?? null }}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }
  return (
    <li className="card flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-fg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-subtle" aria-hidden="true">
            <path d="M4 4h16v16H4z" /><path d="M4 9h16M9 9v11" />
          </svg>
          {p.url ? (
            <a href={p.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-accent-text hover:underline">{p.title}</a>
          ) : (
            <span>{p.title}</span>
          )}
        </h3>
        <span className="chip shrink-0">{p.subject ? p.subject.name : "Personal"}</span>
      </div>
      {p.description && <p className="text-sm text-muted">{p.description}</p>}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-subtle">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS[p.status].dot}`} />
          {STATUS[p.status].label}
        </span>
        {editable && (
          <span className="flex items-center gap-3">
            <button type="button" onClick={() => setEditing(true)} className="hover:text-fg">Edit</button>
            <form action={deleteProjectAction.bind(null, p.id)}>
              <button type="submit" className="hover:text-danger">Delete</button>
            </form>
          </span>
        )}
      </div>
    </li>
  );
}
