"use client";

import { useState } from "react";

/** Optional hint the learner chooses to reveal. Parent should key it per question. */
export function HintToggle({ hint }: { hint: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  if (!hint) return null;
  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="press inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-fg"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
        </svg>
        {open ? "Hide hint" : "Need a hint?"}
      </button>
      {open && <p className="animate-enter mt-2 rounded-xl border border-warning/25 bg-warning/5 p-3 text-sm text-fg">{hint}</p>}
    </div>
  );
}
