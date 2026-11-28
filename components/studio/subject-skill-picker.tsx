"use client";

import { useState } from "react";

type SubjectOption = { id: string; name: string; skills: { id: string; name: string }[] };

/**
 * Posts `subjectId` and repeated `skillIds`. Changing subject clears the skill
 * selection, because skills belong to one subject (the DB rejects mixing).
 */
export function SubjectSkillPicker({
  subjects,
  defaultSubjectId,
  defaultSkillIds = [],
}: {
  subjects: SubjectOption[];
  defaultSubjectId?: string;
  defaultSkillIds?: string[];
}) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? subjects[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSkillIds));
  const subject = subjects.find((s) => s.id === subjectId);

  if (subjects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-warning/40 p-4 text-sm text-warning">
        None of your subjects offers this kind of activity. Turn it on under Subjects, or ask the owner to make you an expert.
      </p>
    );
  }

  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-line p-4">
      <legend className="px-1 text-sm font-medium text-fg">Subject &amp; skills</legend>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Subject</span>
        <select
          name="subjectId"
          required
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setSelected(new Set());
          }}
          className="field"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted">Skills this activity trains</span>
        {subject && subject.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {subject.skills.map((k) => {
              const on = selected.has(k.id);
              return (
                <label
                  key={k.id}
                  className="toggle-chip"
                >
                  <input
                    type="checkbox"
                    name="skillIds"
                    value={k.id}
                    checked={on}
                    onChange={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(k.id)) next.delete(k.id);
                        else next.add(k.id);
                        return next;
                      })
                    }
                    className="sr-only"
                  />
                  {k.name}
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-subtle">
            This subject has no skills yet. Add them on the subject page so learners&apos; progress can be charted.
          </p>
        )}
      </div>
    </fieldset>
  );
}
