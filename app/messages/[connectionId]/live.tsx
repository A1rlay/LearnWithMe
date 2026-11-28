"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { sendMessageAction, type SendState } from "../actions";

/** Re-fetches the thread every 5 s while the tab is visible (polling; no websockets at stage 0). */
export function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}

/** Keeps the newest message in view when the list grows. */
export function ScrollAnchor({ count }: { count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "end" });
  }, [count]);
  return <div ref={ref} />;
}

export function Composer({ connectionId }: { connectionId: string }) {
  const [state, action, pending] = useActionState<SendState, FormData>(sendMessageAction.bind(null, connectionId), {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.sentAt) formRef.current?.reset();
  }, [state.sentAt]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      {state.error && <p role="alert" className="text-xs text-danger">{state.error}</p>}
      <div className="flex items-end gap-2">
        <label htmlFor="body" className="sr-only">Message</label>
        <textarea
          id="body"
          name="body"
          required
          rows={1}
          maxLength={2000}
          placeholder="Write a message…"
          className="field max-h-40 min-h-[44px] resize-y"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
        />
        <button type="submit" disabled={pending} className="btn btn-primary h-11 px-5">
          {pending ? "…" : "Send"}
        </button>
      </div>
      <p className="text-[11px] text-subtle">Enter to send · Shift+Enter for a new line</p>
    </form>
  );
}
