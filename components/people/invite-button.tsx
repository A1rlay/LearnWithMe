"use client";

import { useState } from "react";

/** Share (mobile) or copy (desktop) a link that invites a friend to sign up. */
export function InviteButton({ className = "btn btn-primary" }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  async function invite() {
    const url = `${window.location.origin}/signup`;
    const text = "Study with me on Learn With Me. It's free and you only need a username.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Learn With Me", text, url });
        return;
      } catch {
        /* cancelled: fall through to copying */
      }
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <button type="button" onClick={invite} className={className}>
      <span aria-live="polite">{copied ? "Link copied" : "Invite a friend"}</span>
    </button>
  );
}
