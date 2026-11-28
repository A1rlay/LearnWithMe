"use client";

import { useFormStatus } from "react-dom";

import { Spinner } from "@/components/ui/spinner";

/** Submit button that shows it's working and can't be double-submitted. */
export function SubmitButton({ children, className = "btn btn-primary", pendingLabel }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? <><Spinner />{pendingLabel ?? children}</> : children}
    </button>
  );
}
