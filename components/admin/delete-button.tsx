"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";

export function DeleteButton({
  action,
  label = "this item",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-danger/15 px-4 py-2 text-xs font-bold text-danger ring-1 ring-inset ring-danger/30 transition-colors hover:bg-danger/25 hover:text-danger"
      >
        Delete
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={`Delete ${label}`} className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 p-4 backdrop-blur-md">
          <div className="animate-pop w-full max-w-sm card p-7 shadow-2xl">
            <h2 className="font-display text-2xl text-fg">Delete {label}?</h2>
            <p className="mt-2 text-sm text-muted">This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <form action={action}>
                <SubmitButton className="btn bg-danger text-canvas hover:bg-danger/85" pendingLabel="Deleting…">
                  Yes, delete
                </SubmitButton>
              </form>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
