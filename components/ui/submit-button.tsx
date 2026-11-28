"use client";

import { useFormStatus } from "react-dom";

/** Submit button that shows it's working and can't be double-submitted. */
export function SubmitButton({ children, className = "btn btn-primary", pendingLabel }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? (pendingLabel ?? <><Spinner />{children}</>) : children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="mr-1.5 h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
