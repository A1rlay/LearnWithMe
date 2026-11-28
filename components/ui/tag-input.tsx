"use client";

import { useId, useState } from "react";

/**
 * Type a tag and press Enter (or comma) to add it as a chip below.
 * Posts the tags as one comma-joined hidden field, so the server parser stays the same.
 */
export function TagInput({
  name,
  label,
  defaultValue = [],
  max = 10,
  maxLength = 24,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string[];
  max?: number;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const full = tags.length >= max;

  function add(raw: string) {
    const tag = raw.replace(/,/g, " ").trim().toLowerCase().replace(/\s+/g, " ").slice(0, maxLength);
    if (!tag) return;
    if (tags.includes(tag)) setNote(`"${tag}" is already added.`);
    else if (full) setNote(`You can add up to ${max}.`);
    else {
      setTags([...tags, tag]);
      setNote(`Added ${tag}.`);
    }
    setDraft("");
  }

  function remove(tag: string) {
    setTags(tags.filter((t) => t !== tag));
    setNote(`Removed ${tag}.`);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          maxLength={maxLength}
          disabled={full}
          placeholder={full ? `That's the maximum of ${max}` : placeholder}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) add(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // add the tag instead of submitting the form
              add(draft);
            } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
              remove(tags[tags.length - 1]);
            }
          }}
          onBlur={() => add(draft)}
          autoCapitalize="none"
          className="field"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()} // keep focus so blur doesn't add it twice
          onClick={() => add(draft)}
          disabled={full || !draft.trim()}
          className="btn btn-ghost shrink-0 px-4"
        >
          Add
        </button>
      </div>
      <input type="hidden" name={name} value={tags.join(",")} />

      {tags.length > 0 && (
        <ul aria-label={`${label} added`} className="mt-1 flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t} className="flex items-center gap-1 rounded-full border border-accent-text/40 bg-accent/20 py-1 pl-3 pr-1 text-xs font-medium text-fg">
              {t}
              <button
                type="button"
                onClick={() => remove(t)}
                aria-label={`Remove ${t}`}
                className="grid h-5 w-5 place-items-center rounded-full text-muted transition-colors hover:bg-surface-3 hover:text-fg"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <span className="text-xs text-subtle">
        {hint} <span className="font-mono">{tags.length}/{max}</span>
      </span>
      <span role="status" className="sr-only">{note}</span>
    </div>
  );
}
